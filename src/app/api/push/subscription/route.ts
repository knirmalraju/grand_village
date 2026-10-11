import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientFor, safeError } from "@/lib/server";
import { pushConfigured } from "@/lib/push";
import { isAllowedPushEndpoint } from "@/lib/push-validation";
const endpoint = z.string().max(2048).refine(isAllowedPushEndpoint);
export async function GET(req: NextRequest) {
  try {
    await clientFor(req);
    return NextResponse.json({
      configured: pushConfigured(),
      publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null,
    });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 401 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { client, user } = await clientFor(req);
    if (!pushConfigured())
      throw new Error(
        "Browser push needs server configuration before it can be enabled.",
      );
    const profile = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile.data?.role !== "parent")
      throw new Error("Notifications are available for parent accounts.");
    const input = z
      .object({
        endpoint,
        keys: z.object({
          p256dh: z
            .string()
            .regex(/^[A-Za-z0-9_-]+={0,2}$/)
            .min(80)
            .max(100),
          auth: z
            .string()
            .regex(/^[A-Za-z0-9_-]+={0,2}$/)
            .min(20)
            .max(30),
        }),
      })
      .parse(await req.json());
    const { error } = await client
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "This browser subscription is not supported."
            : safeError(e),
      },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { client, user } = await clientFor(req);
    const input = z.object({ endpoint }).parse(await req.json());
    const { error } = await client
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", input.endpoint);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
