import { useEffect, useState } from 'react';
import type { LatLng } from '../types';
import { distanceM } from './geo';
import { lsGet, lsSet } from './cache';

export interface DriveEstimate {
  minutes: number;
  miles: number;
  source: 'osrm' | 'rough';
}

/** Typical drive time from OSRM (OpenStreetMap road network). Does NOT include live traffic. */
export async function driveEstimate(a: LatLng, b: LatLng): Promise<DriveEstimate> {
  const key = `bw26-osrm-${a.lat.toFixed(3)},${a.lng.toFixed(3)}-${b.lat.toFixed(3)},${b.lng.toFixed(3)}`;
  const cached = lsGet<DriveEstimate>(key);
  if (cached) return cached;
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`);
    if (!r.ok) throw new Error();
    const j = await r.json();
    const route = j.routes?.[0];
    if (!route) throw new Error();
    const est: DriveEstimate = { minutes: Math.round(route.duration / 60), miles: route.distance / 1609.34, source: 'osrm' };
    lsSet(key, est);
    return est;
  } catch {
    // Rough fallback: 1.3× straight-line at 35 mph.
    const m = distanceM(a, b) * 1.3;
    return { minutes: Math.round(m / 1609.34 / 35 * 60) + 5, miles: m / 1609.34, source: 'rough' };
  }
}

export function useDriveEstimate(a?: LatLng | null, b?: LatLng | null): DriveEstimate | null {
  const [est, setEst] = useState<DriveEstimate | null>(null);
  const k = a && b ? `${a.lat.toFixed(3)},${a.lng.toFixed(3)},${b.lat.toFixed(3)},${b.lng.toFixed(3)}` : '';
  useEffect(() => {
    let alive = true;
    if (!a || !b) { setEst(null); return; }
    driveEstimate(a, b).then((e) => alive && setEst(e));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  return est;
}

/** Nearest-neighbour ordering + 2-opt cleanup. `fixedFirst` keeps index 0 as the start. */
export function optimizeOrder<T extends LatLng>(pts: T[], fixedFirst = true): T[] {
  if (pts.length < 3) return pts;
  const rest = [...pts];
  const route: T[] = [fixedFirst ? rest.shift()! : rest.shift()!];
  while (rest.length) {
    const last = route[route.length - 1];
    let bi = 0, bd = Infinity;
    rest.forEach((p, i) => { const d = distanceM(last, p); if (d < bd) { bd = d; bi = i; } });
    route.push(rest.splice(bi, 1)[0]);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let k = i + 1; k < route.length - 1; k++) {
        const d1 = distanceM(route[i - 1], route[i]) + distanceM(route[k], route[k + 1]);
        const d2 = distanceM(route[i - 1], route[k]) + distanceM(route[i], route[k + 1]);
        if (d2 + 1 < d1) { route.splice(i, k - i + 1, ...route.slice(i, k + 1).reverse()); improved = true; }
      }
    }
  }
  return route;
}

export function pathLength(pts: LatLng[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += distanceM(pts[i - 1], pts[i]);
  return s;
}
