// Run: npx tsx src/lib/insights.check.ts
import assert from "node:assert/strict";
import type { Habit, HabitLog } from "../data/types";
import { addDays, todayISO, weekdayOf } from "./dates";
import { weekdayInsight } from "./insights";

const today = todayISO();
const h: Habit = { id: "a", name: "a", frequency: "daily", archived: false, created_at: `${addDays(today, -60)}T08:00:00` };

// no history -> nothing to say
assert.equal(weekdayInsight([h], []), null);

// done every day except Thursdays -> Thursday is the weak spot
const logs: HabitLog[] = [];
for (let i = 1; i <= 56; i++) {
  const d = addDays(today, -i);
  if (weekdayOf(d) !== 4) logs.push({ habit_id: "a", log_date: d });
}
const msg = weekdayInsight([h], logs);
assert.ok(msg?.includes("Thursdays are your weak spot (0%)"), msg ?? "null");

// perfectly even -> no insight
const even: HabitLog[] = [];
for (let i = 1; i <= 56; i++) even.push({ habit_id: "a", log_date: addDays(today, -i) });
assert.equal(weekdayInsight([h], even), null);

// brand-new habit -> too little data
assert.equal(weekdayInsight([{ ...h, created_at: `${today}T08:00:00` }], []), null);
console.log("insight checks passed:", msg);
