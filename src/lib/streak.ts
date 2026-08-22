import type { Habit, HabitLog } from "../data/types";
import { addDays, isScheduledOn, todayISO } from "./dates";

export type DayCell = { date: string; scheduled: boolean; done: boolean };

/** Last `days` days (oldest first, ending today) as dot-strip cells. */
export function buildStrip(habit: Habit, logs: HabitLog[], days: number): DayCell[] {
  const doneDates = new Set(logs.filter((l) => l.habit_id === habit.id).map((l) => l.log_date));
  const today = todayISO();
  const cells: DayCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    cells.push({
      date,
      scheduled: isScheduledOn(habit.frequency, date),
      done: doneDates.has(date),
    });
  }
  return cells;
}

/** Current streak: consecutive scheduled days up to today (or yesterday if
 * today isn't logged yet) that were completed. */
export function currentStreak(habit: Habit, logs: HabitLog[]): number {
  const doneDates = new Set(logs.filter((l) => l.habit_id === habit.id).map((l) => l.log_date));
  const today = todayISO();

  let cursor = today;
  // If today is scheduled but not yet done, streak counts from yesterday
  // so an in-progress day doesn't zero it out.
  if (isScheduledOn(habit.frequency, today) && !doneDates.has(today)) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  // Safety cap so an ancient habit with sparse logs doesn't loop forever.
  for (let i = 0; i < 3650; i++) {
    if (!isScheduledOn(habit.frequency, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!doneDates.has(cursor)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Growth momentum for the tree's stage: like a streak, but forgiving.
 * A missed scheduled day right after a completion is a free grace day (no
 * penalty); only a second consecutive miss starts decaying momentum (×0.6)
 * instead of resetting it to 0. Use `currentStreak` for literal streak
 * stats/labels — this is only for picking the tree's stage. */
export function growthMomentum(habit: Habit, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  if (habitLogs.length === 0) return 0;
  const doneDates = new Set(habitLogs.map((l) => l.log_date));
  const earliest = habitLogs.reduce((min, l) => (l.log_date < min ? l.log_date : min), habitLogs[0].log_date);
  const today = todayISO();

  let momentum = 0;
  let graceAvailable = true;
  let cursor = earliest;
  while (cursor <= today) {
    if (isScheduledOn(habit.frequency, cursor)) {
      if (cursor === today && !doneDates.has(cursor)) break;
      if (doneDates.has(cursor)) {
        momentum += 1;
        graceAvailable = true;
      } else if (graceAvailable) {
        graceAvailable = false;
      } else {
        momentum = Math.floor(momentum * 0.6);
      }
    }
    cursor = addDays(cursor, 1);
  }
  return momentum;
}

/** Longest-ever run of consecutive scheduled days completed. */
export function bestStreak(habit: Habit, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  if (habitLogs.length === 0) return 0;
  const doneDates = new Set(habitLogs.map((l) => l.log_date));
  const earliest = habitLogs.reduce((min, l) => (l.log_date < min ? l.log_date : min), habitLogs[0].log_date);
  const today = todayISO();

  let best = 0;
  let running = 0;
  let cursor = earliest;
  while (cursor <= today) {
    if (isScheduledOn(habit.frequency, cursor)) {
      if (doneDates.has(cursor)) {
        running += 1;
        best = Math.max(best, running);
      } else {
        running = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Fraction of scheduled days completed in the last `days` days (0 when none scheduled). */
export function completionRate(habit: Habit, logs: HabitLog[], days: number): number {
  const cells = buildStrip(habit, logs, days);
  const scheduled = cells.filter((c) => c.scheduled);
  if (scheduled.length === 0) return 0;
  return scheduled.filter((c) => c.done).length / scheduled.length;
}
