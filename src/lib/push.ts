import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { isAllowedPushEndpoint } from "./push-validation";

export function pushConfigured() {
  return !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT &&
    process.env.SUPABASE_SECRET_KEY
  );
}
// Only server routes invoke this; subscription endpoints are never exposed to hosts.
export async function deliverPush(messageId?: string) {
  if (!pushConfigured()) return;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: jobs, error } = await client.rpc("claim_push_jobs", {
    p_message: messageId || null,
  });
  if (error) return;
  for (const job of jobs || []) {
    const { data: read } = await client
      .from("read_receipts")
      .select("read_at")
      .eq("user_id", job.parent_id)
      .eq("booking_id", job.booking_id)
      .maybeSingle();
    if (read?.read_at && read.read_at >= job.created_at) {
      await client
        .from("push_outbox")
        .update({ status: "read" })
        .eq("message_id", job.message_id);
      continue;
    }
    const { data: subscriptions, error: subError } = await client
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", job.parent_id);
    let failed = !!subError;
    for (const subscription of subscriptions || []) {
      if (!isAllowedPushEndpoint(subscription.endpoint)) continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: "A message from your village",
            body: "Your senior host shared a message or photo. Open your private booking conversation.",
            url: `/parent/messages?booking=${encodeURIComponent(job.booking_id)}`,
            tag: `booking-${job.booking_id}`,
          }),
          {
            vapidDetails: {
              subject: process.env.VAPID_SUBJECT!,
              publicKey: process.env.VAPID_PUBLIC_KEY!,
              privateKey: process.env.VAPID_PRIVATE_KEY!,
            },
            TTL: 3600,
            timeout: 5000,
          },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410)
          await client
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
        else failed = true;
      }
    }
    await client
      .from("push_outbox")
      .update({
        status: failed
          ? job.attempts >= 5
            ? "failed"
            : "pending"
          : subscriptions?.length
            ? "sent"
            : "no_subscription",
      })
      .eq("message_id", job.message_id);
  }
}
