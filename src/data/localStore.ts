// Generic localStorage-backed collection helper. All app data lives in the
// browser's localStorage — there is no server or database. Function shapes
// here (list/create/update/remove, all async) just match what `features/*/hooks.ts`
// expects to call.

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function collection<T extends { id: string }>(key: string) {
  return {
    async list(): Promise<T[]> {
      return read<T[]>(key, []);
    },
    async create(item: T): Promise<T> {
      const items = read<T[]>(key, []);
      items.push(item);
      write(key, items);
      return item;
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      const items = read<T[]>(key, []);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`${key}: item ${id} not found`);
      items[idx] = { ...items[idx], ...patch };
      write(key, items);
      return items[idx];
    },
    async remove(id: string): Promise<void> {
      const items = read<T[]>(key, []);
      write(
        key,
        items.filter((i) => i.id !== id),
      );
    },
  };
}

export function record<T>(key: string, fallback: T) {
  return {
    async get(): Promise<T> {
      return read<T>(key, fallback);
    },
    async set(value: T): Promise<T> {
      write(key, value);
      return value;
    },
  };
}

export { read, write };
