import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todosRepo } from "../../data/todos";
import type { Todo } from "../../data/types";

const KEY = ["todos"];

export function useTodos() {
  return useQuery({ queryKey: KEY, queryFn: todosRepo.list });
}

/** Cancels in-flight fetches for `key` and snapshots the current cache so a
 * failed mutation can roll back to it. Every optimistic mutation below needs
 * this same pair of steps before touching the cache. */
async function beginOptimistic<T>(qc: ReturnType<typeof useQueryClient>, key: unknown[]) {
  await qc.cancelQueries({ queryKey: key });
  return qc.getQueryData<T>(key);
}

export function useAddTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, due_date }: { text: string; due_date: string | null }) =>
      todosRepo.add(text, due_date),
    onMutate: async ({ text, due_date }) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      const optimistic: Todo = {
        id: `optimistic-${crypto.randomUUID()}`,
        text,
        due_date,
        done: false,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<Todo[]>(KEY, (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosRepo.setDone(id, done),
    onMutate: async ({ id, done }) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.map((t) => (t.id === id ? { ...t, done } : t)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEditTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Todo, "text" | "due_date"> }) =>
      todosRepo.edit(id, patch),
    onMutate: async ({ id, patch }) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosRepo.remove(id),
    onMutate: async (id) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
