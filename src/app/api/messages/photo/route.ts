import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { deliverPush } from "@/lib/push";
import { z } from "zod";
import { clientFor, safeError } from "@/lib/server";

export async function POST(req: NextRequest) {
  try {
    const { client, user } = await clientFor(req);
    // Bound the request before parsing base64 photo data.
    const reader = req.body?.getReader();
    if (!reader) throw new Error("A photo is required.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1_450_000) {
        await reader.cancel();
        throw new Error("Photo exceeds the upload limit.");
      }
      chunks.push(value);
    }
    const { payload } = z
      .object({
        payload: z.object({
          booking_id: z.uuid(),
          body: z.string().trim().max(2000),
          type: z.literal("chat"),
          photo_data: z
            .string()
            .max(1_400_000)
            .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
        }),
      })
      .parse(JSON.parse(Buffer.concat(chunks).toString()));
    const { data: booking, error } = await client
      .from("bookings")
      .select("id,parent_id,host_id,status")
      .eq("id", payload.booking_id)
      .single();
    if (
      error ||
      !booking ||
      ![booking.parent_id, booking.host_id].includes(user.id) ||
      !["accepted", "completed"].includes(booking.status)
    )
      throw new Error("This conversation is not available.");
    const bytes = Buffer.from(payload.photo_data.split(",")[1], "base64");
    if (
      bytes.length < 4 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff
    )
      throw new Error("Invalid JPEG photo.");
    const path = `${booking.id}/${user.id}/${crypto.randomUUID()}.jpg`;
    const upload = await client.storage
      .from("chat-photos")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (upload.error) throw new Error(upload.error.message);
    const message = await client
      .from("messages")
      .insert({
        booking_id: booking.id,
        sender_id: user.id,
        body: payload.body,
        type: "chat",
        photo_path: path,
      })
      .select("id")
      .single();
    if (message.error) {
      await client.storage.from("chat-photos").remove([path]);
      throw new Error(message.error.message);
    }
    after(() => deliverPush(message.data.id).catch(() => {}));
    return NextResponse.json({ result: { id: message.data.id } });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Please choose a supported photo and try again."
            : safeError(e),
      },
      { status: 400 },
    );
  }
}
