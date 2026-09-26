'use strict';
/**
 * GET /api/health — called once a day by a Vercel cron (vercel.json).
 *
 * One tiny database call (public.ping) keeps the free Supabase project from
 * pausing for inactivity; a paused project would make the contact form fall
 * back to email until someone restores it by hand. Also a quick "is saving
 * working?" check from a phone.
 */
const { send } = require('./_respond');

module.exports = async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return send(res, 503, { ok: false, database: 'not-configured' });
  try {
    const r = await fetch(url + '/rest/v1/rpc/ping', {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    return send(res, r.ok ? 200 : 503, { ok: r.ok, database: r.ok ? 'reachable' : 'error ' + r.status });
  } catch (err) {
    return send(res, 503, { ok: false, database: 'unreachable' });
  }
};
