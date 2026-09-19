import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { GrowthTree } from "../components/GrowthTree";
import { GearIcon } from "../components/icons";
import {
  ArchivedHabitRow,
  HabitStatsSheet,
  HabitTreeCard,
  ReminderSettingsSheet,
} from "../components/HabitParts";
import { useHabitLogs, useHabits } from "../features/habits/hooks";
import { useTodos } from "../features/todos/hooks";
import type { Habit } from "../data/types";
import { addDays, formatDueDate, toISODate, todayISO } from "../lib/dates";
import { growthStage, STAGE_LABEL, type GrowthStage } from "../lib/growth";

const HEAT_DAYS = 30;

export function GardenPage() {
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs();
  const { data: todos = [] } = useTodos();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const growth = useMemo(() => growthStage(habits, logs, todos), [habits, logs, todos]);
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archived = useMemo(() => habits.filter((h) => h.archived), [habits]);
  const liveStatsHabit = statsHabit ? (habits.find((h) => h.id === statsHabit.id) ?? statsHabit) : null;

  const heat = useMemo(() => {
    const today = todayISO();
    return Array.from({ length: HEAT_DAYS }, (_, i) => {
      const date = addDays(today, -(HEAT_DAYS - 1 - i));
      return { date, points: growth.dayPoints.get(date) ?? 0 };
    });
  }, [growth.dayPoints]);

  const completed = useMemo(
    () =>
      todos
        .filter((t) => t.done)
        .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))
        .slice(0, 20),
    [todos],
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Garden"
        action={
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <GearIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[480px] px-5 pb-8">
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <GrowthTree stage={growth.stage} scale={1.6} />
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {STAGE_LABEL[growth.stage]}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Habits and todos both feed this tree.
              {growth.daysToNext !== null &&
                ` About ${growth.daysToNext} more day${growth.daysToNext === 1 ? "" : "s"} to ${STAGE_LABEL[(growth.stage + 1) as GrowthStage]}.`}
            </p>
          </div>

          <section>
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              Last {HEAT_DAYS} days
            </h2>
            <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
              {heat.map((d) => (
                <span
                  key={d.date}
                  title={`${d.date}: ${d.points} growth`}
                  style={{ opacity: d.points === 0 ? 1 : Math.min(1, 0.35 + d.points / 6) }}
                  className={`aspect-square rounded-sm ${d.points === 0 ? "bg-[var(--line)]" : "bg-[var(--accent)]"}`}
                />
              ))}
            </div>
          </section>

          {active.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                Orchard
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {active.map((habit, i) => (
                  <HabitTreeCard
                    key={habit.id}
                    habit={habit}
                    logs={logs}
                    onOpen={() => setStatsHabit(habit)}
                    mounted={mounted}
                    delayMs={i * 30}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                Recently completed
              </h2>
              <ul className="flex flex-col divide-y divide-[var(--line)]">
                {completed.map((t) => (
                  <li key={t.id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink-muted)]">{t.text}</span>
                    {t.completed_at && (
                      <span className="shrink-0 text-xs text-[var(--ink-muted)]">
                        {formatDueDate(toISODate(new Date(t.completed_at)))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {archived.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                Archived
              </h2>
              <ul className="flex flex-col divide-y divide-[var(--line)]">
                {archived.map((habit) => (
                  <ArchivedHabitRow key={habit.id} habit={habit} onOpenStats={setStatsHabit} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {settingsOpen && <ReminderSettingsSheet onClose={() => setSettingsOpen(false)} />}
      {liveStatsHabit && (
        <HabitStatsSheet habit={liveStatsHabit} logs={logs} onClose={() => setStatsHabit(null)} />
      )}
    </div>
  );
}
