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
