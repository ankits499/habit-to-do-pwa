import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/** Keeps the last-fetched data on the device so the app opens (and reads)
 * offline. Writes made while offline queue in memory and flush on reconnect;
 * ponytail: a reload while offline drops queued writes — persist mutations
 * (needs per-mutation defaults) if that ever bites. */
export const persister = createSyncStoragePersister({
  storage: typeof window === "undefined" ? undefined : window.localStorage,
  key: "habit-todo-cache",
});
