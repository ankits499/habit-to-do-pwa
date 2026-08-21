import type { Habit, HabitLog } from "../data/types";
import { currentStreak } from "./streak";

export type GrowthStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const THRESHOLDS = [1, 2, 4, 7, 11, 16, 22, 30, 45] as const;

export function growthStage(habits: Habit[], logs: HabitLog[]): { stage: GrowthStage; avgStreak: number } {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return { stage: 1, avgStreak: 0 };

  const total = active.reduce((sum, h) => sum + currentStreak(h, logs), 0);
  const avgStreak = total / active.length;

  let stage: GrowthStage = 10;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (avgStreak < THRESHOLDS[i]) {
      stage = (i + 1) as GrowthStage;
      break;
    }
  }

  return { stage, avgStreak };
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
