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

/** Invalidates `queryKey` only once every mutation sharing `mutationKey` has
 * settled. Without this, firing several optimistic mutations against the
 * same list back to back (e.g. checking off several todos quickly) lets an
 * earlier one's background refetch land mid-flight and momentarily
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

const ADD_KEY = ["addTodo"];
const TOGGLE_KEY = ["toggleTodo"];
const EDIT_KEY = ["editTodo"];
const DELETE_KEY = ["deleteTodo"];

export function useAddTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ADD_KEY,
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
    onSettled: () => settleOnce(qc, ADD_KEY, KEY),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosRepo.setDone(id, done),
    onMutate: async ({ id, done }) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.map((t) => (t.id === id ? { ...t, done } : t)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => settleOnce(qc, TOGGLE_KEY, KEY),
  });
}

export function useEditTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: EDIT_KEY,
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Todo, "text" | "due_date"> }) =>
      todosRepo.edit(id, patch),
    onMutate: async ({ id, patch }) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => settleOnce(qc, EDIT_KEY, KEY),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: DELETE_KEY,
    mutationFn: (id: string) => todosRepo.remove(id),
    onMutate: async (id) => {
      const previous = await beginOptimistic<Todo[]>(qc, KEY);
      qc.setQueryData<Todo[]>(KEY, (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => settleOnce(qc, DELETE_KEY, KEY),
  });
}
