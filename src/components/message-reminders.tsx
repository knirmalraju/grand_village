"use client";
import { PushSettings } from "./push-settings";
import Link from "next/link";
import { Bell, ArrowUpRight, MessageCircle, Check } from "lucide-react";
import { useVillage } from "./provider";
import { Empty, Heading } from "./ui";

export function useParentReminders() {
  const { data, uid, role } = useVillage();
  if (role !== "parent") return [];
  return data.bookings
    .filter(
      (b) =>
        b.parent_id === uid && ["accepted", "completed"].includes(b.status),
    )
    .map((b) => {
      const unread = data.messages.filter(
        (m) =>
          m.booking_id === b.id &&
          m.sender_id !== uid &&
          m.type === "chat" &&
          m.created_at > (data.readMarkers?.[uid + ":" + b.id] || ""),
      );
      return {
        booking: b,
        count: unread.length,
        host: data.hosts.find((h) => h.id === b.host_id),
        latest: unread.sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        )[0],
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
}
export function MessageReminderBanner() {
  const items = useParentReminders();
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <Link
      className="message-reminder-banner"
      href="/parent/notifications"
      role="status"
    >
      <span className="reminder-bell">
        <Bell size={19} />
      </span>
      <span>
        <b>
          {total === 1
            ? "Your host sent you a message"
            : `${total} unread messages from your village`}
        </b>
        <small>
          Stay in the loop. Your booking conversation has an update.
        </small>
      </span>
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function MessageReminders() {
  const items = useParentReminders();
  return (
    <>
      <Heading
        eyebrow="STAY CLOSE, EVEN WHEN YOU’RE AWAY"
        title="A little nudge from your village."
        description="New messages and photos from your senior hosts. Opening the conversation marks them as read."
      />
      <PushSettings />
      <div className="reminder-list">
        {items.map(({ booking, host, count, latest }) => (
          <Link
            className="reminder-card"
            key={booking.id}
            href={`/parent/messages?booking=${encodeURIComponent(booking.id)}`}
          >
            <span className="reminder-bell">
              <MessageCircle size={22} />
            </span>
            <div>
              <h3>{host?.name || "Your senior host"}</h3>
              <p>
                {count} unread {count === 1 ? "message" : "messages"}
                {latest.photo_url || latest.photo_path
                  ? " · Includes a photo"
                  : ""}
              </p>
              <small>
                {booking.service} ·{" "}
                {new Date(latest.created_at).toLocaleString()}
              </small>
            </div>
            <ArrowUpRight size={19} />
          </Link>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="You’re all caught up."
          description="We’ll remind you here when your host sends a new message or photo."
          action={
            <Link className="btn outline" href="/parent/messages">
              <Check size={16} />
              Open messages
            </Link>
          }
        />
      )}
    </>
  );
}
