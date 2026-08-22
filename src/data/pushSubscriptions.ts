import { supabase } from "../lib/supabaseClient";

export const pushSubscriptionsRepo = {
  async save(sub: PushSubscription): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not signed in");
    const json = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userData.user.id,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
  },
};
