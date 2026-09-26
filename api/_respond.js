'use strict';
/* Shared JSON reply for the api/ routes. Vercel does not expose files that
   start with "_" as routes, so this is only ever required, never served. */

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = { send };
