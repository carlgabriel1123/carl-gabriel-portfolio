#!/usr/bin/env python3
"""Prove the multi-page site still carries everything the one-page site had.

  python _tools/audit-content.py                  baseline vs the six pages
  python _tools/audit-content.py --pages a.html   baseline vs chosen pages
  python _tools/audit-content.py --selftest       prove the audit catches a removed sentence and asset

Baseline items (from _tools/baseline-index.html):
  text  every visible text node (script/style skipped), whitespace-collapsed
  attr  alt / aria-label / title / placeholder values
  url   every src / href / poster value, cache-busts like ?v=9 stripped
Rules:
  - text and attr items pass when they are a case-insensitive substring of
    one new page's text (its text nodes and those attributes joined by spaces)
  - url items pass when the same value appears in any new page;
    "#section" hrefs are skipped (they became page links, spec §9.1;
    check-links.py verifies every anchor)
  - ALLOW holds the intentional changes; everything else missing fails (exit 1)
"""
import html.parser
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, '_tools', 'baseline-index.html')
PAGES = ['index.html', 'work.html', 'results.html', 'services.html', 'about.html', 'contact.html']
ALLOW = {
    'view work ↓',             # hero button is now "View work →" linking to work.html
    'carl g. — back to top',   # brand link label is now "Carl G. — home"
}
ALLOW_URLS = {
    'https://carlgabriel1123.github.io/carl-gabriel-portfolio/',  # canonical moved to https://carlgabriel.vercel.app/
}
TEXT_ATTRS = ('alt', 'aria-label', 'title', 'placeholder')
URL_ATTRS = ('src', 'href', 'poster')


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


class Collector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.texts, self.attrs, self.urls = [], [], []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self._skip += 1
        self._attrs(attrs)

    def handle_startendtag(self, tag, attrs):
        self._attrs(attrs)

    def _attrs(self, attrs):
        for k, v in attrs:
            if v is None:
                continue
            if k in TEXT_ATTRS and norm(v):
                self.attrs.append(norm(v))
            if k in URL_ATTRS and v.strip():
                self.urls.append(re.sub(r'\?v=\d+$', '', v.strip()))

    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip and norm(data):
            self.texts.append(norm(data))


def collect(path):
    c = Collector()
    with open(path, encoding='utf-8') as f:
        c.feed(f.read())
    c.close()
    return c


def compare(base, page_texts, urls):
    """Return (kind, value) for every baseline item missing from the new pages."""
    misses, seen = [], set()
    for kind, items in (('text', base.texts), ('attr', base.attrs)):
        for t in items:
            key = t.lower()
            if key in seen or key in ALLOW:
                continue
            seen.add(key)
            if not any(key in pt for pt in page_texts):
                misses.append((kind, t))
    for u in base.urls:
        if u.startswith('#') or u in seen or u in ALLOW_URLS:
            continue
        seen.add(u)
        if u not in urls:
            misses.append(('url', u))
    return misses


def load(pages):
    news = [collect(os.path.join(ROOT, p)) for p in pages]
    page_texts = [' '.join(n.texts + n.attrs).lower() for n in news]
    urls = set(u for n in news for u in n.urls)
    return page_texts, urls


def main(argv):
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
    pages = PAGES
    if '--pages' in argv:
        pages = [a for a in argv[argv.index('--pages') + 1:] if not a.startswith('--')]
    missing = [p for p in pages if not os.path.isfile(os.path.join(ROOT, p))]
    if missing:
        print('FAIL missing page(s): ' + ', '.join(missing))
        return 1
    base = collect(BASELINE)
    page_texts, urls = load(pages)

    if '--selftest' in argv:
        probe_text = next(t for t in base.texts if len(t) > 40 and any(t.lower() in pt for pt in page_texts))
        probe_url = next(u for u in base.urls if u.startswith('assets/') and u in urls)
        cut = [pt.replace(probe_text.lower(), '') for pt in page_texts]
        misses = compare(base, cut, urls - {probe_url})
        found = {v for _, v in misses}
        ok = probe_text in found and probe_url in found
        print('selftest %s: removed %r and %r, audit reported %d miss(es)'
              % ('PASS' if ok else 'FAIL', probe_text[:48], probe_url, len(misses)))
        return 0 if ok else 1

    misses = compare(base, page_texts, urls)
    total = len(set(t.lower() for t in base.texts + base.attrs)) + len(set(u for u in base.urls if not u.startswith('#') and u not in ALLOW_URLS))
    for kind, v in misses:
        print('MISSING %-4s %s' % (kind, v))
    print('%s: %d baseline items checked across %d page(s), %d missing'
          % ('FAIL' if misses else 'PASS', total, len(pages), len(misses)))
    return 1 if misses else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
