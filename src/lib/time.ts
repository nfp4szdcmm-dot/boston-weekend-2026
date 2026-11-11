export const TZ = 'America/New_York';

function parts(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  });
  const out: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) out[p.type] = p.value;
  return out;
}

export function tzOffsetMinutes(date: Date, tz: string): number {
  const p = parts(date, tz);
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Convert a wall-clock day + time in `tz` to an absolute Date. */
export function zoned(day: string, time: string, tz = TZ): Date {
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off = tzOffsetMinutes(new Date(guess), tz);
  let t = guess - off * 60000;
  const off2 = tzOffsetMinutes(new Date(t), tz);
  if (off2 !== off) t = guess - off2 * 60000;
  return new Date(t);
}

/** YYYY-MM-DD for a Date in tz. */
export function dayKey(d: Date, tz = TZ): string {
  const p = parts(d, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

export function hhmm(d: Date, tz = TZ): string {
  const p = parts(d, tz);
  return `${String(+p.hour % 24).padStart(2, '0')}:${p.minute}`;
}

/** A Date whose *local* fields equal the Boston wall-clock (for libraries that use local time). */
export function bostonWallClockAsLocal(d: Date): Date {
  const p = parts(d, TZ);
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
}

export function fmtClock(d: Date, tz = TZ): string {
  return d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
}

export function fmtDayLong(d: Date, tz = TZ): string {
  return d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'short', day: 'numeric' });
}

export function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(mins: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function addMin(time: string, mins: number): string {
  return fromMin(toMin(time) + mins);
}

export function humanDuration(ms: number): string {
  const neg = ms < 0;
  let mins = Math.round(Math.abs(ms) / 60000);
  const days = Math.floor(mins / 1440);
  mins -= days * 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  let s: string;
  if (days > 0) s = `${days}d ${h}h`;
  else if (h > 0) s = `${h}h ${m}m`;
  else s = `${m} min`;
  return neg ? `-${s}` : s;
}

export function tzAbbr(tz: string, at: Date): string {
  const s = at.toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' });
  return s.split(' ').pop() ?? '';
}
