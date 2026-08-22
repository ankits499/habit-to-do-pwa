import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { BottomSheet } from "../components/BottomSheet";
import { InlineComposer } from "../components/InlineComposer";
import { DotStrip } from "../components/DotStrip";
import { HabitCalendar } from "../components/HabitCalendar";
import { GrowthTree } from "../components/GrowthTree";
import { CheckIcon, GearIcon, PlusIcon, TrashIcon, XIcon } from "../components/icons";
import {
  useAddHabit,
  useDeleteHabit,
  useEditHabit,
  useHabitLogs,
  useHabits,
  useSetHabitArchived,
  useToggleHabitToday,
} from "../features/habits/hooks";
import { useReminderSettings, useUpdateReminderSettings } from "../features/reminders/hooks";
import { useAuth } from "../auth/AuthProvider";
import type { Habit, HabitLog, Weekday } from "../data/types";
import { isScheduledOn, todayISO, weekdayLabel } from "../lib/dates";
import { bestStreak, buildStrip, completionRate, currentStreak } from "../lib/streak";
import { growthStage, stageForStreak, STAGE_LABEL } from "../lib/growth";

const STATS_DAYS = 30;

const STRIP_DAYS = 7;
const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits();
  const { data: logs = [] } = useHabitLogs();
  const [composing, setComposing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function openComposer() {
    setComposing(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archived = useMemo(() => habits.filter((h) => h.archived), [habits]);
  const { stage, avgStreak } = useMemo(() => growthStage(habits, logs), [habits, logs]);

  const overview = useMemo(() => {
    const today = todayISO();
    const scheduledToday = active.filter((h) => isScheduledOn(h.frequency, today));
    const doneToday = scheduledToday.filter((h) =>
      logs.some((l) => l.habit_id === h.id && l.log_date === today),
    );
    const bestCurrent = active.reduce((max, h) => Math.max(max, currentStreak(h, logs)), 0);
    return { scheduledToday: scheduledToday.length, doneToday: doneToday.length, bestCurrent };
  }, [active, logs]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Habits"
        action={
          <>
            <button
              type="button"
              aria-label="Reminder settings"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              <GearIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Add habit"
              onClick={openComposer}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[480px] px-5 pb-8">
          {!isLoading && habits.length > 0 && (
            <button
              type="button"
              onClick={() => setOverviewOpen(true)}
              className="mt-4 flex w-full items-center gap-4 rounded-lg border border-[var(--line)] px-4 py-3.5 text-left transition-colors hover:border-[var(--ink-muted)]"
            >
              <GrowthTree stage={stage} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--ink)]">
                  <span className="font-[family-name:var(--font-display)]">{STAGE_LABEL[stage]}</span>
                  <span className="text-[var(--ink-muted)]"> · {Math.round(avgStreak)}d avg</span>
                </p>
                {active.length > 0 && (
                  <p className="mt-1 truncate text-xs text-[var(--ink-muted)]">
                    {overview.doneToday}/{overview.scheduledToday} today · {overview.bestCurrent}d best ·{" "}
                    {active.length} active
                  </p>
                )}
              </div>
            </button>
          )}

          {composing && <ComposeHabit onDone={() => setComposing(false)} />}

          {!isLoading && habits.length === 0 && !composing && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                No habits yet
              </p>
              <p className="max-w-[30ch] text-sm text-[var(--ink-muted)]">
                Define one to start building a streak.
              </p>
              <button
                type="button"
                onClick={openComposer}
                className="mt-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
              >
                Add a habit
              </button>
            </div>
          )}

          {active.length > 0 && (
            <ul className="mt-4 flex flex-col divide-y divide-[var(--line)]">
              {active.map((habit) => (
                <HabitRow key={habit.id} habit={habit} logs={logs} onOpenStats={() => setStatsHabit(habit)} />
              ))}
            </ul>
          )}

          {archived.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                Archived
              </h2>
              <ul className="flex flex-col divide-y divide-[var(--line)]">
                {archived.map((habit) => (
                  <ArchivedHabitRow key={habit.id} habit={habit} onOpenStats={() => setStatsHabit(habit)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {settingsOpen && <ReminderSettingsSheet onClose={() => setSettingsOpen(false)} />}

      {statsHabit && (
        <HabitStatsSheet habit={statsHabit} logs={logs} onClose={() => setStatsHabit(null)} />
      )}

      {overviewOpen && (
        <AllHabitsSheet
          habits={active}
          logs={logs}
          avgStreak={avgStreak}
          onClose={() => setOverviewOpen(false)}
          onOpenHabit={(habit) => {
            setOverviewOpen(false);
            setStatsHabit(habit);
          }}
        />
      )}
    </div>
  );
}

function HabitRow({
  habit,
  logs,
  onOpenStats,
}: {
  habit: Habit;
  logs: { habit_id: string; log_date: string }[];
  onOpenStats: () => void;
}) {
  const toggle = useToggleHabitToday();
  const today = todayISO();
  const scheduledToday = isScheduledOn(habit.frequency, today);
  const doneToday = logs.some((l) => l.habit_id === habit.id && l.log_date === today);
  const strip = buildStrip(habit, logs, STRIP_DAYS);
  const streak = currentStreak(habit, logs);

  return (
    <li className="group flex items-center gap-3 py-3.5">
      <button
        type="button"
        disabled={!scheduledToday}
        aria-label={doneToday ? "Mark not done for today" : "Mark done for today"}
        onClick={() => toggle.mutate({ habitId: habit.id, done: !doneToday })}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
          doneToday
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] scale-100"
            : scheduledToday
              ? "border-[var(--line)] text-transparent hover:border-[var(--accent)]"
              : "border-[var(--line)] text-transparent opacity-40"
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>

      <button type="button" onClick={onOpenStats} className="min-w-0 flex-1 text-left">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[15px] text-[var(--ink)]">{habit.name}</p>
          {streak > 0 && (
            <span className="shrink-0 font-[family-name:var(--font-display)] text-xs font-medium text-[var(--accent)]">
              {streak} day{streak === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <DotStrip cells={strip} showLabels />
        </div>
      </button>
    </li>
  );
}

function HabitStatsSheet({
  habit,
  logs,
  onClose,
}: {
  habit: Habit;
  logs: HabitLog[];
  onClose: () => void;
}) {
  const streak = currentStreak(habit, logs);
  const best = bestStreak(habit, logs);
  const rate = completionRate(habit, logs, STATS_DAYS);
  const total = logs.filter((l) => l.habit_id === habit.id).length;

  const edit = useEditHabit();
  const setArchived = useSetHabitArchived();
  const remove = useDeleteHabit();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(habit.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function saveName() {
    const trimmed = name.trim();
    setRenaming(false);
    if (!trimmed || trimmed === habit.name) {
      setName(habit.name);
      return;
    }
    edit.mutate({ id: habit.id, patch: { name: trimmed, frequency: habit.frequency } });
  }

  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <div className="flex flex-col gap-5">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              onBlur={saveName}
              className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 font-[family-name:var(--font-display)] text-lg text-[var(--ink)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
          ) : (
            <button type="button" onClick={() => setRenaming(true)} className="text-left">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
                {habit.name}
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">Tap to rename</p>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
            <StatTile label="Best streak" value={`${best} day${best === 1 ? "" : "s"}`} />
            <StatTile label={`Last ${STATS_DAYS} days`} value={`${Math.round(rate * 100)}%`} />
            <StatTile label="Total completions" value={String(total)} />
          </div>

          <HabitCalendar habit={habit} logs={logs} />

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--danger)] px-3 py-2.5">
              <p className="min-w-0 flex-1 text-sm text-[var(--ink)]">
                Delete "{habit.name}"? This can't be undone.
              </p>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="shrink-0 px-2 py-1 text-xs text-[var(--ink-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  remove.mutate(habit.id);
                  close();
                }}
                className="shrink-0 rounded-full bg-[var(--danger)] px-3 py-1.5 text-xs font-medium text-[var(--accent-ink)]"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="flex gap-2 border-t border-[var(--line)] pt-4">
              <button
                type="button"
                onClick={() => {
                  setArchived.mutate({ id: habit.id, archived: !habit.archived });
                  close();
                }}
                className="flex-1 rounded-full border border-[var(--line)] py-2 text-sm font-medium text-[var(--ink)]"
              >
                {habit.archived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--danger)] py-2 text-sm font-medium text-[var(--danger)]"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] px-3 py-2.5">
      <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">{value}</p>
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
    </div>
  );
}

function AllHabitsSheet({
  habits,
  logs,
  avgStreak,
  onClose,
  onOpenHabit,
}: {
  habits: Habit[];
  logs: HabitLog[];
  avgStreak: number;
  onClose: () => void;
  onOpenHabit: (habit: Habit) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const today = todayISO();
  const scheduledToday = habits.filter((h) => isScheduledOn(h.frequency, today));
  const doneToday = scheduledToday.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.log_date === today),
  );

  const rows = [...habits].sort((a, b) => currentStreak(b, logs) - currentStreak(a, logs));

  return (
    <div
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 180ms ease-out" }}
      className="fixed inset-0 z-30 flex flex-col bg-[var(--paper)]"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-[var(--ink)]">
            The orchard
          </h1>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {doneToday.length}/{scheduledToday.length} done today · {Math.round(avgStreak)}d avg
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[480px] px-5 py-5">
          {rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--ink-muted)]">No habits yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {rows.map((habit) => (
                <HabitTreeCard
                  key={habit.id}
                  habit={habit}
                  logs={logs}
                  onOpen={() => onOpenHabit(habit)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitTreeCard({
  habit,
  logs,
  onOpen,
}: {
  habit: Habit;
  logs: HabitLog[];
  onOpen: () => void;
}) {
  const streak = currentStreak(habit, logs);
  const strip = buildStrip(habit, logs, STRIP_DAYS);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-4 text-center transition-colors hover:border-[var(--ink-muted)]"
    >
      <GrowthTree stage={stageForStreak(streak)} scale={1.1} />
      <p className="w-full truncate text-sm text-[var(--ink)]">{habit.name}</p>
      <p className="font-[family-name:var(--font-display)] text-xs font-medium text-[var(--accent)]">
        {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "no streak yet"}
      </p>
      <DotStrip cells={strip} />
    </button>
  );
}

function ArchivedHabitRow({ habit, onOpenStats }: { habit: Habit; onOpenStats: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpenStats} className="w-full py-3 text-left">
        <p className="truncate text-[15px] text-[var(--ink-muted)]">{habit.name}</p>
      </button>
    </li>
  );
}

function ComposeHabit({ onDone }: { onDone: () => void }) {
  const add = useAddHabit();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"daily" | "weekdays">("daily");
  const [days, setDays] = useState<Weekday[]>(ALL_WEEKDAYS);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleDay(d: Weekday) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  function submit(close: () => void) {
    const trimmed = name.trim();
    if (!trimmed) return close();
    add.mutate({ name: trimmed, frequency: mode === "daily" ? "daily" : days });
    close();
  }

  return (
    <InlineComposer onClose={onDone}>
      {(close) => (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            autoFocus
            placeholder="Habit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(close);
              if (e.key === "Escape") close();
            }}
            className="w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <DateChip active={mode === "daily"} onClick={() => setMode("daily")}>
              Daily
            </DateChip>
            <DateChip active={mode === "weekdays"} onClick={() => setMode("weekdays")}>
              Specific days
            </DateChip>
          </div>

          {mode === "weekdays" && (
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                    days.includes(d)
                      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                      : "border border-[var(--line)] text-[var(--ink-muted)]"
                  }`}
                >
                  {weekdayLabel(d)[0]}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-3">
            <button type="button" onClick={close} className="p-1.5 text-[var(--ink-muted)]">
              <XIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => submit(close)}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-ink)]"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </InlineComposer>
  );
}

function DateChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-ink)]"
          : "border border-[var(--line)] text-[var(--ink-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function ReminderSettingsSheet({ onClose }: { onClose: () => void }) {
  const { data: settings } = useReminderSettings();
  const update = useUpdateReminderSettings();
  const { signOut } = useAuth();
  const [time, setTime] = useState(settings?.reminder_time ?? "20:00");
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);

  function save(close: () => void) {
    update.mutate({
      reminder_time: time,
      enabled,
      timezone: settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    close();
  }

  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            Daily reminder
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            A notification if you haven't logged today's habits by this time.
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[var(--ink)]">Enabled</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                enabled ? "bg-[var(--accent)]" : "bg-[var(--line)]"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-[var(--paper)] transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[var(--ink)]">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm text-[var(--ink)]"
            />
          </div>

          <button
            type="button"
            onClick={() => save(close)}
            className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-ink)]"
          >
            Save
          </button>

          <div className="mt-6 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full text-center text-sm text-[var(--danger)]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
