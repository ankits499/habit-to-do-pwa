import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderSettingsRepo } from "../../data/reminderSettings";
import type { ReminderSettings } from "../../data/types";

const KEY = ["reminder_settings"];

export function useReminderSettings() {
  return useQuery({ queryKey: KEY, queryFn: reminderSettingsRepo.get });
}

export function useUpdateReminderSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: ReminderSettings) => reminderSettingsRepo.set(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
