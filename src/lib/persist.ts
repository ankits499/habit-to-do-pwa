import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/** Keeps the last-fetched data — and any writes still queued offline — on the
 * device, so the app opens offline and nothing is lost across a reload. */
export const persister = createSyncStoragePersister({
  storage: typeof window === "undefined" ? undefined : window.localStorage,
  key: "habit-todo-cache",
});
