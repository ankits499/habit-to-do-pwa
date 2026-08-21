import { collection, read, write } from "./localStore";
import type { Habit, HabitLog, Weekday } from "./types";

const habitsStore = collection<Habit>("habit-todo:habits");
const LOGS_KEY = "habit-todo:habit_logs";

export const habitsRepo = {
  list: habitsStore.list,
  async add(name: string, frequency: "daily" | Weekday[]): Promise<Habit> {
    return habitsStore.create({
      id: crypto.randomUUID(),
      name,
      frequency,
      archived: false,
      created_at: new Date().toISOString(),
    });
  },
  async edit(id: string, patch: Pick<Habit, "name" | "frequency">): Promise<Habit> {
    return habitsStore.update(id, patch);
  },
  async setArchived(id: string, archived: boolean): Promise<Habit> {
    return habitsStore.update(id, { archived });
  },
  async remove(id: string): Promise<void> {
    await habitsStore.remove(id);
    const logs = read<HabitLog[]>(LOGS_KEY, []);
    write(
      LOGS_KEY,
      logs.filter((l) => l.habit_id !== id),
    );
  },
};

export const habitLogsRepo = {
  async listAll(): Promise<HabitLog[]> {
    return read<HabitLog[]>(LOGS_KEY, []);
  },
  async isDone(habit_id: string, log_date: string): Promise<boolean> {
    const logs = read<HabitLog[]>(LOGS_KEY, []);
    return logs.some((l) => l.habit_id === habit_id && l.log_date === log_date);
  },
  async setDone(habit_id: string, log_date: string, done: boolean): Promise<void> {
    const logs = read<HabitLog[]>(LOGS_KEY, []);
    const exists = logs.some((l) => l.habit_id === habit_id && l.log_date === log_date);
    if (done && !exists) {
      logs.push({ habit_id, log_date });
      write(LOGS_KEY, logs);
    } else if (!done && exists) {
      write(
        LOGS_KEY,
        logs.filter((l) => !(l.habit_id === habit_id && l.log_date === log_date)),
      );
    }
  },
};
