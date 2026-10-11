import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { deliverPush } from "@/lib/push";
import { z } from "zod";
import { checkout } from "@/lib/payments";
import { clientFor, safeError } from "@/lib/server";
const short = z.string().trim().min(1).max(2000);
export async function POST(req: NextRequest) {
  try {
    const { client, user } = await clientFor(req);
    const { type, payload: p } = z
      .object({ type: z.string(), payload: z.record(z.string(), z.unknown()) })
      .parse(await req.json());
    let result: unknown;
    if (type === "book") {
      const v = z
        .object({
          host_id: z.uuid(),
          service: z.string().min(1).max(60),
          starts_at: z.iso.datetime(),
          ends_at: z.iso.datetime(),
          child_age_range: z.string().max(40),
          care_notes: z.string().max(1000),
        })
        .parse(p);
      const r = await client.rpc("request_booking", {
        p_host: v.host_id,
        p_service: v.service,
        p_start: v.starts_at,
        p_end: v.ends_at,
        p_age: v.child_age_range,
        p_notes: v.care_notes,
      });
      if (r.error) throw new Error(r.error.message);
      result = r.data;
    } else if (type === "status") {
      const v = z
        .object({
          id: z.uuid(),
          status: z.enum(["accepted", "declined", "completed", "cancelled"]),
        })
        .parse(p);
      const r = await client.rpc("transition_booking", {
        p_id: v.id,
        p_status: v.status,
      });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "message") {
      const v = z
        .object({
          booking_id: z.uuid(),
          body: short,
          type: z.enum(["chat", "update"]),
        })
        .parse(p);
      const r = await client
        .from("messages")
        .insert({ ...v, sender_id: user.id })
        .select("id")
        .single();
      if (r.error) throw new Error(r.error.message);
      after(() => deliverPush(r.data.id).catch(() => {}));
    } else if (type === "review") {
      const v = z
        .object({
          booking_id: z.uuid(),
          rating: z.number().int().min(1).max(5),
          body: z.string().trim().min(5).max(1000),
        })
        .parse(p);
      const eligible = await client
        .from("bookings")
        .select("id")
        .eq("id", v.booking_id)
        .eq("parent_id", user.id)
        .eq("status", "completed")
        .maybeSingle();
      if (eligible.error || !eligible.data)
        throw new Error(
          "Only the parent of a completed booking can leave feedback.",
        );
      const r = await client
        .from("reviews")
        .insert({ ...v, reviewer_id: user.id });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "support") {
      const v = z
        .object({
          subject: z.string().min(1).max(100),
          body: z.string().trim().min(10).max(2000),
        })
        .parse(p);
      const r = await client
        .from("support_cases")
        .insert({ ...v, user_id: user.id });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "read") {
      const id = z.uuid().parse(p.booking_id);
      const r = await client.from("read_receipts").upsert(
        {
          booking_id: id,
          user_id: user.id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,booking_id" },
      );
      if (r.error) throw new Error(r.error.message);
    } else if (type === "save") {
      const id = z.uuid().parse(p.id);
      const found = await client
        .from("saved_hosts")
        .select("host_id")
        .eq("host_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (found.error) throw new Error(found.error.message);
      const r = found.data
        ? await client
            .from("saved_hosts")
            .delete()
            .eq("host_id", id)
            .eq("user_id", user.id)
        : await client
            .from("saved_hosts")
            .insert({ host_id: id, user_id: user.id });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "profile" || type === "host_onboard") {
      if (type === "host_onboard") {
        const r = await client
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (r.data?.role !== "host")
          throw new Error(
            "Create or sign in to a host account to submit a host profile.",
          );
      }
      const v = z
        .object({
          name: z.string().trim().min(1).max(80),
          bio: z.string().max(2000).default(""),
          rate: z.coerce.number().min(10).max(200).optional(),
          languages: z.string().max(200).default("English"),
          services: z.string().max(100).optional(),
        })
        .parse(p);
      const r = await client.rpc("save_profile", {
        p_name: v.name,
        p_bio: v.bio,
        p_rate: v.rate || 24,
        p_languages: v.languages.split(",").map((s) => s.trim()),
        p_service: v.services || null,
      });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "availability") {
      const v = z
        .object({ starts_at: z.iso.datetime(), ends_at: z.iso.datetime() })
        .parse(p);
      if (new Date(v.ends_at) <= new Date(v.starts_at))
        throw new Error("End time must follow start time.");
      const r = await client
        .from("availability")
        .insert({ host_id: user.id, ...v });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "approve") {
      const id = z.uuid().parse(p.id);
      const r = await client.rpc("toggle_host_listing", { p_id: id });
      if (r.error) throw new Error(r.error.message);
    } else if (type === "resolve") {
      const id = z.uuid().parse(p.id);
      const r = await client
        .from("support_cases")
        .update({ status: "resolved" })
        .eq("id", id);
      if (r.error) throw new Error(r.error.message);
    } else if (type === "pay")
      result = await checkout(
        client,
        user.id,
        z.uuid().parse(p.id),
        req.nextUrl.origin,
      );
    else throw new Error("Unsupported action.");
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Please check the form values and try again."
            : safeError(e),
      },
      { status: 400 },
    );
  }
}
