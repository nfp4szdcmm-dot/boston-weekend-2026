import { KEY, FIELD_MASK, inTripArea, normalize, readJson } from './_google.js';

export default async function handler(req, res) {
  if (!KEY) return res.status(501).json({ error: 'Google Places not configured' });
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { query, lat, lng } = await readJson(req);
    if (!query || String(query).length > 200 || !inTripArea(lat, lng)) return res.status(400).json({ error: 'Bad request' });
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } } }),
    });
    if (!resp.ok) throw new Error(`Google ${resp.status}`);
    const j = await resp.json();
    const p = j.places?.[0];
    res.setHeader('Cache-Control', 's-maxage=3600');
    if (!p) return res.status(200).json({ place: null });
    const n = normalize(p);
    // Only keep live fields; curated name/category/description stay as-is.
    const { rating, ratingCount, openNow, openingHours, hoursSource, googleHours, googleMapsUrl, photoUrl, website, phone, price } = n;
    res.status(200).json({ place: { rating, ratingCount, openNow, openingHours, hoursSource, googleHours, googleMapsUrl, photoUrl, website, phone, price, fetchedAt: n.fetchedAt } });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
