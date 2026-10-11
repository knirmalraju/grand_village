import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { deliverPush, pushConfigured } from "@/lib/push";
export async function POST(req: NextRequest) {
  const expected = process.env.PUSH_DISPATCH_SECRET;
  const received =
    req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured())
    return NextResponse.json(
      { error: "Push is not configured" },
      { status: 503 },
    );
  await deliverPush();
  return NextResponse.json({ ok: true });
}
