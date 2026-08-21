import type { Habit, HabitLog } from "../data/types";
import { isScheduledOn, toISODate, todayISO, weekdayLabel } from "../lib/dates";

const WEEKDAY_HEADERS = [0, 1, 2, 3, 4, 5, 6] as const;

/** Month-grid heatmap for a single habit. `month` defaults to the current
 * month; pass a Date within the target month to view a different one. */
export function HabitCalendar({
  habit,
  logs,
  month = new Date(),
}: {
  habit: Habit;
  logs: HabitLog[];
  month?: Date;
}) {
  const doneDates = new Set(logs.filter((l) => l.habit_id === habit.id).map((l) => l.log_date));
  const today = todayISO();

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: { date: string | null }[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toISODate(new Date(year, monthIndex, d)) });
  }

  return (
    <div>
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_HEADERS.map((w) => (
          <span key={w} className="text-center text-[10px] leading-none text-[var(--ink-muted)]">
            {weekdayLabel(w)[0]}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <span key={`blank-${i}`} />;
          const scheduled = isScheduledOn(habit.frequency, cell.date);
          const done = doneDates.has(cell.date);
          const isFuture = cell.date > today;
          return (
            <span
              key={cell.date}
              title={cell.date}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                !scheduled
                  ? "text-[var(--ink-muted)]/50"
                  : done
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : isFuture
                      ? "border border-[var(--line)] text-[var(--ink-muted)]"
                      : "border-[1.5px] border-[var(--accent)]/35 text-[var(--ink-muted)]"
              }`}
            >
              {Number(cell.date.slice(-2))}
            </span>
          );
        })}
      </div>
    </div>
  );
}
