#!/usr/bin/env python3
"""Local preview that mirrors GitHub Pages for this project site.

  python _tools/serve.py [port]        default 8125
  open http://localhost:8125/carl-gabriel-portfolio/

- Serves the repo root under /carl-gabriel-portfolio/ (the live sub-path), so
  relative links and the absolute paths in 404.html behave exactly as live.
- Misses, and any path segment starting with "_" or "." (Jekyll never
  publishes those), get 404.html with status 404, like GitHub Pages.
- Cache-Control: no-store, so every reload shows the latest edit.
"""
import http.server
import os
import sys
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIX = '/carl-gabriel-portfolio'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

    def _route(self):
        """'ok' (self.path rewritten to the repo-relative path), 'redirect:<loc>' or 'missing'."""
        parts = urlsplit(self.path)
        path = unquote(parts.path)
        if path in ('', '/', PREFIX):
            return 'redirect:' + PREFIX + '/'
        if not path.startswith(PREFIX + '/'):
            return 'missing'
        rel = path[len(PREFIX):]
        segs = [s for s in rel.split('/') if s]
        if any(s.startswith(('_', '.')) for s in segs):
            return 'missing'
        fs = ROOT
        for s in segs:
            # Exact-name match: os.path.isdir/isfile would also accept other
            # cases, trailing dots/spaces, NTFS stream suffixes and backslash
            # segments on Windows; GitHub Pages is case-sensitive and has none
            # of those quirks.
            try:
                if s not in os.listdir(fs):
                    return 'missing'
            except OSError:
                return 'missing'
            fs = os.path.join(fs, s)
        if os.path.isdir(fs):
            if not rel.endswith('/'):
                return 'redirect:' + PREFIX + rel + '/'
            if not os.path.isfile(os.path.join(fs, 'index.html')):
                return 'missing'
        elif rel.endswith('/') or not os.path.isfile(fs):
            return 'missing'
        self.path = rel + ('?' + parts.query if parts.query else '')
        return 'ok'

    def _send_404(self, head_only):
        page = os.path.join(ROOT, '404.html')
        body = open(page, 'rb').read() if os.path.isfile(page) else b'<h1>404</h1>'
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _handle(self, head_only):
        route = self._route()
        if route == 'missing':
            return self._send_404(head_only)
        if route.startswith('redirect:'):
            self.send_response(301)
            self.send_header('Location', route[len('redirect:'):])
            self.end_headers()
            return None
        return super().do_HEAD() if head_only else super().do_GET()

    def do_GET(self):
        self._handle(False)

    def do_HEAD(self):
        self._handle(True)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8125
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler) as httpd:
        print('Serving %s at http://localhost:%d%s/' % (ROOT, port, PREFIX), flush=True)
        httpd.serve_forever()
