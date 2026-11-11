import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ChevronDown, ChevronUp, Navigation, Check, SkipForward, Pencil, Trash2, Plus, ArrowUp, ArrowDown, Lock, Route, Share2,
  RotateCcw, Heart, Search, Map as MapIcon,
} from 'lucide-react';
import type { Activity, Place } from '../types';
import { useTrip, sortActivities } from '../store/trip';
import { useUI } from '../store/ui';
import { activityPlace, actStart, findPlace, useLocation, useNow, usePlan } from '../lib/hooks';
import { DAYS, FLIGHTS } from '../data/trip';
import { PLACES, SUNDAY_DINNER, AIRBNB } from '../data/places';
import { CAT, priceStr } from '../components/meta';
import { Photo } from '../components/Photo';
import { Card, Chip, Pill, Sheet, SourceNote } from '../components/ui';
import { OpenBadge } from '../components/PlaceBits';
import { addMin, dayKey, fmt12, toMin, zoned, fmtClock } from '../lib/time';
import { distanceM, fmtDist, navUrl, placeDest, suggestMode, walkMin } from '../lib/geo';
import { optimizeOrder, pathLength, useDriveEstimate } from '../lib/routing';
import { openStateAt } from '../lib/hours';
import { encodePlan, shareUrl } from '../lib/share';
import { FlightCard } from './Essentials';

export default function Itinerary() {
  const now = useNow();
  const { activities, readOnly } = usePlan();
  const initial = useUI((s) => s.itineraryDay);
  const today = dayKey(now);
  const [day, setDay] = useState<string>(initial ?? (DAYS.some((d) => d.key === today) ? today : DAYS[0].key));
  useEffect(() => { if (initial) setDay(initial); }, [initial]);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [adding, setAdding] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const goMap = useUI((s) => s.goMap);

  const list = useMemo(() => sortActivities(activities).filter((a) => a.day === day), [activities, day]);
  const active = list.filter((a) => a.status === 'planned');
  const history = list.filter((a) => a.status !== 'planned');
  const meta = DAYS.find((d) => d.key === day)!;
  const flights = FLIGHTS.filter((f) => f.date === day);

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="sticky top-0 z-[500] bg-cream/95 backdrop-blur pt-[calc(env(safe-area-inset-top)+12px)] pb-3 px-4 border-b border-navy/5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[30px] text-navy">Itinerary</h1>
          <div className="flex gap-2">
            <button onClick={() => setSharing(true)} aria-label="Share itinerary" className="h-11 w-11 rounded-full bg-white shadow-card grid place-items-center text-navy"><Share2 size={18} /></button>
            {!readOnly && <button onClick={() => setAdding(true)} aria-label="Add activity" className="h-11 w-11 rounded-full bg-navy text-white grid place-items-center"><Plus size={20} /></button>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3" role="tablist">
          {DAYS.map((d) => (
            <button key={d.key} role="tab" aria-selected={day === d.key} onClick={() => setDay(d.key)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-center ${day === d.key ? 'bg-navy text-white shadow-card' : 'bg-white text-navy'}`}>
              <span className="text-sm font-semibold">{d.short}{d.key === today ? ' •' : ''}</span>
              <span className="text-[11px] opacity-75">{d.date}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide font-semibold text-brick">{meta.label}</div>
            <h2 className="font-display text-[24px] text-navy leading-tight">{meta.title}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => goMap(day, true)} className="h-10 px-3 rounded-full bg-white shadow-card text-sm font-medium text-navy flex items-center gap-1.5"><MapIcon size={16} /> Route</button>
            {!readOnly && day !== '2026-11-15' && day !== '2026-11-16' && (
              <button onClick={() => setOptimizing(true)} className="h-10 px-3 rounded-full bg-white shadow-card text-sm font-medium text-navy flex items-center gap-1.5"><Route size={16} /> Reorder</button>
            )}
          </div>
        </div>

        {day === '2026-11-15' && <SundayBanner now={now} />}

        {flights.length > 0 && (
          <div className="mt-4 space-y-2">
            {flights.map((f) => <FlightCard key={f.id} f={f} compact />)}
          </div>
        )}

        <ol className="mt-4 relative">
          <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-navy/10" aria-hidden />
          {active.map((a, i) => (
            <ActivityCard key={a.id} a={a} now={now} readOnly={readOnly} first={i === 0} last={i === active.length - 1} onEdit={() => setEditing(a)} />
          ))}
          {active.length === 0 && <p className="text-ink/60 py-6 text-center">Everything’s done or skipped for this day.</p>}
        </ol>

        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-navy mb-2 px-1">Trip history · {meta.short}</h3>
            <div className="space-y-2">
              {history.map((a) => <HistoryRow key={a.id} a={a} readOnly={readOnly} />)}
            </div>
          </div>
        )}
        <div className="h-6" />
      </div>

      {editing && <EditSheet a={editing} onClose={() => setEditing(null)} />}
      {adding && <AddSheet day={day} onClose={() => setAdding(false)} />}
      {optimizing && <OptimizeSheet day={day} acts={active} onClose={() => setOptimizing(false)} />}
      <ShareSheet open={sharing} onClose={() => setSharing(false)} />
    </div>
  );
}

function SundayBanner({ now }: { now: Date }) {
  const drive = useDriveEstimate(AIRBNB, findPlace('snhu-arena'));
  const base = drive?.minutes ?? 60;
  const buffered = Math.round(base * 1.3) + 30;
  const leaveBy = new Date(zoned('2026-11-15', '14:00').getTime() - buffered * 60000);
  const late = now > leaveBy && now < zoned('2026-11-15', '14:00');
  return (
    <Card className={`p-4 mt-4 ${late ? 'ring-2 ring-red-500' : ''}`}>
      <div className="flex items-center gap-2 text-brick font-semibold text-sm uppercase tracking-wide"><Lock size={14} /> Firm schedule</div>
      <div className="font-display text-xl text-navy mt-1">Be at SNHU Arena by 2:00 PM</div>
      <p className="text-sm text-ink/75 mt-1">
        Planned departure 11:15 AM. Latest safe departure ≈ <b>{fmtClock(leaveBy)}</b> (≈{base} min drive{drive?.source === 'osrm' ? ' per OSRM, no live traffic' : ' rough estimate'} + 30% buffer + 30 min parking & bag check).
      </p>
      <SourceNote>SNHU lists Fall 2026 Commencement Nov 14–15 at SNHU Arena. Check your ceremony time in SNHU’s official schedule.</SourceNote>
    </Card>
  );
}

function ActivityCard({ a, now, readOnly, onEdit, first, last }: { a: Activity; now: Date; readOnly: boolean; onEdit: () => void; first: boolean; last: boolean }) {
  const [open, setOpen] = useState(false);
  const place = activityPlace(a);
  const loc = useLocation((s) => s.coords);
  const mapApp = useTrip((s) => s.mapApp);
  const { setStatus, deleteActivity, swapWithNeighbor, toggleSaved, updateActivity } = useTrip();
  const saved = useTrip((s) => (place ? !!s.saved[place.id] : false));
  const { openPlace, showToast } = useUI();
  const cat = CAT[a.category];
  const dist = loc && place ? distanceM(loc, place) : null;
  const isNow = actStart(a) <= now && now < (a.end ? zoned(a.day, a.end) : new Date(actStart(a).getTime() + 3600000));
  const duration = a.end ? toMin(a.end) - toMin(a.start) : null;
  const options = (a.options ?? []).map((id) => findPlace(id)).filter((p): p is Place => !!p);

  return (
    <li className="relative pl-14 pb-3">
      <div className={`absolute left-[14px] top-4 h-[28px] w-[28px] rounded-full grid place-items-center text-[13px] border-[3px] border-cream ${isNow ? 'bg-brick text-white' : a.locked ? 'bg-navy text-white' : 'bg-white shadow-card'}`} aria-hidden>
        {a.locked ? <Lock size={12} /> : cat.emoji}
      </div>
      <div className={`bg-white rounded-3xl shadow-card overflow-hidden ${isNow ? 'ring-2 ring-brick' : ''}`}>
        <button className="w-full flex gap-3 p-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <Photo place={place} category={a.category} className="h-[72px] w-[72px] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-harbor">
              {fmt12(a.start)}{a.end ? ` – ${fmt12(a.end)}` : ''}
              {isNow && <Pill tone="red">Now</Pill>}
            </div>
            <div className="font-semibold text-navy text-[16px] leading-snug">{a.title}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: cat.color }}>{cat.label}</span>
              {a.locked && <Pill tone="navy">Required</Pill>}
              {a.tentative && <Pill tone="amber">Tentative</Pill>}
              {dist != null && <span className="text-[11px] text-ink/60">· {fmtDist(dist)}</span>}
            </div>
          </div>
          <span className="self-center text-navy/40">{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
        </button>

        {open && (
          <div className="px-3 pb-3 animate-fade">
            {a.description && <p className="text-[15px] text-ink/85 leading-relaxed">{a.description}</p>}
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              {duration != null && <Info label="Suggested time" value={`${Math.floor(duration / 60) ? `${Math.floor(duration / 60)}h ` : ''}${duration % 60 ? `${duration % 60}m` : ''}`} />}
              {place?.price ? <Info label="Price" value={priceStr(place.price)} /> : place?.free ? <Info label="Price" value="Free" /> : a.price ? <Info label="Price" value={a.price} /> : null}
              {dist != null && <Info label="From you" value={`${fmtDist(dist)} · ~${walkMin(dist)} min walk`} />}
              {place && <div className="col-span-2"><OpenBadge s={openStateAt(place, actStart(a))} /> <span className="text-xs text-ink/50">at planned time</span></div>}
            </div>
            {place?.address && <p className="text-sm text-ink/60 mt-2">{place.address}</p>}
            {a.notes && <p className="text-sm bg-sand rounded-2xl p-3 mt-3">📝 {a.notes}</p>}

            {a.dinnerPicker && <DinnerPicker a={a} />}

            {options.length > 0 && !a.dinnerPicker && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-navy/70 uppercase tracking-wide mb-1.5">Ideas (suggestions, not bookings)</div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {options.map((p) => (
                    <button key={p.id} onClick={() => openPlace(p)} className="shrink-0 w-[132px] text-left">
                      <Photo place={p} className="h-20 w-[132px]" />
                      <div className="text-[13px] font-semibold text-navy mt-1 leading-tight line-clamp-2">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mt-3">
              {place && (
                <a href={navUrl(mapApp, placeDest(place), dist != null ? suggestMode(dist) : 'walk')} target="_blank" rel="noreferrer" className="col-span-2 h-12 rounded-2xl bg-brick text-white font-semibold flex items-center justify-center gap-1.5">
                  <Navigation size={18} /> Navigate
                </a>
              )}
              {place && (
                <button onClick={() => openPlace(place)} className="h-12 rounded-2xl bg-sand text-navy text-sm font-medium">Details</button>
              )}
              {place && !readOnly && (
                <button aria-label="Save" onClick={() => { toggleSaved(place); showToast(saved ? 'Removed from Saved' : 'Saved ♥'); }} className={`h-12 rounded-2xl grid place-items-center ${saved ? 'bg-brick text-white' : 'bg-sand text-navy'}`}>
                  <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
            {!readOnly && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Btn onClick={() => { setStatus(a.id, 'done'); showToast('Nice! Moved to trip history'); }} icon={<Check size={18} />} label="Done" />
                <Btn disabled={a.locked} onClick={() => { setStatus(a.id, 'skipped'); showToast('Skipped'); }} icon={<SkipForward size={18} />} label="Skip" />
                <Btn onClick={onEdit} icon={<Pencil size={18} />} label={a.locked ? 'Notes' : 'Edit'} />
                <Btn disabled={a.locked} onClick={() => { if (confirm(`Delete “${a.title}”?`)) deleteActivity(a.id); }} icon={<Trash2 size={18} />} label="Delete" />
                <Btn disabled={a.locked || first} onClick={() => !swapWithNeighbor(a.id, -1) && showToast('Can’t move past a fixed event')} icon={<ArrowUp size={18} />} label="Earlier" />
                <Btn disabled={a.locked || last} onClick={() => !swapWithNeighbor(a.id, 1) && showToast('Can’t move past a fixed event')} icon={<ArrowDown size={18} />} label="Later" />
                <Btn disabled={a.locked} onClick={() => updateActivity(a.id, { start: addMin(a.start, -15), end: a.end ? addMin(a.end, -15) : undefined })} icon={<span className="text-xs font-bold">−15</span>} label="min" />
                <Btn disabled={a.locked} onClick={() => updateActivity(a.id, { start: addMin(a.start, 15), end: a.end ? addMin(a.end, 15) : undefined })} icon={<span className="text-xs font-bold">+15</span>} label="min" />
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream rounded-2xl px-3 py-2">
      <div className="text-[11px] text-ink/50 uppercase tracking-wide">{label}</div>
      <div className="font-medium text-navy">{value}</div>
    </div>
  );
}

function Btn({ onClick, icon, label, disabled }: { onClick: () => void; icon: ReactNode; label: string; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick} className="h-14 rounded-2xl bg-cream text-navy flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium disabled:opacity-30">
      {icon}{label}
    </button>
  );
}

function HistoryRow({ a, readOnly }: { a: Activity; readOnly: boolean }) {
  const setStatus = useTrip((s) => s.setStatus);
  return (
    <div className="flex items-center gap-3 bg-white/70 rounded-2xl px-3 py-2.5">
      <span className={`h-8 w-8 rounded-full grid place-items-center ${a.status === 'done' ? 'bg-emerald-600 text-white' : 'bg-sand text-ink/50'}`}>
        {a.status === 'done' ? <Check size={16} /> : <SkipForward size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${a.status === 'skipped' ? 'line-through text-ink/50' : 'text-navy'}`}>{a.title}</div>
        <div className="text-xs text-ink/50">{fmt12(a.start)} · {a.status === 'done' ? 'Done' : 'Skipped'}</div>
      </div>
      {!readOnly && (
        <button onClick={() => setStatus(a.id, 'planned')} className="h-10 px-3 rounded-full bg-sand text-navy text-xs font-semibold flex items-center gap-1"><RotateCcw size={14} /> Restore</button>
      )}
    </div>
  );
}

/** Sunday dinner: choose an arrival time, see which picks are open then. */
function DinnerPicker({ a }: { a: Activity }) {
  const [arrive, setArrive] = useState(a.start);
  const openPlace = useUI((s) => s.openPlace);
  const update = useTrip((s) => s.updateActivity);
  const at = zoned(a.day, arrive);
  const drive = useDriveEstimate(findPlace('snhu-arena'), AIRBNB);
  return (
    <div className="mt-3 rounded-2xl bg-cream p-3">
      <div className="text-sm font-semibold text-navy">Pick dinner at the last minute</div>
      <p className="text-xs text-ink/60 mt-0.5">
        Manchester → Somerville ≈ {drive ? `${drive.minutes} min` : '…'} without traffic ({drive?.source === 'osrm' ? 'OSRM' : 'rough'}). Use Maps for live traffic.
      </p>
      <label className="text-xs font-medium text-navy mt-2 block" htmlFor="arr">We’ll arrive around</label>
      <input id="arr" type="time" value={arrive} onChange={(e) => setArrive(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-navy/15 bg-white px-3" />
      {SUNDAY_DINNER.map((g) => (
        <div key={g.area} className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-harbor">{g.area}</div>
          <div className="mt-1 space-y-1.5">
            {g.ids.map((id) => findPlace(id)).filter((p): p is Place => !!p).map((p) => {
              const os = openStateAt(p, at);
              return (
                <div key={p.id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                  <button className="flex-1 text-left min-w-0" onClick={() => openPlace(p)}>
                    <div className="text-sm font-semibold text-navy truncate">{p.name}</div>
                    <div className="text-[11px] text-ink/60">{p.cuisine?.join(', ')} {priceStr(p.price)}</div>
                  </button>
                  <OpenBadge s={os} />
                  <button onClick={() => update(a.id, { placeId: p.id, title: `Dinner: ${p.name}` })} className="h-9 px-3 rounded-full bg-navy text-white text-xs font-semibold">Pick</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <SourceNote>“Hours not verified” means we have no reliable live hours — tap a place for its website or Google listing before heading there. With the optional Google Places setup, open/closed is checked at your arrival time.</SourceNote>
    </div>
  );
}

function EditSheet({ a, onClose }: { a: Activity; onClose: () => void }) {
  const update = useTrip((s) => s.updateActivity);
  const [title, setTitle] = useState(a.title);
  const [day, setDay] = useState(a.day);
  const [start, setStart] = useState(a.start);
  const [end, setEnd] = useState(a.end ?? '');
  const [notes, setNotes] = useState(a.notes ?? '');
  const locked = !!a.locked;
  return (
    <Sheet open onClose={onClose} title={locked ? 'Notes (required event)' : 'Edit stop'}>
      {locked && <p className="text-sm bg-sand rounded-2xl p-3 mb-3">Required events can’t be moved or deleted. You can still add notes.</p>}
      {!locked && (
        <>
          <Field label="Name"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></Field>
          <Field label="Day (move to another day)">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">{DAYS.map((d) => <Chip key={d.key} active={day === d.key} onClick={() => setDay(d.key)}>{d.short}</Chip>)}</div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="input" /></Field>
            <Field label="End"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="input" /></Field>
          </div>
        </>
      )}
      <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input h-auto py-2" /></Field>
      <button
        onClick={() => {
          if (!locked && end && toMin(end) <= toMin(start)) { alert('End time should be after start time.'); return; }
          update(a.id, locked ? { notes } : { title, day, start, end: end || undefined, notes });
          onClose();
        }}
        className="mt-2 w-full h-14 rounded-2xl bg-navy text-white font-semibold">Save</button>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-navy mb-1.5">{label}</span>
      {children}
    </label>
  );
}

interface GeoHit { name: string; lat: number; lng: number; address: string }

function AddSheet({ day, onClose }: { day: string; onClose: () => void }) {
  const add = useTrip((s) => s.addActivity);
  const saved = useTrip((s) => s.saved);
  const toast = useUI((s) => s.showToast);
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [picked, setPicked] = useState<Place | null>(null);
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const local = useMemo(() => {
    const all = [...PLACES, ...Object.values(saved).map((s) => s.place)];
    const uniq = new Map(all.map((p) => [p.id, p]));
    const qq = q.trim().toLowerCase();
    return [...uniq.values()].filter((p) => !qq || p.name.toLowerCase().includes(qq) || p.neighborhood?.toLowerCase().includes(qq)).slice(0, 8);
  }, [q, saved]);

  async function searchAddress() {
    if (!q.trim()) return;
    setSearching(true); setErr(null);
    try {
      // Photon (komoot) — free OpenStreetMap geocoder, biased to Boston.
      const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=42.36&lon=-71.06&limit=6`);
      const j = await r.json();
      setHits((j.features ?? []).map((f: any) => ({
        name: f.properties.name ?? q,
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
        address: [f.properties.housenumber, f.properties.street, f.properties.city, f.properties.state].filter(Boolean).join(' '),
      })));
    } catch {
      setErr('Address search unavailable (offline?). You can still add a stop without a location.');
    } finally { setSearching(false); }
  }

  return (
    <Sheet open onClose={onClose} title={`Add to ${DAYS.find((d) => d.key === day)?.label}`} full>
      <Field label="Search our places or any address">
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Tatte, Fenway Park, 1 Main St" className="input flex-1" />
          <button onClick={searchAddress} aria-label="Search address" className="h-12 w-12 rounded-2xl bg-navy text-white grid place-items-center"><Search size={18} /></button>
        </div>
      </Field>
      {searching && <SourceNote>Searching…</SourceNote>}
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="space-y-1.5">
        {local.map((p) => (
          <button key={p.id} onClick={() => { setPicked(p); setTitle(p.name); }} className={`w-full flex items-center gap-2 rounded-2xl p-2 text-left ${picked?.id === p.id ? 'bg-navy text-white' : 'bg-white'}`}>
            <span aria-hidden>{CAT[p.category].emoji}</span>
            <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
            <span className="text-xs opacity-60">{p.neighborhood}</span>
          </button>
        ))}
        {hits.map((h, i) => (
          <button key={i} onClick={() => {
            const p: Place = { id: `custom-${Date.now()}`, name: h.name, category: 'sight', lat: h.lat, lng: h.lng, address: h.address, source: 'custom' };
            setPicked(p); setTitle(h.name);
          }} className={`w-full flex items-center gap-2 rounded-2xl p-2 text-left ${picked?.name === h.name && picked.lat === h.lat ? 'bg-navy text-white' : 'bg-white'}`}>
            <span aria-hidden>📍</span>
            <span className="flex-1 min-w-0"><span className="block truncate text-sm font-medium">{h.name}</span><span className="block truncate text-xs opacity-60">{h.address}</span></span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Stop name"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="What are we doing?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="input" /></Field>
          <Field label="End"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="input" /></Field>
        </div>
      </div>
      <button
        disabled={!title.trim()}
        onClick={() => {
          add({
            day, start, end, title: title.trim(), category: picked?.category ?? 'sight',
            placeId: picked?.source === 'curated' ? picked.id : undefined,
            placeSnapshot: picked && picked.source !== 'curated' ? picked : undefined,
            description: picked?.why,
          });
          toast('Added');
          onClose();
        }}
        className="mt-2 w-full h-14 rounded-2xl bg-navy text-white font-semibold disabled:opacity-40">Add stop</button>
    </Sheet>
  );
}

function OptimizeSheet({ day, acts, onClose }: { day: string; acts: Activity[]; onClose: () => void }) {
  const apply = useTrip((s) => s.applyOrder);
  const toast = useUI((s) => s.showToast);
  const withPlace = acts.map((a) => ({ a, p: activityPlace(a) })).filter((x) => x.p && !x.a.locked) as { a: Activity; p: Place }[];
  const pts = withPlace.map((x) => ({ lat: x.p.lat, lng: x.p.lng, id: x.a.id }));
  const best = optimizeOrder(pts);
  const before = pathLength(pts);
  const after = pathLength(best);
  const changed = best.some((p, i) => p.id !== pts[i]?.id);
  return (
    <Sheet open onClose={onClose} title="Suggested order">
      {!changed || before - after < 150 ? (
        <p className="text-[15px] text-ink/80">This day is already in a sensible walking order. 👍</p>
      ) : (
        <>
          <p className="text-sm text-ink/70">Reordering saves about <b>{fmtDist(before - after)}</b> of straight-line travel. Your time slots stay the same; only which stop goes in which slot changes.</p>
          <ol className="mt-3 space-y-1.5">
            {best.map((p, i) => {
              const a = withPlace.find((x) => x.a.id === p.id)!.a;
              return <li key={p.id} className="bg-white rounded-2xl px-3 py-2 text-sm"><b>{i + 1}.</b> {a.title}</li>;
            })}
          </ol>
          <button onClick={() => { apply(day, best.map((p) => p.id)); toast('Reordered'); onClose(); }} className="mt-4 w-full h-14 rounded-2xl bg-navy text-white font-semibold">Apply this order</button>
        </>
      )}
      <SourceNote>Based on straight-line distances between stops. Required events are never moved.</SourceNote>
    </Sheet>
  );
}

function ShareSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const acts = useTrip((s) => s.activities);
  const saved = useTrip((s) => s.saved);
  const [url, setUrl] = useState<string | null>(null);
  const toast = useUI((s) => s.showToast);
  useEffect(() => {
    if (!open) return;
    encodePlan(acts, saved).then((t) => setUrl(shareUrl(t)));
  }, [open, acts, saved]);
  return (
    <Sheet open={open} onClose={onClose} title="Share with the group">
      <p className="text-[15px] text-ink/80">
        This creates a <b>read-only snapshot link</b> of the itinerary and saved places as they are right now. Anyone with the link can view it; they can tap “Use it” to copy it to their own phone.
      </p>
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-2xl p-3 mt-3">
        Edits are stored <b>on each device</b> and do not sync automatically. After changing plans, share a fresh link. Contacts and rental details are never included.
      </p>
      {url ? (
        <>
          <button
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ title: 'Boston Weekend 2026 plan', url });
                else { await navigator.clipboard.writeText(url); toast('Link copied'); }
              } catch { /* cancelled */ }
            }}
            className="mt-4 w-full h-14 rounded-2xl bg-navy text-white font-semibold flex items-center justify-center gap-2"><Share2 size={18} /> Share link</button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { toast('Copy failed'); } }}
            className="mt-2 w-full h-12 rounded-2xl bg-white border border-navy/10 text-navy font-medium">Copy link</button>
          <SourceNote>Link length: {url.length.toLocaleString()} characters. Works once the app is deployed to a public URL.</SourceNote>
        </>
      ) : <SourceNote>Preparing link…</SourceNote>}
    </Sheet>
  );
}

