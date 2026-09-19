import { useEffect, useState } from "react";
import { todayISO } from "./dates";

/** Current local date; updates at midnight and when a backgrounded PWA
 * returns to the foreground, so date-derived views never go stale. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const sync = () => setToday(todayISO());
    const untilMidnight = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 1000;
    };
    let timer = setTimeout(function tick() {
      sync();
      timer = setTimeout(tick, untilMidnight());
    }, untilMidnight());
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return today;
}
