export type Todo = {
  id: string;
  text: string;
  due_date: string | null; // ISO date (yyyy-mm-dd)
  done: boolean;
  created_at: string;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type Habit = {
  id: string;
  name: string;
  frequency: "daily" | Weekday[]; // daily, or specific weekdays
  archived: boolean;
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  log_date: string; // ISO date (yyyy-mm-dd)
};

export type ReminderSettings = {
  reminder_time: string; // "HH:MM"
  timezone: string;
  enabled: boolean;
};
