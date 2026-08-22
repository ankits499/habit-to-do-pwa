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
    onMutate: async (settings) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<ReminderSettings>(KEY);
      qc.setQueryData<ReminderSettings>(KEY, settings);
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
