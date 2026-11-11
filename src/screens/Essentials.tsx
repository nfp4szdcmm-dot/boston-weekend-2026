import { useState, type ReactNode } from 'react';
import { Plane, Copy, Navigation, ExternalLink, Trash2, Plus, Car, AlertTriangle, Phone, CheckCircle2, Circle, GraduationCap, Home as HomeIcon } from 'lucide-react';
import { Sheet, Card, Chip, SourceNote, Pill } from '../components/ui';
import { useTrip, newId } from '../store/trip';
import { useUI } from '../store/ui';
import { useNow, useWeather } from '../lib/hooks';
import { AIRBNB, PLACE_BY_ID } from '../data/places';
import { DAYS, FLIGHTS, LINKS, type Flight } from '../data/trip';
import { fmt12, humanDuration, tzAbbr, zoned, dayKey, hhmm } from '../lib/time';
import { navUrl, placeDest } from '../lib/geo';
import { weatherLabel } from '../lib/weather';
import type { Rental } from '../types';

export function FlightCard({ f, compact = false }: { f: Flight; compact?: boolean }) {
  const dep = zoned(f.date, f.from.time, f.from.tz);
  const arr = zoned(f.date, f.to.time, f.to.tz);
  const idx = FLIGHTS.findIndex((x) => x.id === f.id);
  const nextLeg = FLIGHTS[idx + 1]?.date === f.date ? FLIGHTS[idx + 1] : null;
  const layover = nextLeg ? zoned(nextLeg.date, nextLeg.from.time, nextLeg.from.tz).getTime() - arr.getTime() : null;
  return (
    <div>
      <div className="bg-white rounded-3xl shadow-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy"><Plane size={16} className="text-brick" /> {f.number}</div>
          <span className="text-xs text-ink/60">{f.airline} · {new Date(f.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center mt-3">
          <div>
            <div className="font-display text-[30px] leading-none text-navy">{f.from.code}</div>
            <div className="text-sm font-semibold mt-1">{fmt12(f.from.time)} <span className="text-ink/50 font-normal">{tzAbbr(f.from.tz, dep)}</span></div>
            {!compact && <div className="text-xs text-ink/60">{f.from.city}</div>}
          </div>
          <div className="flex-1 mx-3 text-center">
            <div className="text-[11px] text-ink/50">{humanDuration(arr.getTime() - dep.getTime())}</div>
            <div className="h-px bg-navy/20 relative my-1"><Plane size={14} className="absolute left-1/2 -translate-x-1/2 -top-[7px] text-navy bg-white" /></div>
          </div>
          <div className="text-right">
            <div className="font-display text-[30px] leading-none text-navy">{f.to.code}</div>
            <div className="text-sm font-semibold mt-1">{fmt12(f.to.time)} <span className="text-ink/50 font-normal">{tzAbbr(f.to.tz, arr)}</span></div>
            {!compact && <div className="text-xs text-ink/60">{f.to.city}</div>}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <a href={`https://www.flightaware.com/live/flight/${f.ident}`} target="_blank" rel="noreferrer" className="flex-1 h-10 rounded-xl bg-sand text-navy text-xs font-semibold flex items-center justify-center gap-1">Live status (FlightAware) <ExternalLink size={11} /></a>
          <a href="https://www.aa.com/travelInformation/flights/status" target="_blank" rel="noreferrer" className="flex-1 h-10 rounded-xl bg-sand text-navy text-xs font-semibold flex items-center justify-center gap-1">AA flight status <ExternalLink size={11} /></a>
        </div>
      </div>
      {layover != null && (
        <div className="text-center text-xs text-ink/60 py-1.5">⏱ Layover in {f.to.city}: <b>{humanDuration(layover)}</b>{layover < 75 * 60000 ? ' — tight, head straight to the next gate' : ''}</div>
      )}
    </div>
  );
}

export default function Essentials() {
  const open = useUI((s) => s.essentialsOpen);
  const setOpen = useUI((s) => s.setEssentials);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Trip essentials" full>
      {open && <EssentialsBody />}
    </Sheet>
  );
}

function EssentialsBody() {
  const s = useTrip();
  const shared = useUI((x) => !!x.shared);
  const toast = useUI((x) => x.showToast);
  const wx = useWeather();
  const now = useNow();
  const arena = PLACE_BY_ID['snhu-arena'];

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast('Copied'); } catch { toast('Copy failed'); } };
  const r = s.rental;
  const returnBad = r.returnPlan === 'not_confirmed' || r.returnPlan === 'neighborhood_monday';
  const pickupSunday = r.pickupDay === '2026-11-15';

  return (
    <div className="space-y-6 pb-6">
      {/* Airbnb */}
      <Section title="Home base" icon={<HomeIcon size={18} />}>
        <Card className="p-4">
          <div className="font-semibold text-navy text-lg">485 Foley Street</div>
          <div className="text-ink/70">Somerville, MA 02145</div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a href={navUrl(s.mapApp, placeDest(AIRBNB), 'transit')} target="_blank" rel="noreferrer" className="h-12 rounded-2xl bg-navy text-white font-semibold flex items-center justify-center gap-1.5"><Navigation size={16} /> Take me home</a>
            <button onClick={() => copy('485 Foley St, Somerville, MA 02145')} className="h-12 rounded-2xl bg-sand text-navy font-medium flex items-center justify-center gap-1.5"><Copy size={16} /> Copy address</button>
          </div>
          <SourceNote>Check-in time, door codes and host contact: use the Airbnb app (not stored here on purpose). Nearest T: Assembly (Orange Line).</SourceNote>
        </Card>
      </Section>

      {/* Flights */}
      <Section title="Flights" icon={<Plane size={18} />}>
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">Friday, Nov 13 · Outbound</div>
        {FLIGHTS.filter((f) => f.date === '2026-11-13').map((f) => <FlightCard key={f.id} f={f} />)}
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1 mt-3">Monday, Nov 16 · Return</div>
        {FLIGHTS.filter((f) => f.date === '2026-11-16').map((f) => <FlightCard key={f.id} f={f} />)}
        <SourceNote>All times are local to each airport. Booking codes and passenger details are intentionally not stored.</SourceNote>
      </Section>

      {/* Rental */}
      <Section title="Rental car" icon={<Car size={18} />}>
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy flex-1">Status</span>
            <Chip active={r.status === 'not_confirmed'} onClick={() => !shared && s.setRental({ status: 'not_confirmed' })}>Not confirmed</Chip>
            <Chip active={r.status === 'confirmed'} onClick={() => !shared && s.setRental({ status: 'confirmed' })}>Confirmed</Chip>
          </div>
          <Labeled label="Branch / pickup location">
            <input className="input" value={r.branch} placeholder="Not confirmed" onChange={(e) => s.setRental({ branch: e.target.value })} disabled={shared} />
          </Labeled>
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Pickup day">
              <select className="input" value={r.pickupDay} onChange={(e) => s.setRental({ pickupDay: e.target.value })} disabled={shared}>
                {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </Labeled>
            <Labeled label="Pickup time">
              <input type="time" className="input" value={r.pickupTime} onChange={(e) => s.setRental({ pickupTime: e.target.value })} disabled={shared} />
            </Labeled>
          </div>
          <Labeled label="Return plan">
            <select className="input" value={r.returnPlan} onChange={(e) => s.setRental({ returnPlan: e.target.value as Rental['returnPlan'] })} disabled={shared}>
              <option value="not_confirmed">Not confirmed</option>
              <option value="neighborhood_sunday">Return to neighborhood branch Sunday evening (drop box?)</option>
              <option value="neighborhood_monday">Return to neighborhood branch Monday morning</option>
              <option value="logan_monday">One-way return at Logan Monday (confirmed with Enterprise)</option>
              <option value="other">Other</option>
            </select>
          </Labeled>
          <Labeled label="Return details"><input className="input" value={r.returnDetails} placeholder="Not confirmed" onChange={(e) => s.setRental({ returnDetails: e.target.value })} disabled={shared} /></Labeled>
          <Labeled label="Price"><input className="input" value={r.price} placeholder="Not confirmed" onChange={(e) => s.setRental({ price: e.target.value })} disabled={shared} /></Labeled>
          <Labeled label="Notes"><input className="input" value={r.notes} placeholder="Confirmation is in your Enterprise email" onChange={(e) => s.setRental({ notes: e.target.value })} disabled={shared} /></Labeled>

          {pickupSunday && (
            <Warn>
              Sunday pickup: the Sullivan Square branch (37 Mystic Ave, 617-625-1766) shows <b>no Sunday hours</b> on Enterprise’s location page (Sat listed 9 AM–12 PM). Call to confirm, or pick up Saturday morning / at Logan.
            </Warn>
          )}
          {returnBad && (
            <Warn urgent={r.returnPlan === 'neighborhood_monday'}>
              {r.returnPlan === 'neighborhood_monday'
                ? 'This doesn’t work with a 7:00 AM flight — neighborhood branches typically open around 8 AM weekdays. '
                : 'Return plan not set. '}
              Don’t assume a neighborhood rental can be dropped at Logan — ask Enterprise about a one-way airport return (fees may apply) or an after-hours Sunday drop-off.
            </Warn>
          )}
          {r.returnPlan === 'neighborhood_sunday' && (
            <Warn>Sunday-evening return means no car Monday morning — plan a rideshare to Logan around 4:20 AM.</Warn>
          )}
          <div className="flex gap-2">
            <a href={PLACE_BY_ID['enterprise-sullivan'].website} target="_blank" rel="noreferrer" className="flex-1 h-11 rounded-xl bg-sand text-navy text-sm font-medium flex items-center justify-center gap-1">Sullivan Sq branch <ExternalLink size={12} /></a>
            <a href="tel:6176251766" className="flex-1 h-11 rounded-xl bg-sand text-navy text-sm font-medium flex items-center justify-center gap-1"><Phone size={14} /> Call branch</a>
          </div>
        </Card>
      </Section>

      {/* Graduation */}
      <Section title="SNHU graduation" icon={<GraduationCap size={18} />}>
        <Card className="p-4">
          <div className="font-semibold text-navy text-lg">SNHU Arena</div>
          <div className="text-ink/70">555 Elm Street, Manchester, NH 03101</div>
          <ul className="mt-3 text-sm space-y-1.5 text-ink/85">
            <li>• <b>At the arena by 2:00 PM</b> · ceremony 3:00 PM (Sun, Nov 15)</li>
            <li>• SNHU lists Fall 2026 Commencement as Nov 14–15, 2026</li>
            <li>• Bag check at entry; arena policy lists a 9″×12″×4″ max bag (clear tote OK) — confirm for this event</li>
            <li>• Accessible parking: Cedar Street lot off Elm St (per SNHU accessibility info)</li>
            <li>• General parking details for Fall 2026: <i>not found — check SNHU’s commencement pages</i></li>
          </ul>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a href={navUrl(s.mapApp, placeDest(arena), 'drive')} target="_blank" rel="noreferrer" className="h-12 rounded-2xl bg-navy text-white font-semibold flex items-center justify-center gap-1.5"><Navigation size={16} /> Drive there</a>
            <button onClick={() => copy('SNHU Arena, 555 Elm St, Manchester, NH 03101')} className="h-12 rounded-2xl bg-sand text-navy font-medium flex items-center justify-center gap-1.5"><Copy size={16} /> Copy address</button>
          </div>
        </Card>
      </Section>

      {/* Weather */}
      <Section title="Boston weather" icon={<span aria-hidden>⛅</span>}>
        <Card className="p-4">
          {wx.data ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map((d) => {
                  const w = wx.data!.daily.find((x) => x.date === d.key);
                  return (
                    <div key={d.key} className="bg-cream rounded-2xl p-2 text-center">
                      <div className="text-xs font-semibold text-navy">{d.short}</div>
                      {w ? (
                        <>
                          <div className="text-2xl my-1" aria-hidden>{weatherLabel(w.code).emoji}</div>
                          <div className="text-sm font-semibold">{Math.round(w.hi)}° / {Math.round(w.lo)}°</div>
                          <div className="text-[11px] text-ink/60">{w.pop}% rain</div>
                        </>
                      ) : <div className="text-[11px] text-ink/50 py-3">Not in forecast yet</div>}
                    </div>
                  );
                })}
              </div>
              <SourceNote>Open-Meteo forecast{wx.live ? '' : ' (cached copy — offline)'} · updated {new Date(wx.data.fetchedAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Forecasts more than a few days out are rough.</SourceNote>
            </>
          ) : wx.error ? <p className="text-sm text-red-700">Weather unavailable: {wx.error}</p> : <p className="text-sm text-ink/60">Loading…</p>}
        </Card>
      </Section>

      {/* Checklists */}
      <Section title="Trip checklist" icon={<CheckCircle2 size={18} />}>
        <Checklist which="checklist" />
      </Section>
      <Section title="Monday departure checklist" icon={<Plane size={18} />}>
        {returnBad && <Warn urgent>Rental return isn’t compatible with the 7 AM flight yet — fix this in “Rental car” above.</Warn>}
        <Checklist which="departure" />
      </Section>

      {/* Contacts */}
      <Section title="Emergency contacts" icon={<Phone size={18} />}>
        <Card className="p-4">
          <a href="tel:911" className="flex items-center gap-3 h-12 rounded-2xl bg-red-50 text-red-800 font-semibold px-4"><Phone size={16} /> Emergency: 911</a>
          <Contacts />
        </Card>
      </Section>

      {/* Links */}
      <Section title="Important links" icon={<ExternalLink size={18} />}>
        <Card className="divide-y divide-navy/5">
          {LINKS.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 h-12 text-sm text-navy">
              {l.label} <ExternalLink size={14} className="opacity-50" />
            </a>
          ))}
        </Card>
      </Section>

      {/* Settings */}
      {!shared && (
        <Section title="Settings" icon={<span aria-hidden>⚙️</span>}>
          <Card className="p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-navy mb-2">Open directions in</div>
              <div className="flex gap-2">
                <Chip active={s.mapApp === 'apple'} onClick={() => s.setMapApp('apple')}>Apple Maps</Chip>
                <Chip active={s.mapApp === 'google'} onClick={() => s.setMapApp('google')}>Google Maps</Chip>
              </div>
            </div>
            <PreviewClock now={now} />
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => { if (confirm('Reset the itinerary to the original plan? Your edits on this device will be lost.')) { s.resetItinerary(); toast('Itinerary reset'); } }}
                className="h-12 rounded-2xl bg-sand text-navy font-medium">Reset itinerary to original</button>
            </div>
          </Card>
        </Section>
      )}

      <Section title="About the data" icon={<span aria-hidden>ℹ️</span>}>
        <div className="text-sm text-ink/75 space-y-2">
          <p><b>Your edits</b> are saved on this device only (works offline). Share a read-only link from the Itinerary tab; changes don’t sync between phones.</p>
          <p><b>Curated places</b> were researched in Nov 2026; hours are only shown where a source listed them. Map pins are approximate — navigation uses the street address.</p>
          <p><b>Live places</b>: OpenStreetMap (free, community data, no ratings) or Google Places when configured. Labels show which.</p>
          <p><b>Weather</b>: Open-Meteo. <b>Drive estimates</b>: OSRM, no live traffic. <b>Walking times</b>: estimated from distance. <b>Photos</b>: Wikipedia/Wikimedia Commons.</p>
          <p>Nothing in this app is a reservation or booking.</p>
        </div>
      </Section>
      <div className="text-center text-xs text-ink/40">{dayKey(now)} {hhmm(now)} ET</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 font-display text-xl text-navy mb-2"><span className="text-brick">{icon}</span>{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-ink/60 mb-1">{label}</span>{children}</label>;
}

function Warn({ children, urgent = false }: { children: ReactNode; urgent?: boolean }) {
  return (
    <div className={`flex gap-2 rounded-2xl p-3 text-sm ${urgent ? 'bg-red-50 border border-red-200 text-red-900' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
      <AlertTriangle size={16} className="shrink-0 mt-0.5" /><div>{children}</div>
    </div>
  );
}

function Checklist({ which }: { which: 'checklist' | 'departure' }) {
  const items = useTrip((s) => s[which]);
  const { toggleCheck, addCheck, removeCheck } = useTrip();
  const shared = useUI((s) => !!s.shared);
  const [text, setText] = useState('');
  const done = items.filter((i) => i.done).length;
  return (
    <Card className="p-2">
      <div className="px-3 pt-2 pb-1 text-xs text-ink/60">{done}/{items.length} done</div>
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-2">
          <button disabled={shared} onClick={() => toggleCheck(which, i.id)} className="flex-1 flex items-center gap-3 px-3 min-h-[48px] text-left" aria-pressed={i.done}>
            {i.done ? <CheckCircle2 size={22} className="text-emerald-600 shrink-0" /> : <Circle size={22} className="text-navy/30 shrink-0" />}
            <span className={`text-[15px] ${i.done ? 'line-through text-ink/40' : 'text-ink'}`}>{i.text}</span>
          </button>
          {!shared && <button onClick={() => removeCheck(which, i.id)} aria-label={`Remove ${i.text}`} className="h-10 w-10 grid place-items-center text-ink/30"><Trash2 size={16} /></button>}
        </div>
      ))}
      {!shared && (
        <form className="flex gap-2 p-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addCheck(which, text.trim()); setText(''); } }}>
          <input className="input flex-1 h-11" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item" />
          <button className="h-11 w-11 rounded-2xl bg-navy text-white grid place-items-center" aria-label="Add item"><Plus size={18} /></button>
        </form>
      )}
    </Card>
  );
}

function Contacts() {
  const contacts = useTrip((s) => s.contacts);
  const { upsertContact, removeContact } = useTrip();
  const shared = useUI((s) => !!s.shared);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <div className="mt-3 space-y-2">
      {contacts.length === 0 && <p className="text-sm text-ink/60">No contacts added yet — add each traveler and someone back home.</p>}
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center gap-2 bg-cream rounded-2xl px-3 py-2">
          <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{c.name}</div><div className="text-xs text-ink/60">{c.phone}</div></div>
          <a href={`tel:${c.phone}`} className="h-10 w-10 grid place-items-center rounded-full bg-navy text-white" aria-label={`Call ${c.name}`}><Phone size={16} /></a>
          {!shared && <button onClick={() => removeContact(c.id)} className="h-10 w-10 grid place-items-center text-ink/40" aria-label={`Remove ${c.name}`}><Trash2 size={16} /></button>}
        </div>
      ))}
      {!shared && (
        <form className="grid grid-cols-[1fr_1fr_auto] gap-2" onSubmit={(e) => { e.preventDefault(); if (name && phone) { upsertContact({ id: newId(), name, phone, note: '' }); setName(''); setPhone(''); } }}>
          <input className="input h-11" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input h-11" placeholder="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="h-11 w-11 rounded-2xl bg-navy text-white grid place-items-center" aria-label="Add contact"><Plus size={18} /></button>
        </form>
      )}
      <SourceNote>Contacts stay on this device and are never included in share links.</SourceNote>
    </div>
  );
}

function PreviewClock({ now }: { now: Date }) {
  const sim = useTrip((s) => s.sim);
  const setSim = useTrip((s) => s.setSim);
  const [day, setDay] = useState('2026-11-14');
  const [time, setTime] = useState('11:30');
  const presets: { label: string; day: string; time: string }[] = [
    { label: 'Fri 2:30 PM', day: '2026-11-13', time: '14:30' },
    { label: 'Sat 11:30 AM (Newbury)', day: '2026-11-14', time: '11:30' },
    { label: 'Sun 10:30 AM', day: '2026-11-15', time: '10:30' },
    { label: 'Sun 7:30 PM', day: '2026-11-15', time: '19:30' },
  ];
  return (
    <div>
      <div className="text-sm font-medium text-navy">Preview clock {sim && <Pill tone="blue">On</Pill>}</div>
      <p className="text-xs text-ink/60 mt-0.5">See what the app shows at a given moment of the trip. Clearly labelled while on; doesn’t change any data.</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {presets.map((p) => <Chip key={p.label} className="h-9 text-[13px]" onClick={() => setSim(zoned(p.day, p.time))}>{p.label}</Chip>)}
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2">
        <select className="input h-11" value={day} onChange={(e) => setDay(e.target.value)}>{DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
        <input className="input h-11" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <button onClick={() => setSim(zoned(day, time))} className="h-11 px-3 rounded-2xl bg-navy text-white text-sm font-semibold">Set</button>
      </div>
      {sim && <button onClick={() => setSim(null)} className="mt-2 h-10 px-4 rounded-full bg-sand text-navy text-sm font-medium">Use real time ({now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} preview)</button>}
    </div>
  );
}
