import { pushSubscriptionsRepo } from "../data/pushSubscriptions";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))).buffer;
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  return Notification.requestPermission();
}

/** Requests notification permission, then registers this device for Web
 * Push and saves the subscription so the server-side reminder cron
 * (Supabase Edge Function `send-reminders`) can deliver notifications even
 * when the app isn't open. */
export async function subscribeToPush(): Promise<NotificationPermission | "unsupported"> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted" || !VAPID_PUBLIC_KEY) return permission;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await pushSubscriptionsRepo.save(subscription);
  return permission;
}
