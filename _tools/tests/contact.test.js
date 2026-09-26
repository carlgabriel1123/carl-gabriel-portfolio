'use strict';
/* Tests for api/contact.js and api/health.js (node:test, no dependencies).
   Run: node --test _tools/tests/
   Supabase is never called: global fetch is replaced per test. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const ENV = {
  SUPABASE_URL: 'https://example-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUBMIT_TOKEN: 'a'.repeat(64),
};

/* fresh module per test: the per-IP limiter lives in module state */
function load(name) {
  const file = path.join(ROOT, 'api', name);
  delete require.cache[require.resolve(file)];
  return require(file);
}

function makeReq(opts) {
  const o = opts || {};
  const body = o.body === undefined ? JSON.stringify(validBody()) : o.body;
  const req = Readable.from(typeof body === 'string' ? [Buffer.from(body)] : []);
  req.method = o.method || 'POST';
  req.headers = Object.assign({
    host: 'carlgabriel.vercel.app',
    origin: 'https://carlgabriel.vercel.app',
    'content-type': 'application/json',
    'x-real-ip': o.ip || '203.0.113.7',
  }, o.headers || {});
  if (o.parsedBody !== undefined) req.body = o.parsedBody;
  return req;
}

function makeRes() {
  return {
    statusCode: 200, headers: {}, text: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(chunk) { this.text = chunk ? String(chunk) : ''; this.ended = true; },
    json() { return JSON.parse(this.text); },
  };
}

function validBody(extra) {
  return Object.assign({
    name: 'Jane Founder', email: 'Jane@Brand.com', store: 'brand.com',
    message: 'We sell supplements and want Meta ads help.', page: '/contact.html',
    website: '', elapsed: 9000,
  }, extra || {});
}

function withEnv(env, fn) {
  const saved = {};
  Object.keys(ENV).forEach(k => { saved[k] = process.env[k]; delete process.env[k]; });
  Object.assign(process.env, env);
  return Promise.resolve().then(fn).finally(() => {
    Object.keys(ENV).forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  });
}

function stubFetch(status, body) {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
  };
  return calls;
}

async function run(handler, reqOpts) {
  const res = makeRes();
  await handler(makeReq(reqOpts), res);
  return res;
}

test('saves a valid message and forwards a clean copy with the token', () => withEnv(ENV, async () => {
  const calls = stubFetch(200, '5b0c0f4e-0000-4000-8000-000000000000');
  const res = await run(load('contact.js'));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ENV.SUPABASE_URL + '/rest/v1/rpc/submit_lead');
  assert.equal(calls[0].init.headers.apikey, ENV.SUPABASE_PUBLISHABLE_KEY);
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(sent, {
    p_token: ENV.SUBMIT_TOKEN, p_name: 'Jane Founder', p_email: 'Jane@Brand.com', p_brand: 'brand.com',
    p_message: 'We sell supplements and want Meta ads help.', p_page: '/contact.html',
  });
}));

test('accepts a body Vercel already parsed', () => withEnv(ENV, async () => {
  stubFetch(200, 'id');
  const res = await run(load('contact.js'), { body: '', parsedBody: validBody() });
  assert.equal(res.statusCode, 200);
}));

test('rejects other methods with 405 and an Allow header', () => withEnv(ENV, async () => {
  const res = await run(load('contact.js'), { method: 'GET', body: '' });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
}));

test('rejects a cross-site or missing Origin with 403', () => withEnv(ENV, async () => {
  stubFetch(200, 'id');
  const h = load('contact.js');
  assert.equal((await run(h, { headers: { origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await run(h, { headers: { origin: undefined } })).statusCode, 403);
  assert.equal((await run(h, { headers: { origin: 'not a url' } })).statusCode, 403);
}));

test('rejects non-JSON content types with 415 and oversized bodies with 413', () => withEnv(ENV, async () => {
  const h = load('contact.js');
  assert.equal((await run(h, { headers: { 'content-type': 'text/plain' } })).statusCode, 415);
  const big = JSON.stringify(validBody({ message: 'x'.repeat(20000) }));
  assert.equal((await run(h, { body: big })).statusCode, 413);
}));

test('rejects malformed JSON with 400', () => withEnv(ENV, async () => {
  const res = await run(load('contact.js'), { body: '{"name":' });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().error, 'invalid');
}));

test('drops a filled honeypot or an instant submit quietly, without saving', () => withEnv(ENV, async () => {
  const calls = stubFetch(200, 'id');
  const h = load('contact.js');
  const trap = await run(h, { body: JSON.stringify(validBody({ website: 'http://spam.example' })) });
  const fast = await run(h, { body: JSON.stringify(validBody({ elapsed: 300 })) });
  assert.equal(trap.statusCode, 200);
  assert.equal(fast.statusCode, 200);
  assert.equal(calls.length, 0);
}));

test('names the invalid field with 400', () => withEnv(ENV, async () => {
  stubFetch(200, 'id');
  const h = load('contact.js');
  const cases = [
    [{ name: '' }, 'name'], [{ name: 'x'.repeat(121) }, 'name'],
    [{ email: 'nope' }, 'email'], [{ email: 'a@b' }, 'email'],
    [{ store: 'x'.repeat(201) }, 'store'],
    [{ message: '   ' }, 'message'], [{ message: 'x'.repeat(5001) }, 'message'],
    [{ page: 'https://elsewhere' }, 'page'],
  ];
  for (const [extra, fieldName] of cases) {
    const res = await run(h, { body: JSON.stringify(validBody(extra)), ip: '198.51.100.' + fieldName.length });
    assert.equal(res.statusCode, 400, JSON.stringify(extra));
    assert.deepEqual(res.json(), { ok: false, error: 'invalid', field: fieldName });
  }
}));

test('limits one IP to 5 messages per window', () => withEnv(ENV, async () => {
  stubFetch(200, 'id');
  const h = load('contact.js');
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await run(h, { ip: '192.0.2.50' })).statusCode);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
  assert.equal((await run(h, { ip: '192.0.2.51' })).statusCode, 200);
}));

test('answers 503 when the environment is missing', () => withEnv({}, async () => {
  const res = await run(load('contact.js'));
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().error, 'not_configured');
}));

test('maps database replies: flood cap 429, constraint 400, auth/other 502', () => withEnv(ENV, async () => {
  const h = load('contact.js');
  stubFetch(400, { code: 'P0001', message: 'rate_limited' });
  assert.equal((await run(h, { ip: '10.0.0.1' })).statusCode, 429);
  stubFetch(400, { code: '23514', message: 'check constraint' });
  assert.equal((await run(h, { ip: '10.0.0.2' })).statusCode, 400);
  stubFetch(401, { code: '42501', message: 'forbidden' });
  assert.equal((await run(h, { ip: '10.0.0.3' })).statusCode, 502);
  stubFetch(500, {});
  assert.equal((await run(h, { ip: '10.0.0.4' })).statusCode, 502);
}));

test('answers 504 when Supabase times out and 502 on a network error', () => withEnv(ENV, async () => {
  const h = load('contact.js');
  global.fetch = async () => { const e = new Error('timeout'); e.name = 'TimeoutError'; throw e; };
  assert.equal((await run(h, { ip: '10.0.1.1' })).statusCode, 504);
  global.fetch = async () => { throw new TypeError('fetch failed'); };
  assert.equal((await run(h, { ip: '10.0.1.2' })).statusCode, 502);
}));

test('health pings the database', () => withEnv(ENV, async () => {
  const calls = stubFetch(200, 'pong');
  const res = await run(load('health.js'), { method: 'GET', body: '' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true, database: 'reachable' });
  assert.equal(calls[0].url, ENV.SUPABASE_URL + '/rest/v1/rpc/ping');
  stubFetch(503, {});
  assert.equal((await run(load('health.js'), { method: 'GET', body: '' })).statusCode, 503);
}));

test('health reports a missing environment', () => withEnv({}, async () => {
  const res = await run(load('health.js'), { method: 'GET', body: '' });
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().database, 'not-configured');
}));
