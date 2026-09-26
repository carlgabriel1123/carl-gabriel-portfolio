#!/usr/bin/env python3
"""Keep the shared page shell identical across pages.

  python _tools/sync-shell.py                 rewrite every page's shell blocks from _tools/shell/
  python _tools/sync-shell.py work.html ...   rewrite only these pages (parallel-safe)
  python _tools/sync-shell.py --check         exit 1 if any page differs (writes nothing)

A page marks each block like this (markers at column 0, owned by this script):
  <!-- shell:nav -->
  <!-- /shell:nav -->
Blocks: head, nav, footer. Per page:
  - the nav link whose data-nav equals <body data-page> gets aria-current="page"
  - 404.html gets every relative href/src made absolute (/carl-gabriel-portfolio/...),
    because GitHub Pages serves it from whatever URL was missing
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL = os.path.join(ROOT, '_tools', 'shell')
PAGES = ['index.html', 'work.html', 'results.html', 'services.html', 'about.html', 'contact.html', '404.html']
BLOCKS = ['head', 'nav', 'footer']
PREFIX = '/carl-gabriel-portfolio/'
URL_ATTR = re.compile(r'\b(href|src)="([^"]*)"')


def page_id(html, fname):
    m = re.search(r'<body[^>]*\bdata-page="([^"]+)"', html)
    if not m:
        raise SystemExit('no <body data-page="...">')
    return m.group(1)


def absolutize(block):
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'^(?:[a-z][a-z0-9+.-]*:|#|/)', url, re.I):
            return m.group(0)
        return '%s="%s%s"' % (attr, PREFIX, url[2:] if url.startswith('./') else url)
    return URL_ATTR.sub(fix, block)


def render(name, page, nl):
    with open(os.path.join(SHELL, name + '.html'), encoding='utf-8') as f:
        block = f.read().replace('\r\n', '\n')
    if not block.endswith('\n'):
        block += '\n'
    if name == 'nav':
        block = re.sub(r'(<a\b[^>]*\bdata-nav="%s")' % re.escape(page), r'\1 aria-current="page"', block)
    if page == '404':
        block = absolutize(block)
    return block.replace('\n', nl)


def main(argv):
    check = '--check' in argv
    only = [a for a in argv if a.endswith('.html')]
    bad = []
    for fname in (only or PAGES):
        path = os.path.join(ROOT, fname)
        if not os.path.isfile(path):
            bad.append('%s: missing' % fname)
            continue
        with open(path, encoding='utf-8', newline='') as f:
            html = f.read()
        nl = '\r\n' if '\r\n' in html else '\n'
        found = {}
        for name in BLOCKS:
            rx = re.compile(r'(<!-- shell:%s -->\r?\n)(.*?)(<!-- /shell:%s -->)' % (name, name), re.S)
            if rx.search(html):
                found[name] = rx
            else:
                bad.append('%s: no shell:%s block' % (fname, name))
        if not found:
            continue
        try:
            page = page_id(html, fname)
        except SystemExit as e:
            bad.append('%s: %s' % (fname, e))
            continue
        new = html
        for name, rx in found.items():
            want = render(name, page, nl)
            new = rx.sub(lambda m: m.group(1) + want + m.group(3), new, count=1)
        if new != html:
            if check:
                bad.append('%s: shell out of date (run _tools/sync-shell.py %s)' % (fname, fname))
            else:
                with open(path, 'w', encoding='utf-8', newline='') as f:
                    f.write(new)
                print('synced ' + fname)
    for b in bad:
        print('FAIL ' + b)
    if not bad:
        print('shell OK' if check else 'shell synced')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
