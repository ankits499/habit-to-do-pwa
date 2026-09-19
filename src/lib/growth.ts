import type { Habit, HabitLog } from "../data/types";
import { currentStreak, growthMomentum } from "./streak";

export type GrowthStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const THRESHOLDS = [1, 2, 4, 7, 11, 16, 22, 30, 45] as const;

export function stageForStreak(streak: number): GrowthStage {
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (streak < THRESHOLDS[i]) return (i + 1) as GrowthStage;
  }
  return 10;
}

/** Each habit's momentum counts fully for the strongest habit, then 40% for
 * the next, 16% for the next, and so on. Adding a habit can therefore only
 * ever grow the tree (a new habit contributes >= 0), while still rewarding
 * breadth — unlike an average, where a fresh habit at 0 drags a 30-day
 * habit's tree down. */
const HABIT_WEIGHT_DECAY = 0.4;

export function growthStage(
  habits: Habit[],
  logs: HabitLog[],
): { stage: GrowthStage; topStreak: number; daysToNext: number | null } {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return { stage: 1, topStreak: 0, daysToNext: null };

  const topStreak = active.reduce((max, h) => Math.max(max, currentStreak(h, logs)), 0);
  const momentums = active.map((h) => growthMomentum(h, logs)).sort((a, b) => b - a);
  const score = momentums.reduce((sum, m, i) => sum + m * HABIT_WEIGHT_DECAY ** i, 0);

  const stage = stageForStreak(score);
  // Logging the strongest habit once adds a full point, so this is a
  // "days of showing up" estimate for the next stage.
  const daysToNext = stage === 10 ? null : Math.ceil(THRESHOLDS[stage - 1] - score);
  return { stage, topStreak, daysToNext };
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
