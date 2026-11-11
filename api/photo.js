import { KEY } from './_google.js';

export default async function handler(req, res) {
  if (!KEY) return res.status(501).end();
  const name = String(req.query?.name || '');
  if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return res.status(400).end();
  try {
    const r = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&skipHttpRedirect=true&key=${KEY}`);
    if (!r.ok) return res.status(502).end();
    const j = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.redirect(302, j.photoUri);
  } catch {
    res.status(502).end();
  }
}
