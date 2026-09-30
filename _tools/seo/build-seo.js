'use strict';
/* Builds every SEO / GEO / AEO surface of carlgabriel.vercel.app from _tools/seo/seo-data.json.

     node _tools/seo/build-seo.js            dry run: prints what would change, writes nothing
     node _tools/seo/build-seo.js --apply    writes the pages and root files
     --root <dir>                            build another copy of the site (the tests use this)

   Per page: <title>, meta description, og:title / og:description, twitter:title /
   twitter:description, and one JSON-LD @graph between <!-- seo:jsonld --> markers placed just
   before <link rel="expect">. Root files: robots.txt, llms.txt, sitemap.xml.

   FAQPage entries are read from the visible page ([data-faq-q] followed by its [data-faq-a]),
   never typed twice, so the schema can't drift from what people see (vault lesson: hardcoded
   FAQ schema drifts). The data file and that FAQ text both pass the copy rules (validate.js)
   first; any problem blocks the build. Re-running is a no-op. */
const fs = require('fs');
const path = require('path');
const { validate, checkText } = require('./validate');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const DATA_FILE = path.join(__dirname, 'seo-data.json');
const START = '<!-- seo:jsonld -->';
const END = '<!-- /seo:jsonld -->';

/* ---------- text helpers ---------- */
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  mdash: '—', ndash: '–', times: '×', hellip: '…', middot: '·', rarr: '→', larr: '←', uarr: '↑', darr: '↓', copy: '©',
};
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    if (!Object.prototype.hasOwnProperty.call(ENTITIES, e)) throw new Error(`unknown entity ${m}: add it to ENTITIES in build-seo.js`);
    return ENTITIES[e];
  });
}
const plain = (html) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lf = (s) => s.replace(/\r\n/g, '\n');

/* The visible Q&A pairs, in page order: each [data-faq-q] element pairs with the next [data-faq-a]. */
function faqFromHtml(html) {
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const grab = (name) => [...body.matchAll(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\s${name}\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi'))]
    .map(m => {
      if (new RegExp(`<${m[1]}\\b`, 'i').test(m[2])) throw new Error(`[${name}] <${m[1]}> holds another <${m[1]}>; mark the inner element instead`);
      return { at: m.index, text: plain(m[2]) };
    });
  const qs = grab('data-faq-q');
  const as = grab('data-faq-a');
  if (qs.length !== as.length) throw new Error(`${qs.length} [data-faq-q] but ${as.length} [data-faq-a]`);
  return qs.map((qq, i) => {
    if (!(as[i].at > qq.at) || (qs[i + 1] && as[i].at > qs[i + 1].at)) throw new Error(`FAQ answer ${i + 1} is not right after its question`);
    return { question: qq.text, answer: as[i].text };
  });
}

/* ---------- schema ---------- */
function graphs(data, faqs) {
  const B = data.site;
  const P = data.person;
  const url = (p) => B + p;
  const ids = { person: B + '/#person', website: B + '/#website', service: B + '/#service' };
  const img = url('/' + data.image);
  const address = Object.assign({ '@type': 'PostalAddress' }, P.address);
  const ref = (id) => ({ '@id': id });

  const person = {
    '@type': 'Person', '@id': ids.person, name: P.name, alternateName: P.alternateName,
    givenName: P.givenName, familyName: P.familyName, jobTitle: P.jobTitle, description: P.description,
    image: img, url: url('/'), email: P.email, telephone: P.telephone, address,
    alumniOf: { '@type': 'CollegeOrUniversity', name: P.alumniOf }, knowsAbout: P.knowsAbout, sameAs: P.sameAs,
  };
  const stub = { '@type': 'Person', '@id': ids.person, name: P.name, url: url('/') };
  const website = {
    '@type': 'WebSite', '@id': ids.website, url: url('/'), name: P.name, alternateName: P.alternateName[0],
    inLanguage: 'en', publisher: ref(ids.person), about: ref(ids.person),
  };
  const offerId = (o) => url('/services.html#' + o.key);
  const service = {
    '@type': 'ProfessionalService', '@id': ids.service, name: data.service.name, description: data.service.description,
    url: url('/services.html'), image: img, founder: ref(ids.person), email: P.email, telephone: P.telephone,
    address, areaServed: data.service.areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog', '@id': url('/services.html#catalog'), name: data.service.catalogName,
      itemListElement: data.service.offers.map(o => ({ '@type': 'Offer', itemOffered: ref(offerId(o)) })),
    },
  };
  const services = data.service.offers.map(o => ({
    '@type': 'Service', '@id': offerId(o), name: o.name, serviceType: o.serviceType, description: o.description,
    provider: ref(ids.person), areaServed: data.service.areaServed, url: url('/services.html#services'),
  }));

  const out = {};
  for (const p of data.pages) {
    const pageUrl = url(p.path);
    const webpage = {
      '@type': p.type, '@id': pageUrl + '#webpage', url: pageUrl, name: p.title, description: p.description,
      isPartOf: ref(ids.website), about: ref(ids.person), inLanguage: 'en', dateModified: data.dateModified,
    };
    const nodes = [];
    if (p.crumb) webpage.breadcrumb = ref(pageUrl + '#breadcrumb');
    const crumbs = p.crumb ? {
      '@type': 'BreadcrumbList', '@id': pageUrl + '#breadcrumb', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: url('/') },
        { '@type': 'ListItem', position: 2, name: p.crumb, item: pageUrl },
      ],
    } : null;

    if (p.file === 'index.html') {
      webpage.primaryImageOfPage = { '@type': 'ImageObject', url: img };
      nodes.push(person, website, service, webpage);
    } else if (p.file === 'about.html') {
      webpage.mainEntity = person;              // ProfilePage: the full Person lives here
      nodes.push(webpage);
    } else if (p.file === 'services.html') {
      webpage.mainEntity = ref(ids.service);
      nodes.push(stub, service, ...services, webpage);
    } else if (p.file === 'contact.html') {
      webpage.mainEntity = ref(ids.person);
      nodes.push(Object.assign({}, stub, { email: P.email, telephone: P.telephone }), webpage);
    } else if (p.file === 'work.html') {
      webpage.mainEntity = ref(pageUrl + '#reels');
      nodes.push(stub, webpage);
      nodes.push({
        '@type': 'ItemList', '@id': pageUrl + '#reels', name: 'Video reels', numberOfItems: data.reels.length,
        itemListElement: data.reels.map((r, i) => ({
          '@type': 'ListItem', position: i + 1, item: {
            '@type': 'VideoObject', '@id': pageUrl + '#' + r.stem, name: r.name,
            description: r.name + '. Short-form video creative made in-house by ' + P.name + '.',
            thumbnailUrl: url('/assets/video/posters/' + r.stem + '.jpg'),
            contentUrl: url('/assets/video/' + r.stem + '.mp4'),
            uploadDate: data.reelsUploadDate, duration: r.duration, creator: ref(ids.person),
          },
        })),
      });
    } else {
      nodes.push(stub, webpage);
    }
    if (crumbs) nodes.push(crumbs);
    const qa = faqs[p.file] || [];
    if (qa.length) {
      nodes.push({
        '@type': 'FAQPage', '@id': pageUrl + '#faq', url: pageUrl, isPartOf: ref(pageUrl + '#webpage'),
        mainEntity: qa.map(x => ({ '@type': 'Question', name: x.question, acceptedAnswer: { '@type': 'Answer', text: x.answer } })),
      });
    }
    out[p.file] = { '@context': 'https://schema.org', '@graph': nodes };
  }
  return out;
}

/* ---------- page edits ---------- */
function replaceOnce(html, rx, repl, label, file) {
  const hits = html.match(new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g')) || [];
  if (hits.length !== 1) throw new Error(`${file}: expected exactly 1 ${label} in <head>, found ${hits.length}`);
  return html.replace(rx, repl);
}

function renderPage(html, page, graph, file) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const s = lf(html);
  const cut = s.indexOf('</head>');
  if (cut === -1) throw new Error(`${file}: no </head>`);
  let head = s.slice(0, cut);                 // only the head is edited, so an inline <svg><title> can't match
  const og = page.ogDescription || page.description;
  head = replaceOnce(head, /<title>[\s\S]*?<\/title>/, () => `<title>${text(page.title)}</title>`, '<title>', file);
  const metas = [
    ['name', 'description', page.description], ['property', 'og:title', page.title], ['property', 'og:description', og],
    ['name', 'twitter:title', page.title], ['name', 'twitter:description', og],
  ];
  for (const [kind, key, value] of metas) {
    const rx = new RegExp(`<meta ${kind}="${key.replace(':', '\\:')}" content="[^"]*">`);
    head = replaceOnce(head, rx, () => `<meta ${kind}="${key}" content="${attr(value)}">`, `meta ${key}`, file);
  }
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');
  const block = `${START}\n<script type="application/ld+json">${json}</script>\n${END}\n`;
  if (head.includes(START)) {
    head = replaceOnce(head, /<!-- seo:jsonld -->\n[\s\S]*?<!-- \/seo:jsonld -->\n/, () => block, 'seo:jsonld block', file);
  } else {
    head = replaceOnce(head, /(<link rel="expect"[^>]*>)/, (m) => block + m, '<link rel="expect">', file);
  }
  return (head + s.slice(cut)).replace(/\n/g, nl);
}

/* ---------- root files ---------- */
function robotsTxt(data) {
  return data.robots.join('\n') + '\n\nSitemap: ' + data.site + '/sitemap.xml\n';
}
function sitemapXml(data) {
  const urls = data.pages.map(p => `  <url><loc>${data.site}${p.path}</loc><lastmod>${data.dateModified}</lastmod></url>`);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';
}
/* llmstxt.org layout: H1, blockquote summary, free text (the facts), then H2 sections of link lists */
function llmsTxt(data) {
  const L = data.llms;
  const names = { 'index.html': 'Home', 'work.html': 'Work', 'results.html': 'Results', 'services.html': 'Services', 'about.html': 'About', 'contact.html': 'Contact' };
  return [
    '# ' + data.person.name, '', '> ' + L.summary, '', L.note, '',
    'Facts, last updated ' + data.dateModified + ':', '',
    ...L.facts.map(f => '- ' + f), '',
    '## Pages', '',
    ...data.pages.map(p => `- [${names[p.file]}](${data.site}${p.path}): ${L.pageNotes[p.file]}`), '',
    '## Profiles', '',
    ...L.profiles.map(([n, u]) => `- [${n}](${u})`), '',
    '## Optional', '',
    `- [Sitemap](${data.site}/sitemap.xml)`, '',
  ].join('\n');
}

/* ---------- build ---------- */
function build(root, opts) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const problems = validate(data);
  const pages = {};
  const faqs = {};
  for (const p of data.pages) {
    pages[p.file] = fs.readFileSync(path.join(root, p.file), 'utf8');
    faqs[p.file] = faqFromHtml(pages[p.file]);
    faqs[p.file].forEach((x, i) => problems.push(
      ...checkText(`${p.file} visible FAQ ${i + 1} question`, x.question),
      ...checkText(`${p.file} visible FAQ ${i + 1} answer`, x.answer)));
  }
  if (problems.length) {
    const e = new Error('copy failed validation:\n  ' + problems.join('\n  '));
    e.problems = problems;
    throw e;
  }
  const g = graphs(data, faqs);
  const outputs = {};
  for (const p of data.pages) outputs[p.file] = renderPage(pages[p.file], p, g[p.file], p.file);
  outputs['robots.txt'] = robotsTxt(data);
  outputs['sitemap.xml'] = sitemapXml(data);
  outputs['llms.txt'] = llmsTxt(data);

  const report = [];
  for (const [file, content] of Object.entries(outputs)) {
    const target = path.join(root, file);
    const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    // compare without line endings: git's autocrlf may have turned the file's LF into CRLF on checkout
    const state = before === null ? 'create' : (lf(before) === lf(content) ? 'unchanged' : 'update');
    if (state !== 'unchanged' && opts && opts.apply) {
      const nl = before && before.includes('\r\n') ? '\r\n' : '\n';
      fs.writeFileSync(target, lf(content).replace(/\n/g, nl), 'utf8');
    }
    report.push({ file, state });
  }
  return { report, graphs: g, faqs, data };
}

module.exports = { build, graphs, faqFromHtml, renderPage, llmsTxt, robotsTxt, sitemapXml, plain };

if (require.main === module) {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const ri = args.indexOf('--root');
  const root = ri !== -1 ? path.resolve(args[ri + 1]) : DEFAULT_ROOT;
  try {
    const { report, faqs } = build(root, { apply });
    for (const r of report) console.log(`${r.state === 'unchanged' ? 'unchanged' : (apply ? 'wrote' : 'would ' + r.state)}  ${r.file}`);
    for (const [f, q] of Object.entries(faqs)) if (q.length) console.log(`faq  ${f}: ${q.length} visible Q&A`);
    console.log(apply ? 'applied' : 'dry run (add --apply to write)');
  } catch (err) {
    console.log('BLOCK ' + err.message);
    process.exit(1);
  }
}
