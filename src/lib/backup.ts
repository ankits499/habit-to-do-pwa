// Everything the app stores, all under localStorage — there is no server,
// so this is the only way data can outlive a browser/PWA data wipe (iOS in
// particular can evict site storage). Export/import round-trips these keys
// verbatim as a single JSON file the user can save and restore from.
const KEYS = [
  "habit-todo:todos",
  "habit-todo:habits",
  "habit-todo:habit_logs",
  "habit-todo:reminder_settings",
] as const;

export function exportBackup(): string {
  const data: Record<string, unknown> = {};
  for (const key of KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        // skip unreadable entries rather than failing the whole export
      }
    }
  }
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function importBackup(json: string): void {
  const parsed: unknown = JSON.parse(json);
  const data = (parsed as { data?: unknown } | null)?.data;
  if (!data || typeof data !== "object") {
    throw new Error("That file doesn't look like a Todo & Habits backup.");
  }
  const record = data as Record<string, unknown>;
  for (const key of KEYS) {
    if (key in record) {
      localStorage.setItem(key, JSON.stringify(record[key]));
    }
  }
}
