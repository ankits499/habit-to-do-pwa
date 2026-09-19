import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { habitLogsRepo, habitsRepo } from "../../data/habits";
import type { Habit, HabitLog, Weekday } from "../../data/types";
import { todayISO } from "../../lib/dates";

export const HABITS_KEY = ["habits"];
export const LOGS_KEY = ["habit_logs"];

/** Cancels in-flight fetches for `key` and snapshots the current cache so a
 * failed mutation can roll back to it. */
async function beginOptimistic<T>(qc: ReturnType<typeof useQueryClient>, key: unknown[]) {
  await qc.cancelQueries({ queryKey: key });
  return qc.getQueryData<T>(key);
}

/** Invalidates `queryKey` only once every mutation sharing `mutationKey` has
 * settled. Without this, firing several optimistic mutations against the
 * same list back to back (e.g. checking off multiple habits quickly) lets
 * an earlier one's background refetch land mid-flight and momentarily
 * overwrite a sibling's still-pending optimistic update — a visible
 * flicker back to the old state before snapping to the right one. */
function settleOnce(
  qc: ReturnType<typeof useQueryClient>,
  mutationKey: unknown[],
  queryKey: unknown[],
) {
  if (qc.isMutating({ mutationKey }) === 1) {
    qc.invalidateQueries({ queryKey });
  }
}

export function useHabits() {
  return useQuery({ queryKey: HABITS_KEY, queryFn: habitsRepo.list });
}

export function useHabitLogs() {
  return useQuery({ queryKey: LOGS_KEY, queryFn: habitLogsRepo.listAll });
}

export const ADD_HABIT_KEY = ["addHabit"];
export const EDIT_HABIT_KEY = ["editHabit"];
export const SET_ARCHIVED_KEY = ["setHabitArchived"];
export const DELETE_HABIT_KEY = ["deleteHabit"];
export const TOGGLE_DATE_KEY = ["toggleHabitForDate"];

export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ADD_HABIT_KEY,
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
    onSettled: () => settleOnce(qc, ADD_HABIT_KEY, HABITS_KEY),
  });
}

export function useEditHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: EDIT_HABIT_KEY,
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
    onSettled: () => settleOnce(qc, EDIT_HABIT_KEY, HABITS_KEY),
  });
}

export function useSetHabitArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: SET_ARCHIVED_KEY,
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
    onSettled: () => settleOnce(qc, SET_ARCHIVED_KEY, HABITS_KEY),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: DELETE_HABIT_KEY,
    mutationFn: (id: string) => habitsRepo.remove(id),
    onMutate: async (id) => {
      const previous = await beginOptimistic<Habit[]>(qc, HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old = []) => old.filter((h) => h.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => ctx?.previous && qc.setQueryData(HABITS_KEY, ctx.previous),
    onSettled: () => {
      settleOnce(qc, DELETE_HABIT_KEY, HABITS_KEY);
      settleOnce(qc, DELETE_HABIT_KEY, LOGS_KEY);
    },
  });
}

/** Toggles a habit's log for an arbitrary date, so a forgotten check-in from
 * a previous day can still be logged. The date lives in the variables (not
 * read at run time) so a write queued offline lands on the right day. */
export function useToggleHabitForDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: TOGGLE_DATE_KEY,
    mutationFn: ({ habitId, date, done }: { habitId: string; date: string; done: boolean }) =>
      habitLogsRepo.setDone(habitId, date, done),
    onMutate: async ({ habitId, date, done }) => {
      const previous = await beginOptimistic<HabitLog[]>(qc, LOGS_KEY);
      qc.setQueryData<HabitLog[]>(LOGS_KEY, (old = []) =>
        done
          ? [...old, { habit_id: habitId, log_date: date }]
          : old.filter((l) => !(l.habit_id === habitId && l.log_date === date)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(LOGS_KEY, ctx.previous),
    onSettled: () => settleOnce(qc, TOGGLE_DATE_KEY, LOGS_KEY),
  });
}

/** Today-only convenience over {@link useToggleHabitForDate}. */
export function useToggleHabitToday() {
  const { mutate } = useToggleHabitForDate();
  return {
    mutate: ({ habitId, done }: { habitId: string; done: boolean }) =>
      mutate({ habitId, date: todayISO(), done }),
  };
}
