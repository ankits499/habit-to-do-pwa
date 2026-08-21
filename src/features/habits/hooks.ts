import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { habitLogsRepo, habitsRepo } from "../../data/habits";
import type { Habit, Weekday } from "../../data/types";
import { todayISO } from "../../lib/dates";

const HABITS_KEY = ["habits"];
const LOGS_KEY = ["habit_logs"];

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
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useEditHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Habit, "name" | "frequency"> }) =>
      habitsRepo.edit(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useSetHabitArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      habitsRepo.setArchived(id, archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useToggleHabitToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, done }: { habitId: string; done: boolean }) =>
      habitLogsRepo.setDone(habitId, todayISO(), done),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}
