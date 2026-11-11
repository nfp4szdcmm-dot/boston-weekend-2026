import { useState } from 'react';
import type { Category, Place } from '../types';
import { useWikiPhoto } from '../lib/photos';
import { CAT } from './meta';

export function Photo({ place, wiki, category, className = '', rounded = 'rounded-2xl', hero = false }: { place?: Place; wiki?: string; category?: Category; className?: string; rounded?: string; hero?: boolean }) {
  const title = wiki ?? place?.wiki;
  const wikiUrl = useWikiPhoto(place?.photoUrl ? undefined : title);
  const [failed, setFailed] = useState(false);
  const url = !failed ? place?.photoUrl ?? wikiUrl : null;
  const cat = CAT[place?.category ?? category ?? 'sight'];
  if (url) {
    return (
      <div className={`relative overflow-hidden bg-sand ${rounded} ${className}`}>
        <img src={url} alt={place?.name ?? ''} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden grid place-items-center ${rounded} ${className}`}
      style={{ background: hero ? 'linear-gradient(160deg,#1d4e89,#14213d)' : `linear-gradient(135deg, ${cat.color}22, ${cat.color}55)` }}
      aria-hidden
    >
      {!hero && <cat.Icon size={28} color={cat.color} strokeWidth={1.6} />}
    </div>
  );
}
