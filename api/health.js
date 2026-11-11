import { KEY } from './_google.js';
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ google: !!KEY });
}
