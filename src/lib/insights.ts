import type { Habit, HabitLog } from "../data/types";
import { addDays, isScheduledOn, toISODate, todayISO, weekdayOf } from "./dates";

const DAYS = 56;
const MIN_SAMPLES = 3; // scheduled habit-days per weekday before we trust a rate
const MIN_GAP = 0.2;
const NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

/** One-line pattern over the last 8 weeks: which weekday you complete the
 * most/least habits on. Null until there's enough history for it to be true. */
export function weekdayInsight(habits: Habit[], logs: HabitLog[], today = todayISO()): string | null {
  const active = habits.filter((h) => !h.archived);
  const done = new Set(logs.map((l) => `${l.habit_id}|${l.log_date}`));
  const scheduled = Array<number>(7).fill(0);
  const completed = Array<number>(7).fill(0);

  for (let i = 1; i <= DAYS; i++) {
    const d = addDays(today, -i);
    const w = weekdayOf(d);
    for (const h of active) {
      if (toISODate(new Date(h.created_at)) >= d || !isScheduledOn(h.frequency, d)) continue;
      scheduled[w] += 1;
      if (done.has(`${h.id}|${d}`)) completed[w] += 1;
    }
  }

  const rates = scheduled
    .map((n, w) => ({ w, n, rate: n ? completed[w] / n : 0 }))
    .filter((r) => r.n >= MIN_SAMPLES);
  if (rates.length < 2) return null;
  rates.sort((a, b) => b.rate - a.rate);
  const best = rates[0];
  const worst = rates[rates.length - 1];
  if (best.rate - worst.rate < MIN_GAP) return null;

  const pct = (r: number) => `${Math.round(r * 100)}%`;
  return `Strongest on ${NAMES[best.w]} (${pct(best.rate)}). ${NAMES[worst.w]} are your weak spot (${pct(worst.rate)}).`;
}
