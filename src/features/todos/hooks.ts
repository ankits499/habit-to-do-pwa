import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todosRepo } from "../../data/todos";
import type { Todo } from "../../data/types";

const KEY = ["todos"];

export function useTodos() {
  return useQuery({ queryKey: KEY, queryFn: todosRepo.list });
}

export function useAddTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, due_date }: { text: string; due_date: string | null }) =>
      todosRepo.add(text, due_date),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosRepo.setDone(id, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEditTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Pick<Todo, "text" | "due_date"> }) =>
      todosRepo.edit(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
