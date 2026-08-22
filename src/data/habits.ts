import { supabase } from "../lib/supabaseClient";
import type { Habit, HabitLog, Weekday } from "./types";

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const habitsRepo = {
  async list(): Promise<Habit[]> {
    const { data, error } = await supabase
      .from("habits")
      .select("id, name, frequency, archived, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  async add(name: string, frequency: "daily" | Weekday[]): Promise<Habit> {
    const { data, error } = await supabase
      .from("habits")
      .insert({ name, frequency, archived: false, user_id: await userId() })
      .select("id, name, frequency, archived, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async edit(id: string, patch: Pick<Habit, "name" | "frequency">): Promise<Habit> {
    const { data, error } = await supabase
      .from("habits")
      .update(patch)
      .eq("id", id)
      .select("id, name, frequency, archived, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async setArchived(id: string, archived: boolean): Promise<Habit> {
    const { data, error } = await supabase
      .from("habits")
      .update({ archived })
      .eq("id", id)
      .select("id, name, frequency, archived, created_at")
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) throw error;
  },
};

export const habitLogsRepo = {
  async listAll(): Promise<HabitLog[]> {
    const { data, error } = await supabase.from("habit_logs").select("habit_id, log_date");
    if (error) throw error;
    return data;
  },
  async isDone(habit_id: string, log_date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("habit_id", habit_id)
      .eq("log_date", log_date)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
  async setDone(habit_id: string, log_date: string, done: boolean): Promise<void> {
    if (done) {
      const { error } = await supabase
        .from("habit_logs")
        .upsert({ habit_id, log_date, user_id: await userId() });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habit_id)
        .eq("log_date", log_date);
      if (error) throw error;
    }
  },
};
