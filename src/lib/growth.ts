import type { Habit, HabitLog, Todo } from "../data/types";
import { addDays, isScheduledOn, toISODate, todayISO } from "./dates";
import { currentStreak } from "./streak";

export type GrowthStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const THRESHOLDS = [1, 2, 4, 7, 11, 16, 22, 30, 45] as const;

/** Momentum points a solid day earns; stage thresholds are in "days". */
const POINTS_PER_DAY = 2;
const MAX_HABIT_POINTS = 4;
const MAX_TODO_POINTS = 3;
const TODO_POINT = 0.5;
const ALL_DONE_BONUS = 1;
const DECAY = 0.75;

export function stageForStreak(streak: number): GrowthStage {
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (streak < THRESHOLDS[i]) return (i + 1) as GrowthStage;
  }
  return 10;
}

export type TreeGrowth = {
  stage: GrowthStage;
  momentum: number;
  topStreak: number;
  daysToNext: number | null;
  /** Points earned per date (only dates with activity). */
  dayPoints: Map<string, number>;
};

/** Unified tree growth from habits AND todos.
 *
 * Each day earns points: 1 per habit done (max 4), 0.5 per todo completed
 * (max 3), +1 when every scheduled habit was done. Points add to momentum.
 * A day is a "miss" only if habits were scheduled and NOTHING (habit or todo)
 * was completed — the first miss after activity is free, later ones decay
 * momentum by 25%. So adding a habit or todo can never lower the tree, todos
 * never cause decay, and a habit only counts as scheduled from the day AFTER
 * it was created (so adding one today can't change today's bonus or misses). */
export function growthStage(habits: Habit[], logs: HabitLog[], todos: Todo[]): TreeGrowth {
  const active = habits.filter((h) => !h.archived);
  const topStreak = active.reduce((max, h) => Math.max(max, currentStreak(h, logs)), 0);

  const today = todayISO();
  const habitsDoneOn = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!habitsDoneOn.has(l.log_date)) habitsDoneOn.set(l.log_date, new Set());
    habitsDoneOn.get(l.log_date)!.add(l.habit_id);
  }
  const todosDoneOn = new Map<string, number>();
  for (const t of todos) {
    if (!t.done || !t.completed_at) continue;
    const d = toISODate(new Date(t.completed_at));
    todosDoneOn.set(d, (todosDoneOn.get(d) ?? 0) + 1);
  }

  const dates = [...habitsDoneOn.keys(), ...todosDoneOn.keys()].sort();
  const dayPoints = new Map<string, number>();
  if (dates.length === 0) return { stage: 1, momentum: 0, topStreak, daysToNext: null, dayPoints };

  const createdOn = new Map(active.map((h) => [h.id, toISODate(new Date(h.created_at))]));

  let momentum = 0;
  let grace = true;
  for (let d = dates[0]; d <= today; d = addDays(d, 1)) {
    const scheduled = active.filter((h) => (createdOn.get(h.id) as string) < d && isScheduledOn(h.frequency, d));
    const doneSet = habitsDoneOn.get(d);
    const habitsDone = doneSet?.size ?? 0;
    const allDone = scheduled.length > 0 && scheduled.every((h) => doneSet?.has(h.id));
    const points =
      Math.min(habitsDone, MAX_HABIT_POINTS) +
      Math.min(todosDoneOn.get(d) ?? 0, MAX_TODO_POINTS) * TODO_POINT +
      (allDone ? ALL_DONE_BONUS : 0);

    if (points > 0) {
      dayPoints.set(d, points);
      momentum += points;
      grace = true;
    } else if (d < today && scheduled.length > 0) {
      if (grace) grace = false;
      else momentum = Math.floor(momentum * DECAY);
    }
  }

  const stage = stageForStreak(momentum / POINTS_PER_DAY);
  let daysToNext: number | null = null;
  if (stage < 10) {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const p = dayPoints.get(addDays(today, -i));
      if (p) {
        sum += p;
        n += 1;
      }
    }
    const perDay = n > 0 ? sum / n : POINTS_PER_DAY;
    daysToNext = Math.max(1, Math.ceil((THRESHOLDS[stage - 1] * POINTS_PER_DAY - momentum) / perDay));
  }
  return { stage, momentum, topStreak, daysToNext, dayPoints };
}

export const STAGE_LABEL: Record<GrowthStage, string> = {
  1: "seed",
  2: "sprout",
  3: "seedling",
  4: "little pine",
  5: "young pine",
  6: "pine",
  7: "maturing pine",
  8: "full grown pine",
  9: "winter pine",
  10: "legendary pine",
};
