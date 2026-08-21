import type { Weekday } from "../data/types";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

export function weekdayOf(iso: string): Weekday {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() as Weekday;
}

export function isScheduledOn(frequency: "daily" | Weekday[], iso: string): boolean {
  if (frequency === "daily") return true;
  return frequency.includes(weekdayOf(iso));
}

export function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function weekdayLabel(w: Weekday): string {
  return WEEKDAY_LABELS[w];
}
