import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { LocateFixed, Route, Home as HomeIcon, Layers } from 'lucide-react';
import type { Place } from '../types';
import { useUI } from '../store/ui';
import { useTrip, sortActivities } from '../store/trip';
import { activityPlace, useLocation, usePlan } from '../lib/hooks';
import { AIRBNB, PLACES } from '../data/places';
import { DAYS } from '../data/trip';
import { CAT } from '../components/meta';
import { Chip, Sheet } from '../components/ui';
import { googleRouteUrl, navUrl, placeDest, type Mode } from '../lib/geo';

type Layer = 'itinerary' | 'food' | 'shops' | 'sights' | 'saved';

function pinIcon(color: string, label: string, opts: { small?: boolean; saved?: boolean } = {}) {
  return L.divIcon({
    className: '',
    html: `<div class="pin ${opts.small ? 'small' : ''} ${opts.saved ? 'saved' : ''}" style="--c:${color}"><span>${label}</span></div>`,
    iconSize: opts.small ? [26, 26] : [34, 34],
    iconAnchor: opts.small ? [4, 26] : [5, 34],
  });
}

export default function MapScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const { mapDay, mapRoute, openPlace } = useUI();
  const [day, setDay] = useState<string | 'all'>(mapDay);
  const [layers, setLayers] = useState<Set<Layer>>(new Set(['itinerary', 'saved']));
  const [routeOpen, setRouteOpen] = useState(false);
  const { activities } = usePlan();
  const saved = useTrip((s) => s.saved);
  const mapApp = useTrip((s) => s.mapApp);
  const loc = useLocation();

  useEffect(() => { setDay(mapDay); if (mapRoute) setRouteOpen(true); }, [mapDay, mapRoute]);

  // Fill exactly the space between any top banner and the bottom nav.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setTop(Math.max(0, wrapRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  useEffect(() => { mapRef.current?.invalidateSize(); }, [top]);

  // Location errors show briefly instead of covering the map.
  const [showErr, setShowErr] = useState(false);
  useEffect(() => {
    if (!loc.error) return;
    setShowErr(true);
    const t = setTimeout(() => setShowErr(false), 6000);
    return () => clearTimeout(t);
  }, [loc.error]);

  const dayStops = useMemo(() => {
    const acts = sortActivities(activities).filter((a) => a.status !== 'skipped' && (day === 'all' || a.day === day));
    const seen = new Set<string>();
    const out: { place: Place; label: string; n: number }[] = [];
    acts.forEach((a) => {
      const p = activityPlace(a);
      if (!p) return;
      const key = `${p.id}-${day === 'all' ? '' : a.id}`;
      if (day === 'all' && seen.has(p.id)) return;
      seen.add(p.id);
      seen.add(key);
      out.push({ place: p, label: a.title, n: out.length + 1 });
    });
    return out;
  }, [activities, day]);

  // Init map once
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true }).setView([42.3601, -71.0589], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'osm-tiles',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    return () => { map.remove(); mapRef.current = null; meRef.current = null; };
  }, []);

  // Draw markers
  useEffect(() => {
    const map = mapRef.current, lg = layerRef.current;
    if (!map || !lg) return;
    lg.clearLayers();
    const stopIds = new Set(dayStops.map((s) => s.place.id));
    const bounds: L.LatLngExpression[] = [];

    const addPin = (p: Place, icon: L.DivIcon, z = 0) => {
      L.marker([p.lat, p.lng], { icon, zIndexOffset: z, title: p.name, keyboard: true })
        .on('click', () => openPlace(p))
        .addTo(lg);
    };

    // Home
    addPin(AIRBNB, pinIcon(CAT.lodging.color, '🏠'), 1000);

    if (layers.has('itinerary')) {
      const line = dayStops.map((s) => [s.place.lat, s.place.lng] as L.LatLngTuple);
      if (day !== 'all' && line.length > 1) {
        L.polyline(line, { color: '#14213d', weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(lg);
      }
      dayStops.forEach((s) => {
        if (s.place.id === 'airbnb') return;
        addPin(s.place, pinIcon(CAT[s.place.category].color, day === 'all' ? CAT[s.place.category].emoji : String(s.n), { saved: !!saved[s.place.id] }), 500);
        bounds.push([s.place.lat, s.place.lng]);
      });
    }

    const show = (p: Place) => {
      if (stopIds.has(p.id) || p.id === 'airbnb') return false;
      if (layers.has('saved') && saved[p.id]) return true;
      if (layers.has('food') && ['food', 'drinks', 'coffee', 'bakery'].includes(p.category)) return true;
      if (layers.has('shops') && ['shopping', 'boutique'].includes(p.category)) return true;
      if (layers.has('sights') && ['sight', 'photo', 'fun'].includes(p.category)) return true;
      return false;
    };
    const extra = [...PLACES, ...Object.values(saved).map((s) => s.place).filter((p) => !PLACES.some((c) => c.id === p.id))];
    extra.filter(show).forEach((p) => addPin(p, pinIcon(CAT[p.category].color, CAT[p.category].emoji, { small: true, saved: !!saved[p.id] })));

    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 16 });
  }, [dayStops, layers, saved, day, openPlace]);

  // Me marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (loc.coords) {
      const ll: L.LatLngTuple = [loc.coords.lat, loc.coords.lng];
      if (!meRef.current) {
        meRef.current = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 2000, title: 'You' }).addTo(map);
      } else meRef.current.setLatLng(ll);
    }
  }, [loc.coords]);

  const toggle = (l: Layer) => setLayers((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n; });
  const routeStops = dayStops.filter((s) => s.place.id !== 'airbnb' || dayStops.length < 2).map((s) => placeDest(s.place));

  return (
    <div ref={wrapRef} className="relative" style={{ height: `calc(100dvh - ${top}px - 68px - env(safe-area-inset-bottom))` }}>
      <div ref={ref} className="absolute inset-0 isolate z-0" role="application" aria-label="Trip map" />

      <div className="absolute top-0 inset-x-0 z-[450] pt-[calc(env(safe-area-inset-top)+10px)] px-3 space-y-2 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pr-12">
          <Chip active={day === 'all'} onClick={() => setDay('all')}>All days</Chip>
          {DAYS.map((d) => <Chip key={d.key} active={day === d.key} onClick={() => setDay(d.key)}>{d.short}</Chip>)}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pr-12">
          <span className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-white/90 text-navy"><Layers size={16} /></span>
          {([['itinerary', 'Itinerary'], ['food', '🍽️ Food & drink'], ['shops', '🛍️ Shops'], ['sights', '🏛️ Sights'], ['saved', '♥ Saved']] as [Layer, string][]).map(([id, label]) => (
            <Chip key={id} active={layers.has(id)} onClick={() => toggle(id)} className="h-9 text-[13px]">{label}</Chip>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 inset-x-0 z-[450] px-3 flex gap-2 justify-center">
        <button onClick={() => { if (!loc.coords) loc.start(); else mapRef.current?.setView([loc.coords.lat, loc.coords.lng], 16); }}
          aria-label="Center on my location" className="h-14 w-14 rounded-full bg-white shadow-float grid place-items-center text-harbor">
          <LocateFixed size={22} />
        </button>
        <button onClick={() => setRouteOpen(true)} disabled={day === 'all'}
          className="h-14 px-4 rounded-full bg-navy text-white text-[15px] font-semibold whitespace-nowrap shadow-float flex items-center gap-2 disabled:opacity-50">
          <Route size={20} /> Show Full Day Route
        </button>
        <a href={navUrl(mapApp, placeDest(AIRBNB), 'transit')} target="_blank" rel="noreferrer" aria-label="Take me home"
          className="h-14 w-14 rounded-full bg-white shadow-float grid place-items-center text-navy">
          <HomeIcon size={22} />
        </a>
      </div>
      {showErr && loc.error && <button onClick={() => setShowErr(false)} className="absolute bottom-24 inset-x-3 z-[450] bg-white rounded-2xl p-3 text-sm shadow-float text-left">{loc.error}</button>}

      <Sheet open={routeOpen && day !== 'all'} onClose={() => setRouteOpen(false)} title={`${DAYS.find((d) => d.key === day)?.label ?? ''} route`}>
        <ol className="space-y-1.5">
          {dayStops.map((s) => (
            <li key={s.n}>
              <button onClick={() => openPlace(s.place)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-2.5 text-left">
                <span className="h-7 w-7 rounded-full grid place-items-center text-white text-xs font-bold" style={{ background: CAT[s.place.category].color }}>{s.n}</span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-navy truncate">{s.label}</span><span className="block text-xs text-ink/60 truncate">{s.place.name}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink/70 mt-3">The dashed line on the map just connects stops in order. For real turn-by-turn routes, open the full route:</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {(['walk', 'transit', 'drive'] as Mode[]).map((m) => (
            <a key={m} href={googleRouteUrl(routeStops, m)} target="_blank" rel="noreferrer"
              className="h-12 rounded-2xl bg-navy text-white text-sm font-semibold grid place-items-center capitalize">{m === 'walk' ? 'Walking' : m === 'transit' ? 'Transit' : 'Driving'}</a>
          ))}
        </div>
        <p className="text-xs text-ink/50 mt-2">Opens Google Maps with up to 10 stops (Apple Maps doesn’t support multi-stop links). Google Maps may ignore transit for multi-stop routes.</p>
      </Sheet>
    </div>
  );
}
