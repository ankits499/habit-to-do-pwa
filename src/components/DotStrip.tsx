import type { DayCell } from "../lib/streak";

export function DotStrip({ cells }: { cells: DayCell[] }) {
  return (
    <div>
      <div
        className="flex gap-1.5"
        role="img"
        aria-label={`${cells.filter((c) => c.done).length} of the last ${cells.length} scheduled days done`}
      >
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={cell.date}
            className={`h-2.5 w-2.5 rounded-full ${
              !cell.scheduled
                ? "bg-transparent"
                : cell.done
                  ? "bg-[var(--accent)]"
                  : "border-[1.5px] border-[var(--accent)]/35"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
