import type { DayCell } from "../lib/streak";
import { weekdayLabel } from "../lib/dates";
import type { Weekday } from "../data/types";

export function DotStrip({ cells, showLabels }: { cells: DayCell[]; showLabels?: boolean }) {
  return (
    <div>
      <div
        className="flex gap-2"
        role="img"
        aria-label={`${cells.filter((c) => c.done).length} of the last ${cells.length} scheduled days done`}
      >
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={cell.date}
            className={`h-3 w-3 rounded-full ${
              !cell.scheduled
                ? "bg-transparent"
                : cell.done
                  ? "bg-[var(--accent)]"
                  : "border-[1.5px] border-[var(--accent)]/35"
            }`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-1 flex gap-2" aria-hidden="true">
          {cells.map((cell) => {
            const weekday = new Date(`${cell.date}T12:00:00`).getDay() as Weekday;
            return (
              <span key={cell.date} className="w-3 text-center text-[10px] leading-none text-[var(--ink-muted)]">
                {weekdayLabel(weekday)[0]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
