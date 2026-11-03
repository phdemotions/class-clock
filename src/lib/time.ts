/** Time maths for the session window. Pure functions, so they are easy to test. */

export type Phase = "before" | "running" | "warn30" | "warn10" | "warn5" | "ended";

export interface SessionWindow {
  start: Date;
  end: Date;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Parses "HH:MM" (24-hour). Returns null for anything else. */
export function parseHM(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function atTime(day: Date, hm: string): Date {
  const parsed = parseHM(hm) ?? { hours: 0, minutes: 0 };
  const d = new Date(day);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

/**
 * The session window for today. An end time at or before the start time means the
 * session runs past midnight. Just after midnight, yesterday's window is used.
 */
export function sessionWindow(startHM: string, endHM: string, now: Date): SessionWindow {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = atTime(today, startHM);
  let end = atTime(today, endHM);
  if (end <= start) end = new Date(end.getTime() + DAY);

  const crossesMidnight = end.getDate() !== start.getDate();
  if (crossesMidnight && now < start) {
    const yesterdayEnd = new Date(end.getTime() - DAY);
    if (now < yesterdayEnd) return { start: new Date(start.getTime() - DAY), end: yesterdayEnd };
  }
  return { start, end };
}

export function sessionPhase(win: SessionWindow, now: Date): Phase {
  if (now < win.start) return "before";
  const left = win.end.getTime() - now.getTime();
  if (left <= 0) return "ended";
  if (left <= 5 * MINUTE) return "warn5";
  if (left <= 10 * MINUTE) return "warn10";
  if (left <= 30 * MINUTE) return "warn30";
  return "running";
}

/** Share of the session that has passed, from 0 to 1. */
export function progress(win: SessionWindow, now: Date): number {
  const total = win.end.getTime() - win.start.getTime();
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (now.getTime() - win.start.getTime()) / total));
}

/** "1:05:09" when an hour or more is left, otherwise "5:09". Rounds up so 0:00 means time is up. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export interface ClockParts {
  time: string;
  period: "AM" | "PM" | "";
}

export function formatClock(d: Date, use24h: boolean, withSeconds: boolean): ClockParts {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tail = `:${pad(d.getMinutes())}${withSeconds ? `:${pad(d.getSeconds())}` : ""}`;
  if (use24h) return { time: pad(d.getHours()) + tail, period: "" };
  const h = d.getHours() % 12 || 12;
  return { time: h + tail, period: d.getHours() >= 12 ? "PM" : "AM" };
}

export function formatClockText(d: Date, use24h: boolean): string {
  const { time, period } = formatClock(d, use24h, false);
  return period ? `${time} ${period}` : time;
}

/** Adds minutes to an "HH:MM" value and wraps past midnight. */
export function addMinutes(hm: string, minutes: number): string {
  const parsed = parseHM(hm);
  if (!parsed) return hm;
  const total = (((parsed.hours * 60 + parsed.minutes + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function toHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Length in minutes, allowing for sessions that run past midnight. */
export function durationMinutes(startHM: string, endHM: string): number {
  const a = parseHM(startHM);
  const b = parseHM(endHM);
  if (!a || !b) return 0;
  const diff = b.hours * 60 + b.minutes - (a.hours * 60 + a.minutes);
  return diff > 0 ? diff : diff + 1440;
}
