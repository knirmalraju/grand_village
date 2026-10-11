import { NextRequest, NextResponse } from "next/server";
import { stripeClient, settle } from "@/lib/payments";
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") || "",
      secret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    )
      await settle(event.data.object);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Payment reconciliation failed; event will be retried" },
      { status: 500 },
    );
  }
}
