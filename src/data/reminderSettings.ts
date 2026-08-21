import { record } from "./localStore";
import type { ReminderSettings } from "./types";

const DEFAULTS: ReminderSettings = {
  reminder_time: "20:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  enabled: true,
};

const store = record<ReminderSettings>("habit-todo:reminder_settings", DEFAULTS);

export const reminderSettingsRepo = {
  get: store.get,
  set: store.set,
};
