import { collection } from "./localStore";
import type { Todo } from "./types";

const store = collection<Todo>("habit-todo:todos");

export const todosRepo = {
  list: store.list,
  async add(text: string, due_date: string | null): Promise<Todo> {
    return store.create({
      id: crypto.randomUUID(),
      text,
      due_date,
      done: false,
      created_at: new Date().toISOString(),
    });
  },
  async setDone(id: string, done: boolean): Promise<Todo> {
    return store.update(id, { done });
  },
  async edit(id: string, patch: Pick<Todo, "text" | "due_date">): Promise<Todo> {
    return store.update(id, patch);
  },
  remove: store.remove,
};
