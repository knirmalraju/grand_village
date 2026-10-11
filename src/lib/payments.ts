import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    throw new Error(
      "Stripe test payments are not configured. Add a test secret key in server configuration. No payment was taken.",
    );
  return new Stripe(key);
}
export function adminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key)
    throw new Error(
      "Payment verification requires a server-only Supabase secret key.",
    );
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
export async function checkout(
  client: SupabaseClient,
  userId: string,
  id: string,
  origin: string,
) {
  const stripe = stripeClient();
  const admin = adminClient();
  const { data: b, error } = await client
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (
    error ||
    !b ||
    b.parent_id !== userId ||
    b.status !== "accepted" ||
    b.payment_status === "paid"
  )
    throw new Error("This booking is not eligible for checkout.");
  const { data: account } = await admin
    .from("host_payout_accounts")
    .select("stripe_account_id")
    .eq("host_id", b.host_id)
    .single();
  if (!account?.stripe_account_id)
    throw new Error(
      "This host has not connected a Stripe test account. No payment was taken.",
    );
  const { data: existing } = await admin
    .from("payments")
    .select("stripe_session_id")
    .eq("booking_id", id)
    .maybeSingle();
  if (existing?.stripe_session_id) {
    const old = await stripe.checkout.sessions.retrieve(
      existing.stripe_session_id,
    );
    if (old.status === "open" && old.url) return { url: old.url };
    if (old.payment_status === "paid") {
      await settle(old);
      throw new Error("Payment is already complete. Refresh your booking.");
    }
  }
  const base = process.env.APP_URL || origin;
  const amount = Math.round(Number(b.amount) * 100);
  const fee = Math.round(Number(b.platform_fee) * 100);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      allowed_payment_method_types: ["card"],
      client_reference_id: id,
      metadata: { booking_id: id },
      success_url: `${base}/bookings/${id}?checkout=success`,
      cancel_url: `${base}/bookings/${id}?checkout=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: `GrandVillage · ${b.service}` },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: { destination: account.stripe_account_id },
        metadata: { booking_id: id },
      },
    },
    { idempotencyKey: `gv-${id}-${existing?.stripe_session_id || "initial"}` },
  );
  const saved = await admin.from("payments").upsert(
    {
      booking_id: id,
      stripe_session_id: session.id,
      amount_total: b.amount,
      platform_fee: b.platform_fee,
      payment_status: "pending",
    },
    { onConflict: "booking_id" },
  );
  if (saved.error)
    throw new Error(
      "Checkout could not be recorded. Contact support before retrying.",
    );
  return { url: session.url };
}
export async function settle(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" || session.livemode) return;
  const id = session.metadata?.booking_id;
  if (!id) throw new Error("Missing booking metadata");
  const admin = adminClient();
  const { error } = await admin.rpc("record_test_payment", {
    p_booking: id,
    p_session: session.id,
    p_total: (session.amount_total || 0) / 100,
    p_currency: session.currency,
  });
  if (error) throw new Error(error.message);
}
