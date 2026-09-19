import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { GrowthTree } from "../components/GrowthTree";
import { PlusIcon } from "../components/icons";
import { AddHabitSheet, HabitRow, HabitStatsSheet } from "../components/HabitParts";
import { AddTodoSheet, TodoGroup } from "../components/TodoParts";
import { useHabitLogs, useHabits } from "../features/habits/hooks";
import { useTodos } from "../features/todos/hooks";
import type { Habit } from "../data/types";
import { isScheduledOn, toISODate, todayISO } from "../lib/dates";
import { growthStage, STAGE_LABEL, type GrowthStage } from "../lib/growth";
import { useStageUp } from "../lib/useStageUp";

export function TodayPage() {
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: logs = [] } = useHabitLogs();
  const { data: todos = [], isLoading: todosLoading } = useTodos();
  const navigate = useNavigate();
  const [adding, setAdding] = useState<"todo" | "habit" | null>(null);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);

  const today = todayISO();
  const growth = useMemo(() => growthStage(habits, logs, todos), [habits, logs, todos]);
  const liveStatsHabit = statsHabit ? (habits.find((h) => h.id === statsHabit.id) ?? statsHabit) : null;

  const view = useMemo(() => {
    const dueHabits = habits.filter((h) => !h.archived && isScheduledOn(h.frequency, today));
    const habitsDone = dueHabits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today));
    const open = todos.filter((t) => !t.done).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
    const doneToday = todos.filter((t) => t.done && t.completed_at && toISODate(new Date(t.completed_at)) === today);
    const dueTodos = open.filter((t) => !t.due_date || t.due_date <= today);
    return {
      dueHabits,
      overdue: open.filter((t) => t.due_date && t.due_date < today),
      todayTodos: open.filter((t) => !t.due_date || t.due_date === today),
      upcoming: open.filter((t) => t.due_date && t.due_date > today),
      doneToday,
      total: dueHabits.length + dueTodos.length + doneToday.length,
      done: habitsDone.length + doneToday.length,
    };
  }, [habits, logs, todos, today]);

  const pointsToday = growth.dayPoints.get(today) ?? 0;
  const loading = habitsLoading || todosLoading;
  const empty = !loading && habits.length === 0 && todos.length === 0;
  const { grewTo, dismiss } = useStageUp(growth.stage, !loading);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Today"
        action={
          <button
            type="button"
            aria-label="Add"
            onClick={() => setAdding("todo")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[480px] px-5 pb-8">
          {!loading && !empty && (
            <button
              type="button"
              onClick={() => navigate("/garden")}
              className="mt-2 flex w-full items-center gap-4 py-3 text-left"
            >
              <GrowthTree stage={growth.stage} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--ink)]">
                  <span className="font-[family-name:var(--font-display)]">{STAGE_LABEL[growth.stage]}</span>
                  <span className="text-[var(--ink-muted)]"> · {growth.topStreak}d streak</span>
                </p>
                {growth.daysToNext !== null && (
                  <p className="mt-0.5 truncate text-xs text-[var(--accent)]">
                    ~{growth.daysToNext} more day{growth.daysToNext === 1 ? "" : "s"} to{" "}
                    {STAGE_LABEL[(growth.stage + 1) as GrowthStage]}
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-[var(--ink-muted)]">
                  {view.done}/{view.total} done today
                  {pointsToday > 0 && <span className="text-[var(--accent)]"> · +{pointsToday} growth</span>}
                </p>
              </div>
            </button>
          )}

          {grewTo && (
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 flex w-full items-center justify-between rounded-lg bg-[var(--accent)]/10 px-4 py-3 text-left text-sm text-[var(--ink)]"
            >
              <span>
                Your tree grew into a{" "}
                <span className="font-[family-name:var(--font-display)] text-[var(--accent)]">
                  {STAGE_LABEL[grewTo]}
                </span>
                .
              </span>
              <span className="text-xs text-[var(--ink-muted)]">Dismiss</span>
            </button>
          )}

          {empty && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">Plant your first seed</p>
              <p className="max-w-[30ch] text-sm text-[var(--ink-muted)]">
                Add a todo or a habit. Finishing either one makes your tree grow.
              </p>
              <button
                type="button"
                onClick={() => setAdding("todo")}
                className="mt-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
              >
                Add something
              </button>
            </div>
          )}

          <TodoGroup label="Overdue" items={view.overdue} danger />

          {view.dueHabits.length > 0 && (
            <section className="mt-6 first:mt-4">
              <h2 className="mb-1 text-xs text-[var(--ink-muted)]">Habits</h2>
              <ul className="flex flex-col">
                {view.dueHabits.map((habit) => (
                  <HabitRow key={habit.id} habit={habit} logs={logs} onOpenStats={setStatsHabit} />
                ))}
              </ul>
            </section>
          )}

          <TodoGroup label="Todos" items={view.todayTodos} />
          <TodoGroup label="Upcoming" items={view.upcoming} />
          <TodoGroup label="Done today" items={view.doneToday} muted />
        </div>
      </div>

      {adding === "todo" && <AddTodoSheet onDone={() => setAdding(null)} onSwitch={() => setAdding("habit")} />}
      {adding === "habit" && <AddHabitSheet onDone={() => setAdding(null)} onSwitch={() => setAdding("todo")} />}
      {liveStatsHabit && (
        <HabitStatsSheet habit={liveStatsHabit} logs={logs} onClose={() => setStatsHabit(null)} />
      )}
    </div>
  );
}
