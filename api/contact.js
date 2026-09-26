'use strict';
/**
 * POST /api/contact — saves one contact-form message to Supabase.
 *
 * Runs on Vercel (Node, no dependencies). The contact form (main.js 17) posts
 * JSON; this route checks it, quietly drops obvious bots, and forwards a
 * clean copy to the database function public.submit_lead together with
 * SUBMIT_TOKEN. The database refuses any call without that token, and the
 * public can neither read nor write the leads table.
 *
 * Replies the form relies on:
 *   200 {ok:true}                          saved (or a bot quietly dropped)
 *   400 {ok:false,error:'invalid',field}   fix that field and resend
 *   403 / 405 / 413 / 415                  not a same-site JSON POST
 *   429 {ok:false,error:'rate_limited'}    per-IP limit or the site-wide database cap
 *   5xx                                    temporary
 * On a 429 or 5xx the form opens the visitor's email app with the message
 * filled in, so a tripped cap never loses a lead. The database cap
 * (20 per 10 minutes) stays as the storage backstop.
 *
 * Environment (Vercel → carlgabriel → Settings → Environment Variables):
 *   SUPABASE_URL              https://<ref>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY  sb_publishable_…
 *   SUBMIT_TOKEN              write token; its SHA-256 is in private.write_tokens
 */
const { send } = require('./_respond');

// Only an abuse guard; validate() enforces the per-field lengths. The longest
// valid payload is about 5,774 characters across the fields, and JSON escapes a
// control character to 6 bytes, so the worst valid body is about 35 KB.
const MAX_BODY_BYTES = 40000;
const MIN_FILL_MS = 1500;          // people take longer than this to fill the form
const WINDOW_MS = 10 * 60 * 1000;  // best-effort, per server instance: 5 messages
const MAX_PER_WINDOW = 5;          //   per 10 minutes per IP (the database caps the whole site too)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const hits = new Map();

function limited(ip, now) {
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false; // browsers always send Origin on a POST
  try {
    return new URL(origin).host === (req.headers['x-forwarded-host'] || req.headers.host);
  } catch (err) {
    return false;
  }
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return req.headers['x-real-ip'] || fwd || (req.socket && req.socket.remoteAddress) || 'unknown';
}

class HttpError extends Error {
  constructor(status) { super(String(status)); this.status = status; }
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new HttpError(413)); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJson(req) {
  let raw;
  try { raw = req.body; } catch (err) { throw new HttpError(400); } // Vercel's parser throws on bad JSON
  if (raw === undefined || raw === null || raw === '') raw = await readRaw(req);
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new HttpError(413);
    try { raw = JSON.parse(raw); } catch (err) { throw new HttpError(400); }
  } else if (Buffer.byteLength(JSON.stringify(raw)) > MAX_BODY_BYTES) {
    throw new HttpError(413);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400);
  return raw;
}

const text = v => (typeof v === 'string' ? v.trim() : '');

/* the clean copy, or the name of the first bad field */
function validate(body) {
  const lead = {
    name: text(body.name),
    email: text(body.email),
    store: text(body.store),
    message: text(body.message),
    page: text(body.page),
  };
  if (!lead.name || lead.name.length > 120) return { field: 'name' };
  if (lead.email.length < 3 || lead.email.length > 254 || !EMAIL_RE.test(lead.email)) return { field: 'email' };
  if (lead.store.length > 200) return { field: 'store' };
  if (!lead.message || lead.message.length > 5000) return { field: 'message' };
  if (lead.page && (lead.page.length > 200 || lead.page.charAt(0) !== '/')) return { field: 'page' };
  return { lead };
}

async function save(lead, env) {
  let res;
  try {
    res = await fetch(env.url + '/rest/v1/rpc/submit_lead', {
      method: 'POST',
      headers: { apikey: env.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_token: env.token, p_name: lead.name, p_email: lead.email,
        p_brand: lead.store, p_message: lead.message, p_page: lead.page,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error('[contact] supabase unreachable:', err && err.name);
    return err && (err.name === 'TimeoutError' || err.name === 'AbortError') ? 504 : 502;
  }
  if (res.ok) return 200;
  let detail = {};
  try { detail = await res.json(); } catch (err) { /* not JSON */ }
  if (res.status === 400 && detail && detail.message === 'rate_limited') return 429;
  if (res.status === 400 && detail && detail.code === '23514') return 400;
  // 401/403 means the token or key is wrong: a setup problem, never the visitor's fault
  console.error('[contact] supabase refused:', res.status, detail && detail.code);
  return 502;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method' });
  }
  if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'origin' });
  if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) {
    return send(res, 415, { ok: false, error: 'content_type' });
  }

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 400;
    return send(res, status, status === 413 ? { ok: false, error: 'too_large' } : { ok: false, error: 'invalid' });
  }

  // bots: a filled hidden field, or a form "filled" faster than a person can type
  if (text(body.website)) return send(res, 200, { ok: true });
  if (typeof body.elapsed === 'number' && body.elapsed < MIN_FILL_MS) return send(res, 200, { ok: true });

  const checked = validate(body);
  if (checked.field) return send(res, 400, { ok: false, error: 'invalid', field: checked.field });

  if (limited(clientIp(req), Date.now())) return send(res, 429, { ok: false, error: 'rate_limited' });

  const env = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLISHABLE_KEY,
    token: process.env.SUBMIT_TOKEN,
  };
  if (!env.url || !env.key || !env.token) {
    console.error('[contact] missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY or SUBMIT_TOKEN');
    return send(res, 503, { ok: false, error: 'not_configured' });
  }

  const status = await save(checked.lead, env);
  if (status === 200) return send(res, 200, { ok: true });
  if (status === 429) return send(res, 429, { ok: false, error: 'rate_limited' });
  if (status === 400) return send(res, 400, { ok: false, error: 'invalid' });
  return send(res, status, { ok: false, error: 'save_failed' });
};
