#!/usr/bin/env node
'use strict';
/*
 * Read-only four-dimension audit (SEO / AIO / AEO / GEO) of carlgabriel.vercel.app.
 *
 * Port of the vault method "SEO AEO AIO GEO Method and Scoring" (the onthegosg/audit_baseline.js
 * rubric plus the reusable verifier extras), adapted from a Shopify store to a personal-brand
 * service site:
 *   - Product / offer / brand   -> Person + ProfessionalService / Service (provider, offer detail)
 *   - Organization / OnlineStore -> Person (the entity a generative engine should cite)
 *   - catalog checks            -> per-page checks (alt text, bodies, entity attribution per page)
 *   - blog "can answer queries" -> a visible FAQ on at least one page
 *
 * Score: a flat list of pass/fail checks; Math.round(passed / total * 100) per dimension and
 * OVERALL. A page that is not HTTP 200 records one FAIL and skips its other checks (the
 * denominator moves, as in the rubric). Conditional checks (FAQ ones) only count on pages that
 * carry a visible FAQ or FAQPage schema. Live thresholds are the loose ones (title 15-70,
 * description 70-165); the strict copy-validator ones (title <= 60, description 120-155) are
 * printed as WARN lines and never scored.
 *
 * Report-only: it never writes anything and always exits 0.
 *
 *   node _tools/seo-audit.js                       audit https://carlgabriel.vercel.app
 *   node _tools/seo-audit.js --site http://localhost:8125
 *                                                  audit a local server (canonical host stays
 *                                                  carlgabriel.vercel.app; change with --canonical)
 *   node _tools/seo-audit.js --facts               also print per-page facts
 *   node _tools/seo-audit.js --json                print one JSON report instead of text
 *
 * The CHECKS array is exported so a later phase can require() it as its verifier.
 */

const argv = process.argv.slice(2);
function opt(name, dflt) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
}
const trimSlash = (u) => String(u).replace(/\/+$/, '');

const SITE = trimSlash(opt('--site', 'https://carlgabriel.vercel.app'));
const CANONICAL_ORIGIN = trimSlash(opt('--canonical', 'https://carlgabriel.vercel.app'));
const CANONICAL_HOST = new URL(CANONICAL_ORIGIN).host;
const PERSON_NAME = 'Carl Gabriel Piramo';
const UA = 'Mozilla/5.0 SEO-verify';

const PAGES = [
  { path: '/', type: 'home' },
  { path: '/work.html', type: 'work' },
  { path: '/results.html', type: 'results' },
  { path: '/services.html', type: 'services' },
  { path: '/about.html', type: 'about' },
  { path: '/contact.html', type: 'contact' },
];
const MISSING_PATH = '/seo-verify-missing-page';   // must 404 with noindex, never a soft 200
const CLEAN_URL_PROBE = '/work';                  // extensionless twin of a real page
const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'Google-Extended'];

const LIVE = { titleMin: 15, titleMax: 70, descMin: 70, descMax: 165, ogDescMin: 40, words: 250, h2: 2, sameAs: 3 };
const STRICT = { titleMax: 60, descMin: 120, descMax: 155 };
const QUESTION_RE = /\?\s*$|^(how|what|why|when|where|is|are|can|does|do)\b/i;
const SERVICE_TYPES = ['Service', 'ProfessionalService'];
const ENTITY_TYPES = ['Person', 'Organization', 'ProfessionalService', 'LocalBusiness', 'OnlineBusiness'];

/* ------------------------------------------------------------------ fetch */

async function get(url) {
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.text();
    return { url, status: res.status, location: res.headers.get('location') || '', type: res.headers.get('content-type') || '', body };
  } catch (e) {
    return { url, status: 0, location: '', type: '', body: '', error: e.message };
  }
}

/* ------------------------------------------------------------------ parsing (stdlib only) */

const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·', times: '×', rarr: '→', larr: '←',
  copy: '©', reg: '®', trade: '™', bull: '•', deg: '°', laquo: '«', raquo: '»', shy: '',
};
function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return Object.prototype.hasOwnProperty.call(ENT, e.toLowerCase()) ? ENT[e.toLowerCase()] : m;
  });
}
const squash = (s) => String(s).replace(/\s+/g, ' ').trim();
const textOf = (html) => squash(decode(String(html).replace(/<[^>]*>/g, ' ')));
const chars = (s) => [...String(s)].length;
const normQ = (s) => squash(String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"'));

/* drop comments and non-text elements so markup inside JS strings is never read as page markup */
function stripNonText(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ');
}
function attrs(tag) {
  const out = {};
  const body = tag.replace(/^<\s*[a-z0-9-]+/i, '').replace(/\/?\s*>$/, '');
  const re = /([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(body))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}
const tagsOf = (html, name) => (String(html).match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || []).map(attrs);
function innerOf(html, name) {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}\\s*>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(textOf(m[1]));
  return out;
}

function jsonLdBlocks(rawHtml) {
  const out = [];
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = re.exec(rawHtml))) {
    const raw = m[1].trim();
    try { out.push({ ok: true, data: JSON.parse(raw) }); } catch (e) { out.push({ ok: false, error: e.message }); }
  }
  return out;
}
function walk(v, fn, depth = 0) {
  if (v == null || depth > 60) return;
  if (Array.isArray(v)) { for (const x of v) walk(x, fn, depth + 1); return; }
  if (typeof v === 'object') { fn(v); for (const k of Object.keys(v)) walk(v[k], fn, depth + 1); }
}
const typesOf = (n) => [].concat(n && n['@type'] ? n['@type'] : []).map(String);
const isType = (n, list) => typesOf(n).some((t) => list.includes(t));
const isDefinition = (n) => Object.keys(n).some((k) => !['@id', '@type', '@context'].includes(k));
function definitions(nodes, list) {
  const seen = new Set();
  const out = [];
  for (const n of nodes) {
    if (!isType(n, list) || !isDefinition(n)) continue;
    const id = n['@id'];
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    out.push(n);
  }
  return out;
}

/* ------------------------------------------------------------------ page facts */

function analyse(page, res) {
  const f = { path: page.path, type: page.type, url: SITE + page.path, status: res.status, location: res.location, error: res.error || '' };
  if (res.status !== 200) return f;

  const raw = res.body;
  const doc = stripNonText(raw);
  const body = (doc.match(/<body\b[^>]*>([\s\S]*)<\/body\s*>/i) || [null, doc])[1];

  const meta = {};
  for (const a of tagsOf(doc, 'meta')) {
    const key = (a.property || a.name || '').toLowerCase();
    if (key && !(key in meta)) meta[key] = squash(a.content || '');
  }
  const canon = tagsOf(doc, 'link').find((a) => (a.rel || '').toLowerCase().split(/\s+/).includes('canonical'));

  f.lang = (tagsOf(doc, 'html')[0] || {}).lang || '';
  f.title = innerOf(doc, 'title')[0] || '';
  f.titleLen = chars(f.title);
  f.description = meta.description || '';
  f.descLen = chars(f.description);
  f.robots = meta.robots || '';
  f.canonical = canon ? canon.href || '' : '';
  f.ogTitle = meta['og:title'] || '';
  f.ogDescription = meta['og:description'] || '';
  f.ogImage = meta['og:image'] || '';
  f.ogUrl = meta['og:url'] || '';
  f.twitterCard = meta['twitter:card'] || '';

  f.h1 = innerOf(body, 'h1');
  f.h2 = innerOf(body, 'h2');
  const h3 = innerOf(body, 'h3');
  const h4 = innerOf(body, 'h4');
  f.questionHeadings = [...f.h1, ...f.h2].filter((t) => QUESTION_RE.test(t));
  f.questionH3 = [...h3, ...h4].filter((t) => QUESTION_RE.test(t));

  f.text = textOf(body);
  f.words = f.text.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

  const imgs = tagsOf(body, 'img');
  f.imgCount = imgs.length;
  f.imgNoAlt = imgs.filter((a) => !('alt' in a)).map((a) => a.src || '(no src)');
  f.imgEmptyAlt = imgs.filter((a) => 'alt' in a && !a.alt.trim()).map((a) => a.src || '(no src)');

  f.blocks = jsonLdBlocks(raw);
  f.nodes = [];
  for (const b of f.blocks) if (b.ok) walk(b.data, (n) => f.nodes.push(n));
  f.jsonLdTypes = [...new Set(f.nodes.flatMap(typesOf))];

  /* visible FAQ: an faq-marked section (id/class "faq", or an FAQ heading) holding a question,
     or two or more <details>/<dt> questions. Elements the site marks data-faq-q (the source
     build-seo.js reads FAQPage from) count as visible questions at any heading level. */
  const faqMarker = /\s(?:id|class)\s*=\s*["'][^"']*\bfaq\b/i.test(body) ||
    [...f.h2, ...h3].some((t) => /\bFAQs?\b|frequently asked/i.test(t));
  const listQs = [...innerOf(body, 'summary'), ...innerOf(body, 'dt')].filter((t) => /\?$/.test(t));
  const markedQs = [...body.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\sdata-faq-q\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map((m) => textOf(m[2]));
  f.visibleQuestions = [...new Set([...h3, ...h4, ...listQs, ...markedQs].filter((t) => /\?$/.test(t)))];
  f.hasVisibleFaq = (faqMarker && f.visibleQuestions.length >= 1) || listQs.length >= 2;

  f.faqPages = definitions(f.nodes, ['FAQPage']);
  f.faqQuestions = f.faqPages.flatMap((n) => [].concat(n.mainEntity || [])).filter((q) => q && isType(q, ['Question']));
  return f;
}

/* ------------------------------------------------------------------ helpers used by checks */

const home = (ctx) => ctx.pages.find((p) => p.type === 'home' && p.status === 200);
const allNodes = (ctx) => ctx.pages.filter((p) => p.status === 200).flatMap((p) => p.nodes);
function mainPerson(p) {
  const people = definitions(p ? p.nodes : [], ['Person']);
  return people.find((n) => squash(n.name || '') === PERSON_NAME) || people[0] || null;
}
function personIds(ctx) {
  const h = home(ctx);
  return new Set(definitions(h ? h.nodes : [], ['Person']).map((n) => n['@id']).filter(Boolean));
}
function robotsBlocksAI(txt) {
  /* group-aware: a bot is blocked when the group that applies to it (its own name, else "*")
     carries a bare "Disallow: /" and no "Allow: /" */
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const line of String(txt).split(/\r?\n/)) {
    const l = line.replace(/#.*/, '').trim();
    const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && (key === 'disallow' || key === 'allow')) cur.rules.push(`${key}:${val}`);
    }
  }
  const blocked = [];
  for (const bot of AI_BOTS) {
    const g = groups.find((x) => x.agents.includes(bot.toLowerCase())) || groups.find((x) => x.agents.includes('*'));
    if (g && g.rules.includes('disallow:/') && !g.rules.includes('allow:/')) blocked.push(bot);
  }
  return blocked;
}
const looksHtml = (r) => /text\/html/i.test(r.type) || /^\s*<(!doctype|html)/i.test(r.body);

/* ------------------------------------------------------------------ the check list
   scope 'page': run once per reachable page whose type is in `types` (all when omitted) and
   for which `applies(page)` is true (always when omitted). scope 'site': run once.
   run() returns [pass, detail]. */

const CHECKS = [
  /* ---------- SEO, per page ---------- */
  { id: 'reachable', dim: 'SEO', scope: 'page', label: 'Page reachable (HTTP 200)',
    run: (p) => [p.status === 200, `HTTP ${p.status}${p.location ? ' -> ' + p.location : ''}${p.error ? ' ' + p.error : ''}`] },
  { id: 'title-length', dim: 'SEO', scope: 'page', label: `Title ${LIVE.titleMin}-${LIVE.titleMax} chars`,
    run: (p) => [p.titleLen >= LIVE.titleMin && p.titleLen <= LIVE.titleMax, `${p.titleLen} chars`] },
  { id: 'description-length', dim: 'SEO', scope: 'page', label: `Meta description ${LIVE.descMin}-${LIVE.descMax} chars`,
    run: (p) => [p.descLen >= LIVE.descMin && p.descLen <= LIVE.descMax, p.description ? `${p.descLen} chars` : 'missing'] },
  { id: 'canonical', dim: 'SEO', scope: 'page', label: `Canonical on ${CANONICAL_HOST}`,
    run: (p) => [!!p.canonical && p.canonical.includes(CANONICAL_HOST), p.canonical || 'missing'] },
  { id: 'one-h1', dim: 'SEO', scope: 'page', label: 'Exactly one H1',
    run: (p) => [p.h1.length === 1, `${p.h1.length} H1`] },
  { id: 'og-title', dim: 'SEO', scope: 'page', label: 'og:title present and not the bare name',
    run: (p) => [!!p.ogTitle && p.ogTitle.toLowerCase() !== PERSON_NAME.toLowerCase(), p.ogTitle || 'missing'] },
  { id: 'og-description', dim: 'SEO', scope: 'page', label: `og:description > ${LIVE.ogDescMin} chars`,
    run: (p) => [chars(p.ogDescription) > LIVE.ogDescMin, p.ogDescription ? `${chars(p.ogDescription)} chars` : 'missing'] },
  { id: 'og-image-https', dim: 'SEO', scope: 'page', label: 'og:image is https',
    run: (p) => [/^https:/i.test(p.ogImage), p.ogImage || 'missing'] },
  { id: 'twitter-card', dim: 'SEO', scope: 'page', label: 'twitter:card present',
    run: (p) => [!!p.twitterCard, p.twitterCard || 'missing'] },
  { id: 'breadcrumb', dim: 'SEO', scope: 'page', types: ['work', 'results', 'services', 'about', 'contact'], label: 'BreadcrumbList schema (inner page)',
    run: (p) => [p.jsonLdTypes.includes('BreadcrumbList'), p.jsonLdTypes.includes('BreadcrumbList') ? 'present' : 'none'] },
  { id: 'img-alt', dim: 'SEO', scope: 'page', label: 'Every <img> has an alt attribute',
    run: (p) => [p.imgNoAlt.length === 0, `${p.imgNoAlt.length} of ${p.imgCount} missing${p.imgNoAlt.length ? ': ' + p.imgNoAlt.join(', ') : ''}`] },

  /* ---------- AIO, per page ---------- */
  { id: 'jsonld-present', dim: 'AIO', scope: 'page', label: 'JSON-LD present',
    run: (p) => [p.blocks.length > 0, `${p.blocks.length} block(s)`] },
  { id: 'jsonld-valid', dim: 'AIO', scope: 'page', label: 'JSON-LD blocks > 0 and every block parses',
    run: (p) => {
      const bad = p.blocks.filter((b) => !b.ok);
      return [p.blocks.length > 0 && bad.length === 0, p.blocks.length ? `${bad.length} of ${p.blocks.length} unparseable${bad.length ? ': ' + bad[0].error : ''}` : 'no blocks'];
    } },
  { id: 'words', dim: 'AIO', scope: 'page', label: `${LIVE.words}+ server-rendered words`,
    run: (p) => [p.words >= LIVE.words, `${p.words} words`] },
  { id: 'h2-structure', dim: 'AIO', scope: 'page', label: `${LIVE.h2}+ H2`,
    run: (p) => [p.h2.length >= LIVE.h2, `${p.h2.length} H2`] },

  /* ---------- AEO, per page ---------- */
  { id: 'question-heading', dim: 'AEO', scope: 'page', label: 'Question-shaped H1/H2',
    run: (p) => [p.questionHeadings.length > 0, p.questionHeadings[0] || 'none'] },
  { id: 'faqpage-present', dim: 'AEO', scope: 'page', label: 'FAQPage schema where a visible FAQ exists',
    applies: (p) => p.hasVisibleFaq || p.faqPages.length > 0,
    run: (p) => [p.faqPages.length > 0, p.faqPages.length ? `${p.faqPages.length} FAQPage` : `none (page shows ${p.visibleQuestions.length} FAQ questions)`] },
  { id: 'faqpage-one', dim: 'AEO', scope: 'page', label: 'Exactly one FAQPage with at least one Question',
    applies: (p) => p.hasVisibleFaq || p.faqPages.length > 0,
    run: (p) => [p.faqPages.length === 1 && p.faqQuestions.length >= 1, `${p.faqPages.length} FAQPage, ${p.faqQuestions.length} Question`] },
  { id: 'faq-first-visible', dim: 'AEO', scope: 'page', label: 'First FAQPage question is visible on the page',
    applies: (p) => p.hasVisibleFaq || p.faqPages.length > 0,
    run: (p) => {
      const q = p.faqQuestions[0];
      if (!q || !q.name) return [false, 'no FAQPage question'];
      return [normQ(p.text).includes(normQ(q.name)), q.name];
    } },

  /* ---------- GEO, per page ---------- */
  { id: 'person-attribution', dim: 'GEO', scope: 'page', label: 'Page JSON-LD defines or references the Person',
    run: (p, ctx) => {
      const ids = personIds(ctx);
      const ok = p.nodes.some((n) => isType(n, ['Person']) || (n['@id'] && ids.has(n['@id'])));
      return [ok, ok ? 'Person linked' : 'no Person node or Person @id reference'];
    } },
  { id: 'person-one', dim: 'GEO', scope: 'page', types: ['home'], label: 'Exactly one Person entity (homepage)',
    run: (p) => { const n = definitions(p.nodes, ['Person']).length; return [n === 1, `${n} Person`]; } },
  { id: 'person-sameas', dim: 'GEO', scope: 'page', types: ['home'], label: `Person/Org sameAs ${LIVE.sameAs}+ https URLs (homepage)`,
    run: (p) => {
      const best = definitions(p.nodes, ENTITY_TYPES)
        .map((n) => [].concat(n.sameAs || []).filter((u) => /^https:\/\//i.test(String(u))).length)
        .reduce((a, b) => Math.max(a, b), 0);
      return [best >= LIVE.sameAs, `${best} https sameAs`];
    } },
  { id: 'person-location-contact', dim: 'GEO', scope: 'page', types: ['home'], label: 'address/areaServed plus email/telephone (homepage)',
    run: (p) => {
      const ents = definitions(p.nodes, ENTITY_TYPES);
      const loc = ents.some((n) => n.address || n.areaServed || n.homeLocation || n.workLocation);
      const contact = ents.some((n) => n.email || n.telephone ||
        [].concat(n.contactPoint || []).some((c) => c && (c.email || c.telephone)));
      return [loc && contact, `location ${loc ? 'yes' : 'no'}, contact ${contact ? 'yes' : 'no'}`];
    } },
  { id: 'person-description', dim: 'GEO', scope: 'page', types: ['home'], label: 'Person description (homepage)',
    run: (p) => { const n = mainPerson(p); return [!!(n && n.description), n ? (n.description ? 'present' : 'Person has no description') : 'no Person']; } },
  { id: 'person-id', dim: 'GEO', scope: 'page', types: ['home'], label: 'Person @id (homepage)',
    run: (p) => { const n = mainPerson(p); return [!!(n && n['@id']), n ? n['@id'] || 'Person has no @id' : 'no Person']; } },
  { id: 'service-schema', dim: 'GEO', scope: 'page', types: ['services'], label: 'Service/ProfessionalService schema (services page)',
    run: (p) => { const n = definitions(p.nodes, SERVICE_TYPES).length; return [n > 0, `${n} Service/ProfessionalService`]; } },
  { id: 'service-provider', dim: 'GEO', scope: 'page', types: ['services'], label: 'Service names its provider (services page)',
    run: (p) => {
      const ok = definitions(p.nodes, SERVICE_TYPES).some((n) => n.provider || n.brand || n.founder || n.employee);
      return [ok, ok ? 'provider present' : 'no provider/brand/founder'];
    } },
  { id: 'service-offer', dim: 'GEO', scope: 'page', types: ['services'], label: 'Service offer detail: hasOfferCatalog/offers/serviceType (services page)',
    run: (p) => {
      const ok = definitions(p.nodes, SERVICE_TYPES).some((n) => n.hasOfferCatalog || n.offers || n.makesOffer || n.serviceType);
      return [ok, ok ? 'present' : 'none'];
    } },

  /* ---------- SEO, sitewide ---------- */
  { id: 'robots', dim: 'SEO', scope: 'site', label: 'robots.txt HTTP 200 with a Sitemap: line',
    run: (ctx) => {
      const r = ctx.root.robots;
      const ok = r.status === 200 && !looksHtml(r) && /^\s*sitemap\s*:/im.test(r.body);
      return [ok, `HTTP ${r.status}${r.status === 200 ? (/^\s*sitemap\s*:/im.test(r.body) ? ', Sitemap line' : ', no Sitemap line') : ''}`];
    } },
  { id: 'sitemap', dim: 'SEO', scope: 'site', label: 'sitemap.xml HTTP 200',
    run: (ctx) => [ctx.root.sitemap.status === 200 && /<urlset|<sitemapindex/i.test(ctx.root.sitemap.body), `HTTP ${ctx.root.sitemap.status}`] },
  { id: 'sitemap-complete', dim: 'SEO', scope: 'site', label: 'sitemap.xml lists every page',
    run: (ctx) => {
      const listed = new Set(ctx.root.sitemapLocs.map((u) => { try { return new URL(u).pathname; } catch { return u; } }));
      const missing = PAGES.map((p) => p.path).filter((p) => !listed.has(p));
      return [ctx.root.sitemap.status === 200 && missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : `${listed.size} URLs, all pages listed`];
    } },
  { id: 'not-found', dim: 'SEO', scope: 'site', label: 'Unknown URL returns 404 with noindex (no soft 404)',
    run: (ctx) => {
      const r = ctx.root.missing;
      const noindex = tagsOf(stripNonText(r.body), 'meta').some((a) => (a.name || '').toLowerCase() === 'robots' && /noindex/i.test(a.content || ''));
      return [r.status === 404 && noindex, `HTTP ${r.status}, ${noindex ? 'noindex' : 'no noindex'}`];
    } },

  /* ---------- AIO, sitewide ---------- */
  { id: 'ai-crawlers', dim: 'AIO', scope: 'site', label: 'AI crawlers not blocked in robots.txt',
    run: (ctx) => {
      const r = ctx.root.robots;
      if (r.status !== 200 || looksHtml(r)) return [true, `robots.txt HTTP ${r.status}: nothing blocks AI crawlers`];
      const blocked = robotsBlocksAI(r.body);
      return [blocked.length === 0, blocked.length ? `blocked: ${blocked.join(', ')}` : 'none blocked'];
    } },
  { id: 'llms-txt', dim: 'AIO', scope: 'site', label: 'llms.txt HTTP 200 (plain text)',
    run: (ctx) => { const r = ctx.root.llms; return [r.status === 200 && !looksHtml(r), `HTTP ${r.status}`]; } },

  /* ---------- AEO, sitewide ---------- */
  { id: 'faq-somewhere', dim: 'AEO', scope: 'site', label: 'At least one page answers questions in a visible FAQ',
    run: (ctx) => {
      const with_ = ctx.pages.filter((p) => p.status === 200 && p.hasVisibleFaq);
      return [with_.length > 0, with_.length ? with_.map((p) => `${p.path} (${p.visibleQuestions.length} Q)`).join(', ') : 'none'];
    } },

  /* ---------- GEO, sitewide ---------- */
  { id: 'person-anywhere', dim: 'GEO', scope: 'site', label: 'Person schema on the site',
    run: (ctx) => { const n = definitions(allNodes(ctx), ['Person']).length; return [n > 0, `${n} Person definition(s)`]; } },
  { id: 'website', dim: 'GEO', scope: 'site', label: 'WebSite schema on the site',
    run: (ctx) => { const ok = allNodes(ctx).some((n) => isType(n, ['WebSite'])); return [ok, ok ? 'present' : 'none']; } },
  { id: 'service-anywhere', dim: 'GEO', scope: 'site', label: 'ProfessionalService or Service schema on the site',
    run: (ctx) => { const n = definitions(allNodes(ctx), SERVICE_TYPES).length; return [n > 0, `${n} found`]; } },
];

/* ------------------------------------------------------------------ warnings (never scored) */

async function warnings(ctx) {
  const w = [];
  const ok = ctx.pages.filter((p) => p.status === 200);
  for (const p of ok) {
    if (p.titleLen > STRICT.titleMax) w.push(`${p.path} title ${p.titleLen} chars > ${STRICT.titleMax} (strict validator)`);
    if (p.descLen && (p.descLen < STRICT.descMin || p.descLen > STRICT.descMax)) w.push(`${p.path} description ${p.descLen} chars outside ${STRICT.descMin}-${STRICT.descMax} (strict validator)`);
    const self = CANONICAL_ORIGIN + p.path;
    if (p.canonical && p.canonical !== self) w.push(`${p.path} canonical ${p.canonical} is not self-referencing (${self})`);
    if (p.ogUrl && p.canonical && p.ogUrl !== p.canonical) w.push(`${p.path} og:url ${p.ogUrl} differs from canonical ${p.canonical}`);
    if (p.imgEmptyAlt.length) w.push(`${p.path} ${p.imgEmptyAlt.length} <img> with alt="" (fine only if decorative): ${[...new Set(p.imgEmptyAlt)].join(', ')}`);
    if (/noindex/i.test(p.robots)) w.push(`${p.path} carries meta robots "${p.robots}"`);
    if (!p.lang) w.push(`${p.path} <html> has no lang attribute`);
    if (!p.questionHeadings.length && p.questionH3.length) w.push(`${p.path} has ${p.questionH3.length} question-shaped H3/H4 (e.g. "${p.questionH3[0]}") but no question-shaped H1/H2`);
    if (p.faqPages.length && p.faqQuestions.length !== p.visibleQuestions.length) w.push(`${p.path} FAQPage has ${p.faqQuestions.length} Question(s) but the page shows ${p.visibleQuestions.length}`);
  }
  for (const key of ['title', 'description']) {
    const seen = {};
    for (const p of ok) if (p[key]) (seen[p[key]] = seen[p[key]] || []).push(p.path);
    for (const [v, paths] of Object.entries(seen)) if (paths.length > 1) w.push(`duplicate ${key} on ${paths.join(', ')}: "${v}"`);
  }
  const images = [...new Set(ok.map((p) => p.ogImage).filter((u) => /^https?:/i.test(u)))];
  for (const u of images) {
    const r = await get(u);
    if (r.status !== 200) w.push(`og:image ${u} returns HTTP ${r.status}`);
  }
  const sm = ctx.root.sitemap;
  if (sm.status === 200) {
    if (!/<lastmod>/i.test(sm.body)) w.push('sitemap.xml has no <lastmod> dates');
    const foreign = ctx.root.sitemapLocs.filter((u) => !u.startsWith(CANONICAL_ORIGIN + '/'));
    if (foreign.length) w.push(`sitemap.xml lists URLs off ${CANONICAL_ORIGIN}: ${foreign.join(', ')}`);
  }
  const clean = ctx.root.cleanUrl;
  if (clean.status !== 200 && !(clean.status >= 300 && clean.status < 400)) {
    w.push(`${CLEAN_URL_PROBE} (no .html) returns HTTP ${clean.status}: clean URLs are off, so only the .html paths resolve`);
  }
  if (ctx.root.robots.status !== 200) w.push(`robots.txt returns HTTP ${ctx.root.robots.status}: crawlers get no Sitemap pointer`);
  return w;
}

/* ------------------------------------------------------------------ run */

async function collect() {
  const pages = [];
  for (const page of PAGES) pages.push(analyse(page, await get(SITE + page.path)));
  const [robots, sitemap, llms, missing, cleanUrl] = await Promise.all([
    get(SITE + '/robots.txt'), get(SITE + '/sitemap.xml'), get(SITE + '/llms.txt'),
    get(SITE + MISSING_PATH), get(SITE + CLEAN_URL_PROBE),
  ]);
  const sitemapLocs = sitemap.status === 200 ? [...sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1])) : [];
  return { pages, root: { robots, sitemap, llms, missing, cleanUrl, sitemapLocs } };
}

function evaluate(ctx) {
  const results = [];
  for (const p of ctx.pages) {
    const reach = CHECKS.find((c) => c.id === 'reachable');
    const [rok, rdetail] = reach.run(p, ctx);
    results.push({ id: reach.id, dim: reach.dim, where: p.path, label: reach.label, pass: rok, detail: rdetail });
    if (!rok) continue;
    for (const c of CHECKS) {
      if (c.scope !== 'page' || c.id === 'reachable') continue;
      if (c.types && !c.types.includes(p.type)) continue;
      if (c.applies && !c.applies(p, ctx)) continue;
      let pass = false;
      let detail = '';
      try { [pass, detail] = c.run(p, ctx); } catch (e) { detail = 'check threw: ' + e.message; }
      results.push({ id: c.id, dim: c.dim, where: p.path, label: c.label, pass: !!pass, detail });
    }
  }
  for (const c of CHECKS.filter((x) => x.scope === 'site')) {
    let pass = false;
    let detail = '';
    try { [pass, detail] = c.run(ctx); } catch (e) { detail = 'check threw: ' + e.message; }
    results.push({ id: c.id, dim: c.dim, where: 'site', label: c.label, pass: !!pass, detail });
  }
  return results;
}

function score(results) {
  const out = {};
  for (const dim of ['SEO', 'AIO', 'AEO', 'GEO', 'OVERALL']) {
    const set = dim === 'OVERALL' ? results : results.filter((r) => r.dim === dim);
    const passed = set.filter((r) => r.pass).length;
    out[dim] = { passed, total: set.length, score: set.length ? Math.round((passed / set.length) * 100) : 0 };
  }
  return out;
}

function facts(p) {
  if (p.status !== 200) return { path: p.path, status: p.status, location: p.location };
  return {
    path: p.path, title: p.title, titleLen: p.titleLen, description: p.description, descLen: p.descLen,
    canonical: p.canonical, h1: p.h1, h2: p.h2, jsonLdTypes: p.jsonLdTypes, words: p.words,
    imgCount: p.imgCount, imgNoAlt: p.imgNoAlt.length, imgEmptyAlt: p.imgEmptyAlt.length, ogImage: p.ogImage,
    ogTitle: p.ogTitle, twitterCard: p.twitterCard, visibleFaqQuestions: p.visibleQuestions.length,
  };
}

async function main() {
  const ctx = await collect();
  const results = evaluate(ctx);
  const scores = score(results);
  const warns = await warnings(ctx);
  const fails = results.filter((r) => !r.pass);
  const root = {
    robots: ctx.root.robots.status, sitemap: ctx.root.sitemap.status, sitemapUrls: ctx.root.sitemapLocs.length,
    llms: ctx.root.llms.status, missingPage: ctx.root.missing.status, cleanUrlProbe: ctx.root.cleanUrl.status,
  };

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ site: SITE, canonicalOrigin: CANONICAL_ORIGIN, scores, root,
      fails: fails.map((r) => `[${r.dim}] ${r.where} — ${r.label}: ${r.detail}`), warns,
      pages: ctx.pages.map(facts), results }, null, 2));
    return;
  }

  console.log(`SEO / AIO / AEO / GEO audit of ${SITE} (canonical ${CANONICAL_ORIGIN})\n`);
  for (const r of fails) console.log(`FAIL [${r.dim}] ${r.where} — ${r.label}: ${r.detail}`);
  if (warns.length) console.log('');
  for (const w of warns) console.log(`WARN ${w}`);
  if (argv.includes('--facts')) {
    console.log('');
    for (const p of ctx.pages.map(facts)) console.log(JSON.stringify(p));
  }
  console.log('');
  for (const [dim, s] of Object.entries(scores)) console.log(`${dim.padEnd(8)} ${String(s.score).padStart(3)}  (${s.passed}/${s.total})`);
}

if (require.main === module) {
  /* report-only: exit 0 even on errors (exitCode, not exit(), so piped output is never cut) */
  main().catch((e) => console.log('audit error: ' + ((e && e.stack) || e))).finally(() => { process.exitCode = 0; });
}

module.exports = { CHECKS, PAGES, LIVE, STRICT, analyse, collect, evaluate, score, warnings, get };
