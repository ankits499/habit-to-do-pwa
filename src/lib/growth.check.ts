// Run: npx tsx src/lib/growth.check.ts
import assert from "node:assert/strict";
import type { Habit, HabitLog, Todo } from "../data/types";
import { addDays, todayISO } from "./dates";
import { growthStage } from "./growth";

const today = todayISO();
const day = (n: number) => addDays(today, -n);
const habit = (id: string, back = 60): Habit => ({
  id,
  name: id,
  frequency: "daily",
  archived: false,
  created_at: `${day(back)}T08:00:00`,
});
const logsFor = (id: string, from: number, to = 0): HabitLog[] => {
  const out: HabitLog[] = [];
  for (let i = from; i >= to; i--) out.push({ habit_id: id, log_date: day(i) });
  return out;
};
const todo = (n: number): Todo => ({
  id: `t${n}`, text: "x", due_date: null, done: true,
  created_at: `${day(n)}T08:00:00`, completed_at: `${day(n)}T12:00:00`,
});

const a = habit("a");
const logs = logsFor("a", 20);
const base = growthStage([a], logs, []);
// adding a zero-history habit never changes the tree
const withNew = growthStage([a, habit("b", 0)], logs, []);
assert.equal(withNew.stage, base.stage);
assert.equal(withNew.momentum, base.momentum);
// (a long-ignored habit only forfeits the all-done bonus; base points are never removed)
// todos add growth
assert.ok(growthStage([a], logs, [todo(1), todo(2)]).momentum > base.momentum);
// a todo-only day keeps a habit-less gap from decaying
const gap = logsFor("a", 20, 4); // nothing in last 3 days
const missed = growthStage([a], gap, []).momentum;
const covered = growthStage([a], gap, [todo(3), todo(2), todo(1)]).momentum;
assert.ok(covered > missed);
// one miss is free, then decay
const oneMiss = growthStage([a], logsFor("a", 20, 2), []).momentum; // day1 + today unlogged
const twoMiss = growthStage([a], logsFor("a", 20, 3), []).momentum; // days 2,1 missed
assert.equal(oneMiss, growthStage([a], logsFor("a", 20, 2), []).momentum);
assert.ok(twoMiss <= oneMiss);
// stage is monotone in logged days
let prev = 0;
for (const n of [1, 5, 10, 20, 40]) {
  const s = growthStage([habit("a", 80)], logsFor("a", n - 1), []).stage;
  assert.ok(s >= prev);
  prev = s;
}
// empty
assert.equal(growthStage([], [], []).stage, 1);
console.log("growth checks passed", { base: base.stage, momentum: base.momentum });
