#!/usr/bin/env python3
"""Every internal link, asset and #anchor across the site resolves.

  python _tools/check-links.py

- relative href / src / poster -> the file exists (query and fragment stripped),
  checked case-sensitively even on case-insensitive filesystems, like Vercel
- "#id", "page.html#id", "./#id" -> the id exists on that page
- 404.html's hrefs/srcs must be "#..." or root-absolute (/...), since the host
  serves 404.html at whatever URL was missing
- http(s):, mailto:, tel:, data: are external and skipped
- every <loc> in sitemap.xml maps to an existing page
Exit 1 listing every broken reference.
"""
import html.parser
import os
import re
import sys
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIX = '/'  # the site is served from the domain root (carlgabriel.vercel.app)
SITE = 'https://carlgabriel.vercel.app/'
PAGES = ['index.html', 'work.html', 'results.html', 'services.html', 'about.html', 'contact.html', '404.html']
EXTERNAL = re.compile(r'^(?:https?:|mailto:|tel:|data:|javascript:)', re.I)


class Refs(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs = set(), []

    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k == 'id' and v:
                self.ids.add(v)
            if k in ('href', 'src', 'poster') and v is not None:
                self.refs.append((tag, k, v.strip()))

    handle_startendtag = handle_starttag


_cache = {}


def parse(rel):
    if rel not in _cache:
        r = Refs()
        with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
            r.feed(f.read())
        r.close()
        _cache[rel] = r
    return _cache[rel]


def resolve(page, url):
    """Repo-relative target file for url as written on page, or None if it cannot be local."""
    path = unquote(urlsplit(url).path)
    if path == '':
        return page
    if path.startswith(PREFIX):
        path = path[len(PREFIX):] or 'index.html'
    elif path.startswith('/'):
        return None
    path = os.path.normpath(path).replace('\\', '/')
    if path in ('.', ''):
        return 'index.html'
    if os.path.isdir(os.path.join(ROOT, path)):
        path += '/index.html'
    return path


def exists(rel):
    """isfile, but case-sensitive like Vercel, even on Windows."""
    cur = ROOT
    for part in rel.split('/'):
        if part not in os.listdir(cur):
            return False
        cur = os.path.join(cur, part)
    return os.path.isfile(cur)


def main():
    bad = []
    for page in PAGES:
        if not exists(page):
            bad.append('%s: page missing' % page)
            continue
        for tag, attr, url in parse(page).refs:
            if not url or EXTERNAL.match(url):
                continue
            if page == '404.html' and not url.startswith(('#', PREFIX)):
                bad.append('%s: <%s %s="%s"> must be absolute (%s...) on the 404 page' % (page, tag, attr, url, PREFIX))
                continue
            target = resolve(page, url)
            if target is None:
                bad.append('%s: <%s %s="%s"> is root-absolute outside %s' % (page, tag, attr, url, PREFIX))
                continue
            if not exists(target):
                bad.append('%s: <%s %s="%s"> -> %s does not exist' % (page, tag, attr, url, target))
                continue
            frag = urlsplit(url).fragment
            if frag and target.endswith('.html') and frag not in parse(target).ids:
                bad.append('%s: <%s %s="%s"> -> no id="%s" on %s' % (page, tag, attr, url, frag, target))
    sm = os.path.join(ROOT, 'sitemap.xml')
    if os.path.isfile(sm):
        for loc in re.findall(r'<loc>([^<]+)</loc>', open(sm, encoding='utf-8').read()):
            rel = loc[len(SITE):] if loc.startswith(SITE) else None
            if rel is None or not exists(rel or 'index.html'):
                bad.append('sitemap.xml: %s does not map to a page' % loc)
    else:
        bad.append('sitemap.xml: missing')
    for b in bad:
        print('BROKEN ' + b)
    print('%s: %d problem(s)' % ('FAIL' if bad else 'PASS', len(bad)))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
