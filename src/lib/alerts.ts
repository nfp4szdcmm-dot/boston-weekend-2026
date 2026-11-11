import type { Rental } from '../types';
import type { Weather } from './weather';
import { weatherLabel } from './weather';
import { zoned, fmtClock, humanDuration, dayKey } from './time';
import type { DriveEstimate } from './routing';

export interface Alert {
  id: string;
  level: 'info' | 'warn' | 'urgent';
  title: string;
  body: string;
  action?: 'essentials' | 'sunday' | 'indoor' | 'monday';
}

/** Latest sensible time to leave Somerville to be inside SNHU Arena by 2:00 PM. */
export function sundayLeaveBy(drive: DriveEstimate | null): { leaveBy: Date; driveMin: number; buffered: number; source: string } {
  const base = drive?.minutes ?? 60;
  // Typical drive + 30% for Sunday traffic/weather + 30 min to park, walk & clear bag check.
  const buffered = Math.round(base * 1.3) + 30;
  const leaveBy = new Date(zoned('2026-11-15', '14:00').getTime() - buffered * 60000);
  return {
    leaveBy,
    driveMin: base,
    buffered,
    source: drive?.source === 'osrm' ? 'OSRM road-network estimate (no live traffic)' : 'rough distance-based estimate',
  };
}

export function buildAlerts(now: Date, rental: Rental, wx: Weather | null, drive: DriveEstimate | null): Alert[] {
  const out: Alert[] = [];
  const t = now.getTime();
  const tripStart = zoned('2026-11-13', '06:00', 'America/Chicago');
  const flightHome = zoned('2026-11-16', '07:00');

  // Check-in reminder in the 36 hours before the first flight (the Home card already shows the countdown).
  if (t < tripStart.getTime() && tripStart.getTime() - t < 36 * 3600000) {
    out.push({
      id: 'checkin', level: 'info', title: 'Check in for AA 5491',
      body: `Departs XNA Friday 6:00 AM Central (in ${humanDuration(tripStart.getTime() - t)}). Check in on the AA app 24 hours before.`,
    });
  }

  // Rental car
  if (rental.status !== 'confirmed' && t < zoned('2026-11-15', '11:15').getTime()) {
    out.push({
      id: 'rental', level: t > zoned('2026-11-14', '09:00').getTime() ? 'urgent' : 'warn',
      title: 'Rental car not confirmed',
      body: 'The closest Enterprise we found (Sullivan Sq) lists Saturday 9 AM–12 PM and no Sunday hours. Consider a Saturday-morning pickup or Logan’s Rental Car Center — and call to confirm.',
      action: 'essentials',
    });
  }
  const badReturn = rental.returnPlan === 'not_confirmed' || rental.returnPlan === 'neighborhood_monday';
  if (badReturn && t < flightHome.getTime()) {
    out.push({
      id: 'return', level: rental.returnPlan === 'neighborhood_monday' ? 'urgent' : 'warn',
      title: rental.returnPlan === 'neighborhood_monday' ? 'Rental return conflicts with your 7 AM flight' : 'Rental return plan not set',
      body: 'Neighborhood branches typically open around 8 AM on weekdays — after your flight leaves. Don’t assume a neighborhood rental can be dropped at Logan: confirm a one-way airport return or a Sunday-evening drop-off with Enterprise.',
      action: 'essentials',
    });
  }

  // Sunday departure
  const sunStart = zoned('2026-11-14', '18:00').getTime();
  const arenaDeadline = zoned('2026-11-15', '14:00').getTime();
  if (t > sunStart && t < arenaDeadline) {
    const lb = sundayLeaveBy(drive);
    const mins = (lb.leaveBy.getTime() - t) / 60000;
    const planned = zoned('2026-11-15', '11:15');
    out.push({
      id: 'sunday', level: mins < 45 ? 'urgent' : 'warn',
      title: mins > 0
        ? `Leave for Manchester by ${fmtClock(lb.leaveBy)} at the latest`
        : 'Past the safe departure time for Manchester',
      body: mins > 0
        ? `Plan says 11:15 AM (${fmtClock(planned)}). Everyone must be at SNHU Arena by 2:00 PM. ${humanDuration(lb.leaveBy.getTime() - t)} until the latest safe departure (≈${lb.driveMin} min drive + buffer, ${lb.source}).`
        : 'Leave now and use Google/Apple Maps for live traffic. Call ahead if you might be late.',
      action: 'sunday',
    });
  }

  // Snowport
  if (dayKey(now) === '2026-11-14' && t < zoned('2026-11-14', '21:00').getTime() && t > zoned('2026-11-14', '12:00').getTime()) {
    out.push({ id: 'snowport', level: 'info', title: 'Snowport is open until 9 PM tonight', body: 'Listed Saturday hours 10 AM–9 PM (Boston 25 / Boston.com). Free entry.' });
  }

  // Monday morning
  const monEve = zoned('2026-11-15', '19:00').getTime();
  if (t > monEve && t < flightHome.getTime()) {
    out.push({
      id: 'monday', level: 'warn', title: 'Early flight: aim to be at Logan by 5:00 AM',
      body: 'AA 397 departs 7:00 AM. Plan to leave the Airbnb around 4:20 AM. Pack tonight — see the departure checklist.',
      action: 'monday',
    });
  }

  // Weather
  if (wx) {
    const today = wx.daily.find((d) => d.date === dayKey(now));
    const wet = weatherLabel(wx.current.code).wet;
    if (wet || (today && today.pop >= 60)) {
      out.push({
        id: 'rain', level: 'info', title: wet ? 'It’s wet out — indoor ideas nearby' : `${today?.pop}% chance of rain today`,
        body: 'Bookstores, cafés, Boston Public Library and Boston Public Market are great dry stops.',
        action: 'indoor',
      });
    }
  }
  return out;
}
