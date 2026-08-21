/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// There's no server, so reminders fire client-side while the app is open
// (see useReminderCheck) rather than via a real push event.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(`${self.registration.scope}habits`));
});

self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());
