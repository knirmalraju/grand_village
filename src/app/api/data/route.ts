import { NextRequest, NextResponse } from "next/server";
import { clientFor, safeError } from "@/lib/server";
export async function GET(req: NextRequest) {
  try {
    const { client, user } = await clientFor(req);
    const profile = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profile.error) throw new Error(profile.error.message);
    const results = await Promise.all(
      [
        "host_details",
        "bookings",
        "messages",
        "reviews",
        "support_cases",
        "saved_hosts",
        "availability",
        "read_receipts",
      ].map((t) => client.from(t).select("*")),
    );
    for (const r of results) if (r.error) throw new Error(r.error.message);
    const [
      hosts,
      bookings,
      messages,
      reviews,
      cases,
      saved,
      availability,
      reads,
    ] = results.map((r) => r.data || []);
    const details = await client.from("booking_private").select("*");
    if (details.error) throw new Error(details.error.message);
    return NextResponse.json({
      role: profile.data.role,
      name: profile.data.display_name.split(" ")[0],
      data: {
        hosts: hosts.map((h) => ({
          ...h,
          image: h.image || "/images/eleanor.jpg",
          tags: h.tags || [],
          title: h.title || "A little time, thoughtfully shared.",
        })),
        bookings: bookings.map((b) => ({
          ...b,
          care_notes:
            details.data.find((d) => d.booking_id === b.id)?.care_notes || "",
        })),
        messages: await Promise.all(
          messages.map(async (m) => {
            if (!m.photo_path) return m;
            const signed = await client.storage
              .from("chat-photos")
              .createSignedUrl(m.photo_path, 3600);
            return { ...m, photo_url: signed.data?.signedUrl };
          }),
        ),
        reviews,
        cases,
        availability,
        readMarkers: Object.fromEntries(
          reads.map((r) => [r.user_id + ":" + r.booking_id, r.read_at]),
        ),
        saved: saved.map((s) => s.host_id),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
