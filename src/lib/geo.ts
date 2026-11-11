import type { LatLng, Place } from '../types';

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Rough walking estimate from straight-line distance (×1.25 street factor, 80 m/min). Not a routed ETA. */
export function walkMin(m: number): number {
  return Math.max(1, Math.round((m * 1.25) / 80));
}

/** Radius (meters, straight line) reachable in roughly `min` minutes on foot. */
export function walkRadius(min: number): number {
  return (min * 80) / 1.25;
}

export function fmtDist(m: number): string {
  const mi = m / 1609.34;
  if (mi < 0.1) return `${Math.round(m * 3.281 / 10) * 10} ft`;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

export type Mode = 'walk' | 'transit' | 'drive';

interface Dest { lat: number; lng: number; address?: string; name?: string }

function destQuery(d: Dest): string {
  // Street address → let the maps app geocode it (more precise than our approximate pins).
  if (d.address && /^\d/.test(d.address)) {
    return d.name && d.name !== 'Our Airbnb' ? `${d.name}, ${d.address}` : d.address;
  }
  if (d.name && d.address) return `${d.name}, ${d.address}`;
  return `${d.lat},${d.lng}`;
}

export function appleMapsUrl(d: Dest, mode: Mode = 'walk'): string {
  const flag = mode === 'walk' ? 'w' : mode === 'transit' ? 'r' : 'd';
  return `https://maps.apple.com/?daddr=${encodeURIComponent(destQuery(d))}&dirflg=${flag}`;
}

export function googleMapsUrl(d: Dest, mode: Mode = 'walk'): string {
  const tm = mode === 'walk' ? 'walking' : mode === 'transit' ? 'transit' : 'driving';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destQuery(d))}&travelmode=${tm}`;
}

/** Multi-stop route in Google Maps (up to 9 waypoints). Origin omitted = current location. */
export function googleRouteUrl(stops: Dest[], mode: Mode = 'walk'): string {
  const tm = mode === 'walk' ? 'walking' : mode === 'transit' ? 'transit' : 'driving';
  const pts = stops.slice(0, 11);
  const dest = pts[pts.length - 1];
  const way = pts.slice(0, -1);
  let url = `https://www.google.com/maps/dir/?api=1&travelmode=${tm}&destination=${encodeURIComponent(destQuery(dest))}`;
  if (way.length) url += `&waypoints=${encodeURIComponent(way.map(destQuery).join('|'))}`;
  return url;
}

export function navUrl(app: 'apple' | 'google', d: Dest, mode: Mode = 'walk') {
  return app === 'apple' ? appleMapsUrl(d, mode) : googleMapsUrl(d, mode);
}

export function placeDest(p: Place): Dest {
  return { lat: p.lat, lng: p.lng, address: p.address, name: p.name };
}

/** Suggest a sensible mode from distance. */
export function suggestMode(m: number): Mode {
  if (m < 1800) return 'walk';
  if (m < 15000) return 'transit';
  return 'drive';
}
