import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { habitLogsRepo, habitsRepo } from "../../data/habits";
import type { Habit, HabitLog, Weekday } from "../../data/types";
import { todayISO } from "../../lib/dates";

const HABITS_KEY = ["habits"];
const LOGS_KEY = ["habit_logs"];

/** Cancels in-flight fetches for `key` and snapshots the current cache so a
 * failed mutation can roll back to it. */
async function beginOptimistic<T>(qc: ReturnType<typeof useQueryClient>, key: unknown[]) {
  await qc.cancelQueries({ queryKey: key });
  return qc.getQueryData<T>(key);
}

export function useHabits() {
  return useQuery({ queryKey: HABITS_KEY, queryFn: habitsRepo.list });
}

export function useHabitLogs() {
  return useQuery({ queryKey: LOGS_KEY, queryFn: habitLogsRepo.listAll });
}

export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, frequency }: { name: string; frequency: "daily" | Weekday[] }) =>
      habitsRepo.add(name, frequency),
    onMutate: async ({ name, frequency }) => {
      const previous = await beginOptimistic<Habit[]>(qc, HABITS_KEY);
      const optimistic: Habit = {
        id: `optimistic-${crypto.randomUUID()}`,
        name,
        frequency,
        archived: false,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<Habit[]>(HABITS_KEY, (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(HABITS_KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useEditHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Habit, "name" | "frequency"> }) =>
      habitsRepo.edit(id, patch),
    onMutate: async ({ id, patch }) => {
      const previous = await beginOptimistic<Habit[]>(qc, HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old = []) =>
        old.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(HABITS_KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useSetHabitArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      habitsRepo.setArchived(id, archived),
    onMutate: async ({ id, archived }) => {
      const previous = await beginOptimistic<Habit[]>(qc, HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old = []) =>
        old.map((h) => (h.id === id ? { ...h, archived } : h)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(HABITS_KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsRepo.remove(id),
    onMutate: async (id) => {
      const previous = await beginOptimistic<Habit[]>(qc, HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old = []) => old.filter((h) => h.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => ctx?.previous && qc.setQueryData(HABITS_KEY, ctx.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: HABITS_KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
    },
  });
}

export function useToggleHabitToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, done }: { habitId: string; done: boolean }) =>
      habitLogsRepo.setDone(habitId, todayISO(), done),
    onMutate: async ({ habitId, done }) => {
      const previous = await beginOptimistic<HabitLog[]>(qc, LOGS_KEY);
      const today = todayISO();
      qc.setQueryData<HabitLog[]>(LOGS_KEY, (old = []) =>
        done
          ? [...old, { habit_id: habitId, log_date: today }]
          : old.filter((l) => !(l.habit_id === habitId && l.log_date === today)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(LOGS_KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}
