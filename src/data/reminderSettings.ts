import { supabase } from "../lib/supabaseClient";
import type { ReminderSettings } from "./types";

const DEFAULTS: ReminderSettings = {
  reminder_time: "20:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  enabled: true,
};

export const reminderSettingsRepo = {
  async get(): Promise<ReminderSettings> {
    const { data, error } = await supabase
      .from("reminder_settings")
      .select("reminder_time, enabled, timezone")
      .maybeSingle();
    if (error) throw error;
    return data ?? DEFAULTS;
  },
  async set(value: ReminderSettings): Promise<ReminderSettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("reminder_settings")
      .upsert({ ...value, user_id: userData.user.id })
      .select("reminder_time, enabled, timezone")
      .single();
    if (error) throw error;
    return data;
  },
};
