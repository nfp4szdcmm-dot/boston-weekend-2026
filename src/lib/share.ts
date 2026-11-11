import type { Activity, Place, SavedEntry } from '../types';

export interface SharedPlan {
  v: 1;
  exportedAt: string;
  activities: Activity[];
  saved?: Place[];
}

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([data]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodePlan(activities: Activity[], saved: Record<string, SavedEntry>): Promise<string> {
  const plan: SharedPlan = {
    v: 1,
    exportedAt: new Date().toISOString(),
    // Notes may be personal — keep them, but drop nothing else sensitive (no contacts, no rental details).
    activities,
    saved: Object.values(saved).map((s) => s.place),
  };
  const raw = new TextEncoder().encode(JSON.stringify(plan));
  if (typeof CompressionStream !== 'undefined') {
    const z = await pipe(raw, new CompressionStream('gzip'));
    return 'z.' + toB64Url(z);
  }
  return 'p.' + toB64Url(raw);
}

export async function decodePlan(token: string): Promise<SharedPlan | null> {
  try {
    const [kind, body] = [token.slice(0, 1), token.slice(2)];
    let bytes = fromB64Url(body);
    if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('gzip'));
    const plan = JSON.parse(new TextDecoder().decode(bytes)) as SharedPlan;
    if (plan.v !== 1 || !Array.isArray(plan.activities)) return null;
    return plan;
  } catch {
    return null;
  }
}

export function shareUrl(token: string): string {
  return `${location.origin}${location.pathname}#plan=${token}`;
}
