import { supabase } from "../lib/supabaseClient";
import type { Todo } from "./types";

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const todosRepo = {
  async list(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("id, text, due_date, done, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  async add(text: string, due_date: string | null): Promise<Todo> {
    const { data, error } = await supabase
      .from("todos")
      .insert({ text, due_date, done: false, user_id: await userId() })
      .select("id, text, due_date, done, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async setDone(id: string, done: boolean): Promise<Todo> {
    const { data, error } = await supabase
      .from("todos")
      .update({ done })
      .eq("id", id)
      .select("id, text, due_date, done, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async edit(id: string, patch: Pick<Todo, "text" | "due_date">): Promise<Todo> {
    const { data, error } = await supabase
      .from("todos")
      .update(patch)
      .eq("id", id)
      .select("id, text, due_date, done, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
  },
};
