import { useEffect } from "react";
import { habitLogsRepo, habitsRepo } from "../data/habits";
import { reminderSettingsRepo } from "../data/reminderSettings";
import { isScheduledOn, todayISO } from "./dates";

const CHECK_INTERVAL_MS = 60_000;
const FIRED_KEY = "habit-todo:reminder_fired_on";

/** While the app is open, poll once a minute and fire a local Notification
 * once the reminder time has passed if today's scheduled habits aren't all
 * logged yet. */
export function useReminderCheck() {
  useEffect(() => {
    const check = async () => {
      const settings = await reminderSettingsRepo.get();
      if (!settings.enabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const today = todayISO();
      if (localStorage.getItem(FIRED_KEY) === today) return;

      const now = new Date();
      const [h, m] = settings.reminder_time.split(":").map(Number);
      const reminderPassed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
      if (!reminderPassed) return;

      const [habits, logs] = await Promise.all([habitsRepo.list(), habitLogsRepo.listAll()]);
      const doneToday = new Set(logs.filter((l) => l.log_date === today).map((l) => l.habit_id));
      const pending = habits.filter(
        (h) => !h.archived && isScheduledOn(h.frequency, today) && !doneToday.has(h.id),
      );
      if (pending.length === 0) return;

      const notification = new Notification("Log today's habits", {
        body:
          pending.length === 1
            ? `"${pending[0].name}" isn't marked done yet.`
            : `${pending.length} habits aren't marked done yet.`,
        icon: "/icons/icon-192.png",
      });
      notification.onclick = () => {
        window.focus();
        window.location.href = "/habits";
      };
      localStorage.setItem(FIRED_KEY, today);
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  return Notification.requestPermission();
}
