/** Todo | Habit segmented control shown at the top of the add sheets. */
export function KindSwitch({ kind, onSwitch }: { kind: "todo" | "habit"; onSwitch: () => void }) {
  const tab = (k: "todo" | "habit", label: string) => (
    <button
      type="button"
      aria-pressed={kind === k}
      onClick={kind === k ? undefined : onSwitch}
      className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
        kind === k ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--ink-muted)]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-1 self-start rounded-full border border-[var(--line)] p-1">
      <div className="flex w-52 gap-1">
        {tab("todo", "Todo")}
        {tab("habit", "Habit")}
      </div>
    </div>
  );
}
