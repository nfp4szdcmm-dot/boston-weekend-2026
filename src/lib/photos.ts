import { useEffect, useState } from 'react';
import { lsGet, lsSet } from './cache';

const KEY = 'bw26-wiki-photos-v2';
const mem: Record<string, string | null> = lsGet<Record<string, string | null>>(KEY) ?? {};
const inflight = new Map<string, Promise<string | null>>();

async function load(title: string): Promise<string | null> {
  if (title in mem) return mem[title];
  if (!inflight.has(title)) {
    inflight.set(
      title,
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const src: string | null = j?.thumbnail?.source ?? null;
          // Wikimedia only serves standard thumbnail widths; 960 is one of them.
          const big = src && (j?.originalimage?.width ?? 0) >= 960 ? src.replace(/\/(\d+)px-/, '/960px-') : src;
          mem[title] = big;
          lsSet(KEY, mem);
          return big;
        })
        .catch(() => null),
    );
  }
  return inflight.get(title)!;
}

/** Real photo from the place's Wikipedia article (cached for offline). */
export function useWikiPhoto(title?: string): string | null {
  const [url, setUrl] = useState<string | null>(title && title in mem ? mem[title] : null);
  useEffect(() => {
    let alive = true;
    if (!title) return;
    load(title).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [title]);
  return url;
}
