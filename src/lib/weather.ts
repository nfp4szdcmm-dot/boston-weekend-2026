import { lsGet, lsSet } from './cache';

export interface Weather {
  fetchedAt: string;
  current: { temp: number; feels: number; code: number; wind: number; precip: number };
  daily: { date: string; code: number; hi: number; lo: number; pop: number }[];
  hourly: { time: string; temp: number; pop: number; code: number }[];
}

const KEY = 'bw26-weather';

export async function fetchWeather(lat = 42.3601, lng = -71.0589): Promise<{ data: Weather; live: boolean }> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m' +
    '&hourly=temperature_2m,precipitation_probability,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York&forecast_days=16';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Weather ${r.status}`);
    const j = await r.json();
    const data: Weather = {
      fetchedAt: new Date().toISOString(),
      current: {
        temp: j.current.temperature_2m, feels: j.current.apparent_temperature, code: j.current.weather_code,
        wind: j.current.wind_speed_10m, precip: j.current.precipitation,
      },
      daily: j.daily.time.map((t: string, i: number) => ({
        date: t, code: j.daily.weather_code[i], hi: j.daily.temperature_2m_max[i], lo: j.daily.temperature_2m_min[i],
        pop: j.daily.precipitation_probability_max[i] ?? 0,
      })),
      hourly: j.hourly.time.map((t: string, i: number) => ({
        time: t, temp: j.hourly.temperature_2m[i], pop: j.hourly.precipitation_probability[i] ?? 0, code: j.hourly.weather_code[i],
      })),
    };
    lsSet(KEY, data);
    return { data, live: true };
  } catch (e) {
    const cached = lsGet<Weather>(KEY);
    if (cached) return { data: cached, live: false };
    throw e;
  }
}

export function weatherLabel(code: number): { label: string; emoji: string; wet: boolean } {
  if (code === 0) return { label: 'Clear', emoji: '☀️', wet: false };
  if (code <= 2) return { label: 'Partly cloudy', emoji: '⛅', wet: false };
  if (code === 3) return { label: 'Overcast', emoji: '☁️', wet: false };
  if (code <= 48) return { label: 'Fog', emoji: '🌫️', wet: false };
  if (code <= 57) return { label: 'Drizzle', emoji: '🌦️', wet: true };
  if (code <= 67) return { label: 'Rain', emoji: '🌧️', wet: true };
  if (code <= 77) return { label: 'Snow', emoji: '🌨️', wet: true };
  if (code <= 82) return { label: 'Showers', emoji: '🌦️', wet: true };
  if (code <= 86) return { label: 'Snow showers', emoji: '🌨️', wet: true };
  return { label: 'Thunderstorms', emoji: '⛈️', wet: true };
}
