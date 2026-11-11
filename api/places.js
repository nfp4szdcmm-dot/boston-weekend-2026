import { KEY, FIELD_MASK, inTripArea, normalize, readJson } from './_google.js';

const TYPES = {
  food: ['restaurant'],
  drinks: ['bar'],
  coffee: ['cafe', 'coffee_shop'],
  bakery: ['bakery', 'ice_cream_shop'],
  shopping: ['book_store', 'clothing_store', 'gift_shop', 'jewelry_store', 'shoe_store', 'shopping_mall'],
  sight: ['tourist_attraction', 'museum', 'historical_landmark', 'park'],
  fun: ['amusement_center', 'bowling_alley', 'movie_theater'],
};

export default async function handler(req, res) {
  if (!KEY) return res.status(501).json({ error: 'Google Places not configured' });
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { lat, lng, radius = 800, kinds = ['food'] } = await readJson(req);
    if (!inTripArea(lat, lng)) return res.status(400).json({ error: 'Outside trip area' });
    const r = Math.min(Math.max(Number(radius) || 800, 100), 3000);
    const ks = (Array.isArray(kinds) ? kinds : []).filter((k) => TYPES[k]).slice(0, 4);
    const results = await Promise.all(ks.map(async (kind) => {
      const resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify({
          includedTypes: TYPES[kind],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: r } },
        }),
      });
      if (!resp.ok) throw new Error(`Google ${resp.status}: ${await resp.text()}`);
      const j = await resp.json();
      return (j.places || []).map((p) => normalize(p, kind));
    }));
    const seen = new Set();
    const places = results.flat().filter((p) => p.lat && !seen.has(p.id) && seen.add(p.id));
    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(200).json({ places });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
