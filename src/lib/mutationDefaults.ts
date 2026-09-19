import type { QueryClient } from "@tanstack/react-query";
import { habitLogsRepo, habitsRepo } from "../data/habits";
import { todosRepo } from "../data/todos";
import type { Habit, Todo, Weekday } from "../data/types";
import {
  ADD_HABIT_KEY,
  DELETE_HABIT_KEY,
  EDIT_HABIT_KEY,
  HABITS_KEY,
  LOGS_KEY,
  SET_ARCHIVED_KEY,
  TOGGLE_DATE_KEY,
} from "../features/habits/hooks";
import {
  ADD_TODO_KEY,
  DELETE_TODO_KEY,
  EDIT_TODO_KEY,
  TODOS_KEY,
  TOGGLE_TODO_KEY,
} from "../features/todos/hooks";

/** A write queued offline is saved with the cache and, after a reload,
 * comes back as bare variables with no hook attached. These defaults give it
 * back its function and its cache refresh. Keep them in step with the
 * `mutationFn`s in the feature hooks. */
export function registerMutationDefaults(qc: QueryClient) {
  const on = <V>(key: unknown[], fn: (v: V) => Promise<unknown>, invalidate: unknown[][]) =>
    qc.setMutationDefaults(key, {
      mutationFn: fn as (v: unknown) => Promise<unknown>,
      onSettled: () => invalidate.forEach((queryKey) => qc.invalidateQueries({ queryKey })),
    });

  on(ADD_HABIT_KEY, (v: { name: string; frequency: "daily" | Weekday[] }) => habitsRepo.add(v.name, v.frequency), [HABITS_KEY]);
  on(EDIT_HABIT_KEY, (v: { id: string; patch: Pick<Habit, "name" | "frequency"> }) => habitsRepo.edit(v.id, v.patch), [HABITS_KEY]);
  on(SET_ARCHIVED_KEY, (v: { id: string; archived: boolean }) => habitsRepo.setArchived(v.id, v.archived), [HABITS_KEY]);
  on(DELETE_HABIT_KEY, (id: string) => habitsRepo.remove(id), [HABITS_KEY, LOGS_KEY]);
  on(TOGGLE_DATE_KEY, (v: { habitId: string; date: string; done: boolean }) => habitLogsRepo.setDone(v.habitId, v.date, v.done), [LOGS_KEY]);

  on(ADD_TODO_KEY, (v: { text: string; due_date: string | null }) => todosRepo.add(v.text, v.due_date), [TODOS_KEY]);
  on(TOGGLE_TODO_KEY, (v: { id: string; done: boolean }) => todosRepo.setDone(v.id, v.done), [TODOS_KEY]);
  on(EDIT_TODO_KEY, (v: { id: string; patch: Pick<Todo, "text" | "due_date"> }) => todosRepo.edit(v.id, v.patch), [TODOS_KEY]);
  on(DELETE_TODO_KEY, (id: string) => todosRepo.remove(id), [TODOS_KEY]);
}
