'use strict';
/* Validator for _tools/seo/seo-data.json (the SEO/GEO/AEO copy of carlgabriel.vercel.app).
   Pure function: validate(data) returns a list of problems; build-seo.js refuses to write when
   it is not empty, and runs checkText() over the FAQ text it reads from the pages too. The rules
   come from the vault:
   - SEO Copy Rules and Validators: title 15-60 chars, description 120-155 chars.
   - Human Voice Copy Rules: no em or en dashes, none of the banned words.
   - About Carl / LinkedIn rules: the employer name never appears in public machine-readable copy;
     only the verified metrics may be stated (the larger client-scale figures stay out); no
     Google Ads claims (his Google Ads experience is minimal).
   Every fact-check catch becomes a rule here (the ONTHEGO lesson). */
const crypto = require('crypto');

const BANNED_WORDS = ['elevate', 'unlock', 'discover', 'delve', 'seamless', 'transformative', 'game-changer',
  'robust', 'leverage', 'empower', 'unleash', 'journey', 'tapestry'];
// The employer's name is confidential and this repo is public, so the rule holds a sha256 of the
// name (lowercase, letters only) instead of spelling it out, and hashes every 11-letter run.
const CONFIDENTIAL_SHA256 = 'c094b0603abf4ad19badc439ab4b3458ad91d934c847acc049c80bb07aec0ea3';
const CONFIDENTIAL_LEN = 11;
// client-scale or unverified figures that must not be restated as Carl's own in machine-readable copy
const UNVERIFIED = [/60\s*M\+?/i, /\b1\s*B\+?/i, /\b300\s+UGC/i, /3\.8\s*M/i, /99,?843/, /US\$\s*5K/i, /₱?\s*300\s*K/i, /200,000/, /1\.24\s*M/i, /4\.99\s*M/i];
const GOOGLE_ADS = /google\s+ads/i;
const DASHES = /[–—]/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_SAME_AS = 2;   // Instagram + Facebook; LinkedIn / OnlineJobs join when Carl adds them

function namesEmployer(s) {
  const t = String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (let i = 0; i + CONFIDENTIAL_LEN <= t.length; i++) {
    if (crypto.createHash('sha256').update(t.slice(i, i + CONFIDENTIAL_LEN)).digest('hex') === CONFIDENTIAL_SHA256) return true;
  }
  return false;
}

/* The copy rules for one public string; returns problems prefixed with where it came from. */
function checkText(where, s) {
  const errors = [];
  if (namesEmployer(s)) errors.push(`${where}: names the confidential employer`);
  if (DASHES.test(s)) errors.push(`${where}: contains an em or en dash`);
  if (GOOGLE_ADS.test(s)) errors.push(`${where}: mentions Google Ads`);
  for (const w of BANNED_WORDS) {
    if (new RegExp('\\b' + w.replace('-', '\\-') + '\\b', 'i').test(s)) errors.push(`${where}: banned word "${w}"`);
  }
  for (const rx of UNVERIFIED) {
    if (rx.test(s)) errors.push(`${where}: unverified figure ${rx}`);
  }
  return errors;
}

function strings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, path + '[' + i + ']', out));
  else if (value && typeof value === 'object') Object.keys(value).forEach(k => strings(value[k], path + '.' + k, out));
  return out;
}

function validate(data) {
  const errors = [];
  const err = (msg) => errors.push(msg);

  if (!/^https:\/\/[^/]+$/.test(data.site || '')) err('site must be an https origin with no trailing slash');
  if (!DATE.test(data.dateModified || '')) err('dateModified must be YYYY-MM-DD');

  const titles = new Set();
  const descs = new Set();
  for (const p of data.pages || []) {
    const t = p.title || '';
    const d = p.description || '';
    if (t.length < 15 || t.length > 60) err(`${p.file}: title is ${t.length} chars (15-60)`);
    if (!t.includes('Carl Gabriel Piramo')) err(`${p.file}: title must name Carl Gabriel Piramo`);
    if (d.length < 120 || d.length > 155) err(`${p.file}: description is ${d.length} chars (120-155)`);
    if (p.ogDescription && (p.ogDescription.length < 70 || p.ogDescription.length > 200)) err(`${p.file}: ogDescription is ${p.ogDescription.length} chars (70-200)`);
    if (titles.has(t)) err(`${p.file}: duplicate title`);
    if (descs.has(d)) err(`${p.file}: duplicate description`);
    titles.add(t); descs.add(d);
    if (p.keyword && !(t + ' ' + d).toLowerCase().includes(p.keyword.split(' ')[0])) err(`${p.file}: title/description never mention its keyword "${p.keyword}"`);
    if (p.path !== '/' && !p.crumb) err(`${p.file}: inner page needs a breadcrumb name`);
  }
  if ((data.pages || []).length !== 6) err('expected the 6 public pages');

  const sameAs = (data.person && data.person.sameAs) || [];
  if (sameAs.length < MIN_SAME_AS) err(`person.sameAs needs ${MIN_SAME_AS}+ profiles`);
  if (sameAs.some(u => !/^https:\/\//.test(u))) err('person.sameAs must be https only');
  if (new Set(sameAs).size !== sameAs.length) err('person.sameAs has duplicates');

  for (const [path, s] of strings(data, 'data', [])) errors.push(...checkText(path, s));
  return errors;
}

module.exports = { validate, checkText, namesEmployer, BANNED_WORDS };

if (require.main === module) {
  const data = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'seo-data.json'), 'utf8'));
  const errors = validate(data);
  errors.forEach(e => console.log('BLOCK ' + e));
  console.log(errors.length ? `FAIL: ${errors.length} problem(s)` : 'seo-data.json OK');
  process.exit(errors.length ? 1 : 0);
}
