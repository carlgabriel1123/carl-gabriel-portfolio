'use strict';
// Tests for the SEO / GEO / AEO generator and its copy validator.
// Run: node --test "_tools/tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const { validate, namesEmployer } = require('../seo/validate');
const { build, faqFromHtml } = require('../seo/build-seo');

const data = () => JSON.parse(fs.readFileSync(path.join(ROOT, '_tools', 'seo', 'seo-data.json'), 'utf8'));
const PAGES = ['index.html', 'work.html', 'results.html', 'services.html', 'about.html', 'contact.html'];
// the confidential employer name, base64 so this public repo never spells it out
const EMPLOYER = Buffer.from('U2t5aGVHbG9iYWw=', 'base64').toString('utf8');

const temps = [];
test.after(() => temps.forEach(d => fs.rmSync(d, { recursive: true, force: true })));
function tempSite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-site-'));
  temps.push(dir);
  for (const f of PAGES) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  return dir;
}
function jsonld(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
}
const nodes = (html) => jsonld(html).flatMap(b => b['@graph'] || [b]);
const deep = (v, out = []) => {
  if (Array.isArray(v)) v.forEach(x => deep(x, out));
  else if (v && typeof v === 'object') { out.push(v); Object.values(v).forEach(x => deep(x, out)); }
  return out;
};

test('seo-data.json passes the validator', () => {
  assert.deepStrictEqual(validate(data()), []);
});

test('validator blocks the confidential employer, dashes, Google Ads, banned words and client-scale figures', () => {
  const cases = [
    [d => { d.pages[0].description = d.pages[0].description.replace('Manila', EMPLOYER); }, /confidential employer/],
    [d => { d.llms.facts.push('Works at ' + EMPLOYER.toUpperCase().replace('G', ' G') + ', Inc.'); }, /confidential employer/],
    [d => { d.llms.summary += ' Fast — always.'; }, /dash/],
    [d => { d.llms.facts.push('Ran Google Ads too.'); }, /Google Ads/],
    [d => { d.person.description += ' Let me elevate your brand.'; }, /banned word "elevate"/],
    [d => { d.llms.facts.push('US$60M+ in revenue.'); }, /unverified figure/],
    [d => { d.llms.facts.push('1B+ views.'); }, /unverified figure/],
  ];
  for (const [mutate, rx] of cases) {
    const d = data();
    mutate(d);
    assert.ok(validate(d).some(e => rx.test(e)), `expected ${rx} in ${JSON.stringify(validate(d))}`);
  }
});

test('validator enforces title and description lengths, uniqueness and the name', () => {
  const d = data();
  d.pages[1].title = 'Short';
  d.pages[2].description = d.pages[3].description;
  d.pages[4].title = 'About me and my media buying work in the Philippines';
  const errs = validate(d).join('\n');
  assert.match(errs, /work\.html: title is 5 chars/);
  assert.match(errs, /duplicate description/);
  assert.match(errs, /about\.html: title must name Carl Gabriel Piramo/);
});

test('faqFromHtml pairs each visible question with the answer after it', () => {
  const html = '<h2 data-faq-q>Q &amp; one?</h2><p data-faq-a>A <strong>one</strong>.</p><span data-faq-q>Q two?</span><p data-faq-a>A two.</p>';
  assert.deepStrictEqual(faqFromHtml(html), [
    { question: 'Q & one?', answer: 'A one.' },
    { question: 'Q two?', answer: 'A two.' },
  ]);
  assert.throws(() => faqFromHtml('<h2 data-faq-q>Q?</h2>'), /1 \[data-faq-q\] but 0/);
});

test('build on a copy of the site: one valid @graph per page, one Person, FAQ equals the visible Q&A', () => {
  const dir = tempSite();
  const { report } = build(dir, { apply: true });
  assert.ok(report.every(r => r.state !== 'unchanged' || PAGES.includes(r.file)));
  const d = data();
  for (const p of d.pages) {
    const html = fs.readFileSync(path.join(dir, p.file), 'utf8');
    const blocks = jsonld(html);
    assert.strictEqual(blocks.length, 1, `${p.file}: one JSON-LD block`);
    assert.strictEqual(blocks[0]['@context'], 'https://schema.org');
    const all = deep(blocks[0]['@graph']);
    const persons = all.filter(n => n['@type'] === 'Person' && n.name);
    assert.strictEqual(new Set(persons.map(n => n['@id'])).size, 1, `${p.file}: one Person entity`);
    assert.ok(!all.some(n => 'worksFor' in n || 'aggregateRating' in n), `${p.file}: no worksFor / aggregateRating`);
    assert.ok(!namesEmployer(JSON.stringify(blocks)), `${p.file}: employer name kept out`);

    const faqs = all.filter(n => n['@type'] === 'FAQPage');
    const visible = faqFromHtml(html);
    assert.strictEqual(faqs.length, visible.length ? 1 : 0, `${p.file}: FAQPage only where a visible FAQ exists`);
    if (faqs.length) {
      assert.deepStrictEqual(faqs[0].mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible.map(v => [v.question, v.answer]));
    }
    assert.ok(html.includes(`<title>${p.title.replace(/&/g, '&amp;')}</title>`), `${p.file}: title written`);
    const crumbs = all.filter(n => n['@type'] === 'BreadcrumbList');
    assert.strictEqual(crumbs.length, p.crumb ? 1 : 0, `${p.file}: breadcrumb on inner pages only`);
  }
  const work = nodes(fs.readFileSync(path.join(dir, 'work.html'), 'utf8'));
  const videos = deep(work).filter(n => n['@type'] === 'VideoObject');
  assert.strictEqual(videos.length, d.reels.length);
  for (const v of videos) {
    assert.ok(fs.existsSync(path.join(ROOT, new URL(v.contentUrl).pathname)), v.contentUrl);
    assert.ok(fs.existsSync(path.join(ROOT, new URL(v.thumbnailUrl).pathname)), v.thumbnailUrl);
  }
});

test('root files: robots points at the sitemap and keeps /api/ out, llms.txt and sitemap list every page', () => {
  const dir = tempSite();
  build(dir, { apply: true });
  const d = data();
  const robots = fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8');
  assert.match(robots, /^Sitemap: https:\/\/carlgabriel\.vercel\.app\/sitemap\.xml$/m);
  assert.match(robots, /User-agent: OAI-SearchBot/);
  assert.ok(!/^Disallow: \/$/m.test(robots), 'nothing blocks the whole site');
  const llms = fs.readFileSync(path.join(dir, 'llms.txt'), 'utf8');
  assert.match(llms, /^# Carl Gabriel Piramo\n\n> /);
  // llmstxt.org: the facts sit in the free text before the first H2; every H2 section is a link list
  for (const section of llms.split(/^## /m).slice(1)) {
    const lines = section.split('\n').slice(1).filter(Boolean);
    assert.ok(lines.every(l => /^- \[[^\]]+\]\(https:\/\/[^)]+\)/.test(l)), 'H2 sections hold only links: ' + section.split('\n')[0]);
  }
  const sitemap = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
  for (const p of d.pages) {
    assert.ok(llms.includes(d.site + p.path + ')'), `llms.txt lists ${p.path}`);
    assert.ok(sitemap.includes(`<loc>${d.site}${p.path}</loc><lastmod>${d.dateModified}</lastmod>`), `sitemap lists ${p.path}`);
  }
  assert.ok(!/[–—]/.test(llms), 'llms.txt has no dashes');
});

test('the build is idempotent and dry run writes nothing', () => {
  const dir = tempSite();
  const before = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  build(dir, { apply: false });
  assert.strictEqual(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(dir, 'robots.txt')));
  build(dir, { apply: true });
  const second = build(dir, { apply: true });
  assert.ok(second.report.every(r => r.state === 'unchanged'), JSON.stringify(second.report));
});

test('a dash, a Google Ads claim or the employer name in a visible FAQ blocks the build and writes nothing', () => {
  for (const bad of ['Fast — always.', 'I run Google Ads too.', 'I work at ' + EMPLOYER + '.']) {
    const dir = tempSite();
    const f = path.join(dir, 'results.html');
    const html = fs.readFileSync(f, 'utf8').replace('<p class="qa-a" data-faq-a>', '<p class="qa-a" data-faq-a>' + bad + ' ');
    fs.writeFileSync(f, html);
    assert.throws(() => build(dir, { apply: true }), /results\.html visible FAQ 1 answer/);
    assert.strictEqual(fs.readFileSync(f, 'utf8'), html);
    assert.ok(!fs.existsSync(path.join(dir, 'robots.txt')));
  }
});

test('the footer date matches dateModified', () => {
  const footer = fs.readFileSync(path.join(ROOT, '_tools', 'shell', 'footer.html'), 'utf8');
  assert.ok(footer.includes(`<time datetime="${data().dateModified}">`), 'update _tools/shell/footer.html when dateModified changes');
});

test('no SEO source file spells out the employer name (the repo is public)', () => {
  for (const f of ['_tools/seo/seo-data.json', '_tools/seo/validate.js', '_tools/seo/build-seo.js', '_tools/tests/seo.test.js',
    '_tools/audit-content.py', '_tools/seo-audit.js', 'robots.txt', 'llms.txt', 'sitemap.xml']) {
    assert.ok(!namesEmployer(fs.readFileSync(path.join(ROOT, f), 'utf8')), f);
  }
});
