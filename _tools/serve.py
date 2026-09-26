#!/usr/bin/env python3
"""Local preview that mirrors the Vercel site (carlgabriel.vercel.app).

  python _tools/serve.py [port] [--mock-api]      default port 8125
  open http://localhost:8125/

- Serves the repo root at /, like Vercel. Misses get 404.html with status 404.
- Paths Vercel never serves are 404 here too: any segment starting with "_" or
  "." (_tools/, .github/, .env*), and the api/ sources.
- /api/* runs on Vercel only. Without --mock-api it is 404, so the contact form
  shows its email-app fallback. With --mock-api, POST /api/contact answers like
  the real route, driven by the message text, so every form state can be seen:
    message contains "#invalid"  -> 400 {field:"message"}
    message contains "#limit"    -> 429
    message contains "#down"     -> 503 (the form falls back to the email app)
    anything else                -> 200 {ok:true}  (nothing is saved)
  GET /api/health answers {ok:true, database:"mock"}.
- Cache-Control: no-store, so every reload shows the latest edit.
"""
import http.server
import json
import os
import sys
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOCK_API = '--mock-api' in sys.argv[1:]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

    def _route(self):
        """'ok' (self.path rewritten), 'redirect:<loc>', 'api' or 'missing'."""
        parts = urlsplit(self.path)
        rel = unquote(parts.path) or '/'
        segs = [s for s in rel.split('/') if s]
        if segs and segs[0] == 'api':
            return 'api'
        if any(s.startswith(('_', '.')) for s in segs):
            return 'missing'
        fs = ROOT
        for s in segs:
            # Exact-name match: os.path.isdir/isfile would also accept other
            # cases, trailing dots/spaces, NTFS stream suffixes and backslash
            # segments on Windows; Vercel is case-sensitive and has none of those.
            try:
                if s not in os.listdir(fs):
                    return 'missing'
            except OSError:
                return 'missing'
            fs = os.path.join(fs, s)
        if os.path.isdir(fs):
            if not rel.endswith('/'):
                return 'redirect:' + rel + '/'
            if not os.path.isfile(os.path.join(fs, 'index.html')):
                return 'missing'
        elif rel.endswith('/') or not os.path.isfile(fs):
            return 'missing'
        self.path = rel + ('?' + parts.query if parts.query else '')
        return 'ok'

    def _send(self, status, body, ctype, head_only=False):
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _send_404(self, head_only):
        page = os.path.join(ROOT, '404.html')
        body = open(page, 'rb').read() if os.path.isfile(page) else b'<h1>404</h1>'
        self._send(404, body, 'text/html; charset=utf-8', head_only)

    def _json(self, status, obj):
        self._send(status, json.dumps(obj).encode('utf-8'), 'application/json; charset=utf-8')

    def _api(self, method):
        path = urlsplit(self.path).path
        if not MOCK_API:
            return self._json(404, {'ok': False, 'error': 'api runs on Vercel only (start with --mock-api)'})
        if path == '/api/health' and method == 'GET':
            return self._json(200, {'ok': True, 'database': 'mock'})
        if path == '/api/contact' and method == 'POST':
            length = int(self.headers.get('Content-Length') or 0)
            try:
                body = json.loads(self.rfile.read(min(length, 12000)) or b'{}')
            except ValueError:
                return self._json(400, {'ok': False, 'error': 'invalid'})
            msg = str(body.get('message', ''))
            if '#invalid' in msg:
                return self._json(400, {'ok': False, 'error': 'invalid', 'field': 'message'})
            if '#limit' in msg:
                return self._json(429, {'ok': False, 'error': 'rate_limited'})
            if '#down' in msg:
                return self._json(503, {'ok': False, 'error': 'not_configured'})
            return self._json(200, {'ok': True})
        return self._json(405, {'ok': False, 'error': 'method'})

    def _handle(self, head_only):
        route = self._route()
        if route == 'api':
            return self._api('HEAD' if head_only else 'GET')
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

    def do_POST(self):
        if self._route() == 'api':
            return self._api('POST')
        self._json(405, {'ok': False, 'error': 'method'})


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    port = int(args[0]) if args else 8125
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler) as httpd:
        print('Serving %s at http://localhost:%d/%s' % (ROOT, port, ' (mock /api)' if MOCK_API else ''), flush=True)
        httpd.serve_forever()
