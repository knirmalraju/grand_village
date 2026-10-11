"use client";
import { prepareChatPhoto } from "@/lib/chat-media";
import { BookingFeedback } from "./feedback";
import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Heart,
  BookOpen,
  MessageCircle,
  Wallet,
  Check,
  Leaf,
  Plus,
  Send,
  Star,
  Download,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Flower2,
  Users,
  Settings2,
  ImagePlus,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Booking, dateLabel, timeLabel, money, Host } from "@/lib/data";
import { useVillage } from "./provider";
import { Button, Badge, Heading, Empty, Arrow, Reveal } from "./ui";
export function BookingCard({
  booking,
  compact = false,
}: {
  booking: Booking;
  compact?: boolean;
}) {
  const { data, role } = useVillage();
  const host = data.hosts.find((h) => h.id === booking.host_id);
  return (
    <Link
      className={`booking-card ${compact ? "compact" : ""}`}
      href={`/bookings/${booking.id}`}
    >
      <img src={host?.image || "/images/eleanor.jpg"} alt="" />
      <div className="booking-card-main">
        <div className="booking-top">
          <h3>
            {role === "host"
              ? booking.parent_name || "Family booking"
              : host?.name || "Your host"}
          </h3>
          <Badge
            kind={
              booking.status === "requested"
                ? "warm"
                : booking.status === "completed"
                  ? "sage"
                  : ""
            }
          >
            {booking.status}
          </Badge>
        </div>
        <p>
          {booking.service} · {booking.child_age_range}
        </p>
        <div className="booking-meta">
          <span>
            <CalendarDays size={14} />
            {dateLabel(booking.starts_at)}
          </span>
          <span>
            <Clock size={14} />
            {timeLabel(booking.starts_at)} – {timeLabel(booking.ends_at)}
          </span>
        </div>
      </div>
      <div className="booking-card-right">
        <b>{money(booking.amount)}</b>
        <small>
          {booking.payment_status === "paid"
            ? "Paid"
            : booking.status === "accepted"
              ? "Payment due"
              : "After acceptance"}
        </small>
        <ArrowUpRight size={19} />
      </div>
    </Link>
  );
}
export function Dashboard() {
  const { data, role, uid, name } = useVillage();
  const bookings = data.bookings.filter((b) =>
    role === "host" ? b.host_id === uid : b.parent_id === uid,
  );
  const upcoming = bookings.filter((b) =>
    ["requested", "accepted"].includes(b.status),
  );
  const completed = bookings.filter((b) => b.status === "completed");
  const next = upcoming.find((b) => b.status === "accepted");
  const total = completed.reduce(
    (a, b) => a + (b.payment_status === "paid" ? b.amount : 0),
    0,
  );
  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> YOUR LITTLE CORNER OF THE VILLAGE
          </div>
          <h1>
            {role === "host" ? "Good to see you" : "Welcome back"}, {name}
            <span className="accent">.</span>
          </h1>
          <p>
            {role === "host"
              ? "A little time shared. A lasting difference made."
              : "A little less to juggle. A little more room for the good stuff."}
          </p>
        </div>
        <Button href={role === "host" ? "/host/schedule" : "/hosts"}>
          {role === "host" ? "Manage my time" : "Find a host"}{" "}
          <Plus size={17} />
        </Button>
      </div>
      <div className="stat-grid">
        {[
          [CalendarDays, upcoming.length, "Upcoming connections"],
          [Heart, completed.length, "Moments shared"],
          [
            role === "host" ? Wallet : Users,
            role === "host"
              ? money(total * 0.85)
              : new Set(bookings.map((b) => b.host_id)).size,
            role === "host" ? "Demo earnings" : "People in your village",
          ],
        ].map(([Icon, n, t], i) => {
          const I = Icon as typeof Heart;
          return (
            <Reveal className="stat-card" key={String(t)} delay={i * 0.05}>
              <span className={`stat-icon tone-${i}`}>
                <I size={22} />
              </span>
              <div>
                <b>{String(n)}</b>
                <span>{String(t)}</span>
              </div>
              <ArrowUpRight size={17} />
            </Reveal>
          );
        })}
      </div>
      {next && (
        <div className="next-banner">
          <div className="next-icon">
            <Leaf size={29} />
          </div>
          <div>
            <div className="eyebrow">SOMETHING TO LOOK FORWARD TO</div>
            <h3>
              {next.service} with{" "}
              {role === "host"
                ? "the family"
                : data.hosts
                    .find((h) => h.id === next.host_id)
                    ?.name.split(" ")[0]}
            </h3>
            <p>
              {dateLabel(next.starts_at)} · {timeLabel(next.starts_at)} –{" "}
              {timeLabel(next.ends_at)}
            </p>
          </div>
          <Button href={`/bookings/${next.id}`} variant="light">
            Open care hub <Arrow />
          </Button>
        </div>
      )}
      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <Heading
              title={
                role === "host"
                  ? "Your upcoming afternoons"
                  : "Your family’s care calendar"
              }
              action={
                <Link
                  className="text-link"
                  href={role === "host" ? "/host/schedule" : "/parent/bookings"}
                >
                  View all <ArrowUpRight size={15} />
                </Link>
              }
            />
            {upcoming.length ? (
              upcoming
                .slice(0, 3)
                .map((b) => <BookingCard key={b.id} booking={b} compact />)
            ) : (
              <Empty
                title="A little room in the calendar"
                description="Your upcoming bookings will appear here."
              />
            )}
          </section>
          <section className="panel">
            <Heading title="Little updates. Big peace of mind." />
            <div className="timeline">
              {data.messages
                .filter(
                  (m) =>
                    m.type === "update" &&
                    bookings.some((b) => b.id === m.booking_id),
                )
                .slice(-3)
                .reverse()
                .map((m) => (
                  <div className="timeline-item" key={m.id}>
                    <span>
                      <BookOpen size={16} />
                    </span>
                    <div>
                      <small>
                        {dateLabel(m.created_at)} · {timeLabel(m.created_at)}
                      </small>
                      <h4>An afternoon worth sharing</h4>
                      <p>{m.body}</p>
                      <Link
                        className="text-link"
                        href={`/bookings/${m.booking_id}`}
                      >
                        Open care hub <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
            {!data.messages.some(
              (m) =>
                m.type === "update" &&
                bookings.some((b) => b.id === m.booking_id),
            ) && <p>Care updates will appear here when a host shares them.</p>}
          </section>
        </div>
        <aside>
          <section className="panel lavender">
            <Heart size={26} />
            <h2>
              {role === "host"
                ? "Your experience matters."
                : "Your kind of people."}
            </h2>
            <p>
              {role === "host"
                ? "The stories you tell and the time you share make everyday moments a little more meaningful."
                : "Familiar faces make the next booking feel a little easier."}
            </p>
            {data.hosts.slice(0, 3).map((h) => (
              <Link href={`/hosts/${h.id}`} className="mini-host" key={h.id}>
                <img src={h.image} alt="" />
                <span>
                  <b>{h.name}</b>
                  <small>{h.tags[0]}</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </section>
          <section className="help-card">
            <Flower2 size={32} />
            <h3>A little help is always welcome.</h3>
            <p>
              Questions about your next step? Find guidance in our help center.
            </p>
            <Link href="/support" className="text-link">
              We’re here to help <Arrow />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
export function Bookings({ requests = false }: { requests?: boolean }) {
  const { data, role, uid } = useVillage();
  const [filter, setFilter] = useState(requests ? "requested" : "all");
  const all = data.bookings.filter((b) =>
    role === "host" ? b.host_id === uid : b.parent_id === uid,
  );
  const rows = all.filter(
    (b) =>
      filter === "all" ||
      (filter === "upcoming"
        ? ["accepted", "requested"].includes(b.status)
        : b.status === filter),
  );
  return (
    <>
      <Heading
        eyebrow={
          requests ? "A NEW CONNECTION STARTS HERE" : "YOUR SHARED MOMENTS"
        }
        title={requests ? "A little time. A new family." : "Your bookings"}
        description={
          requests
            ? "Review each request and choose what works for you."
            : "Every plan, conversation, and receipt, together in one place."
        }
        action={
          <Button href={role === "host" ? "/host/schedule" : "/hosts"}>
            {role === "host" ? "View schedule" : "Find a host"} <Arrow />
          </Button>
        }
      />
      <div className="tabs">
        {(requests
          ? ["requested", "accepted", "declined"]
          : ["all", "upcoming", "completed", "cancelled"]
        ).map((f) => (
          <button
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All bookings" : f}
          </button>
        ))}
      </div>
      <div className="panel">
        {rows.length ? (
          rows.map((b) => <BookingCard booking={b} key={b.id} />)
        ) : (
          <Empty
            title="Nothing here just yet"
            description="New bookings will appear here as your village grows."
          />
        )}
      </div>
    </>
  );
}
function Chat({ booking }: { booking: Booking }) {
  const { data, action, notify, uid, role } = useVillage();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = data.messages
    .filter((m) => m.booking_id === booking.id && m.type === "chat")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const latest = list.at(-1)?.id;
  useEffect(() => {
    const markRead = () => {
      if (!document.hidden)
        void action("read", { booking_id: booking.id }).catch(() => {});
    };
    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [booking.id, uid, latest]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !photo) || busy || processing) return;
    setBusy(true);
    try {
      await action("message", {
        booking_id: booking.id,
        body: text,
        type: "chat",
        photo_data: photo || undefined,
      });
      setText("");
      setPhoto(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat">
      <div className="chat-header">
        <span className="small-icon">
          <MessageCircle size={19} />
        </span>
        <div>
          <b>
            {role === "host"
              ? "Chat with the family"
              : `Chat with ${data.hosts.find((h) => h.id === booking.host_id)?.name.split(" ")[0] || "your host"}`}
          </b>
          <small>Booking group · Parent & senior host</small>
        </div>
      </div>
      <div className="chat-messages" aria-live="polite">
        {!list.length && (
          <p className="muted">
            Say hello. A good connection starts with a conversation.
          </p>
        )}
        {list.map((m) => (
          <div
            key={m.id}
            className={`message ${m.sender_id === uid ? "mine" : ""}`}
          >
            {m.photo_url && (
              <button
                className="chat-photo-button"
                onClick={() => setExpanded(m.photo_url!)}
                aria-label="View shared photo"
              >
                <img
                  className="chat-photo"
                  src={m.photo_url}
                  alt="Photo shared in this booking conversation"
                  loading="lazy"
                />
              </button>
            )}
            {m.photo_path && !m.photo_url && (
              <p className="tiny">
                Photo unavailable. Try refreshing the conversation.
              </p>
            )}
            {m.body && <p>{m.body}</p>}
            <small>
              {m.sender_id === uid
                ? "You"
                : role === "host"
                  ? "Parent"
                  : "Host"}{" "}
              · {timeLabel(m.created_at)}
            </small>
          </div>
        ))}
      </div>
      {photo && (
        <div className="chat-photo-preview">
          <img src={photo} alt="Photo ready to send" />
          <span>Photo ready to share</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Remove photo"
            disabled={busy}
            onClick={() => setPhoto(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <form onSubmit={send} className="chat-compose">
        <input
          ref={photoInput}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Attach a photo"
          disabled={busy || processing}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setProcessing(true);
            try {
              setPhoto(await prepareChatPhoto(file));
            } catch (error) {
              notify(
                error instanceof Error
                  ? error.message
                  : "This photo could not be opened.",
              );
            } finally {
              setProcessing(false);
            }
          }}
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Add photo"
          disabled={busy || processing}
          onClick={() => photoInput.current?.click()}
        >
          <ImagePlus size={20} />
        </button>
        <input
          aria-label="Message"
          placeholder="A little hello goes a long way…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button
          className="icon-button primary"
          aria-label="Send message"
          disabled={busy || processing || (!text.trim() && !photo)}
        >
          <Send size={18} />
        </button>
      </form>
      <p className="chat-attachment-hint">
        {processing
          ? "Preparing photo…"
          : "JPG, PNG or WebP · up to 5 MB · one photo per message"}
      </p>
      <Dialog.Root
        open={!!expanded}
        onOpenChange={(open) => {
          if (!open) setExpanded(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content photo-dialog">
            <Dialog.Title>Shared photo</Dialog.Title>
            <Dialog.Description>
              Visible to the participants in this booking.
            </Dialog.Description>
            {expanded && (
              <img src={expanded} alt="Shared booking photo at full size" />
            )}
            <Dialog.Close className="btn outline">Close photo</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
function Receipt({ booking, host }: { booking: Booking; host?: Host }) {
  const { mode, role } = useVillage();
  const fee = Math.round(booking.amount * 15) / 100;
  function download() {
    const body = `GrandVillage ${mode === "demo" ? "DEMO - NOT A REAL RECEIPT" : "payment summary"}\nBooking: ${booking.id}\nHost: ${host?.name}\nService: ${booking.service}\nDate: ${dateLabel(booking.starts_at)}\nTotal: ${money(booking.amount)}\nPlatform fee: ${money(fee)}\nHost earnings: ${money(booking.amount - fee)}\nPayment status: ${booking.payment_status}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    a.download = `${booking.id}-receipt.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="panel">
      <h3>
        {role === "host"
          ? "Your earnings breakdown"
          : "A clear little breakdown"}
      </h3>
      <div className="price-row">
        <span>Booking total</span>
        <b>{money(booking.amount)}</b>
      </div>
      <div className="price-row">
        <span>Platform fee (15%, included)</span>
        <span>{money(fee)}</span>
      </div>
      <div className="price-row">
        <span>Host earnings</span>
        <span>{money(booking.amount - fee)}</span>
      </div>
      <div className="price-row price-total">
        <b>{role === "host" ? "You receive" : "Parent total"}</b>
        <b>{money(role === "host" ? booking.amount - fee : booking.amount)}</b>
      </div>
      <Badge kind={booking.payment_status === "paid" ? "sage" : "warm"}>
        {booking.payment_status}
      </Badge>
      <p className="tiny">
        {mode === "demo"
          ? "Demo amounts only. No money moves. Payout is not initiated."
          : "Payment and bank payout are separate. Stripe is not yet configured."}
      </p>
      {booking.payment_status === "paid" && (
        <Button variant="outline full" onClick={download}>
          <Download size={16} /> Download{" "}
          {mode === "demo" ? "demo receipt" : "summary"}
        </Button>
      )}
    </div>
  );
}
export function BookingHub({ id }: { id: string }) {
  const { data, action, notify, role, mode, uid } = useVillage();
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const b = data.bookings.find((b) => b.id === id);
  const host = data.hosts.find((h) => h.id === b?.host_id);
  if (!b || !(role === "admin" || b.parent_id === uid || b.host_id === uid))
    return (
      <Empty
        title="Booking unavailable"
        description="This booking isn’t available to your current account."
        action={
          <Button href={role === "host" ? "/host" : "/parent"}>
            Go to dashboard
          </Button>
        }
      />
    );
  const booking = b;
  const confirmed = ["accepted", "completed"].includes(b.status);
  async function status(status: string) {
    setBusy(true);
    try {
      await action("status", { id, status });
      notify(`Booking ${status}. Both dashboards are updated.`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link
        href={role === "host" ? "/host/requests" : "/parent/bookings"}
        className="text-link"
      >
        ← Back to bookings
      </Link>
      <div className="hub-heading">
        <div>
          <div className="eyebrow">A SHARED PLAN · {b.id}</div>
          <h1>{b.service}, with a little heart.</h1>
          <p>
            {host?.name} & {b.parent_name || "your family"} ·{" "}
            {dateLabel(b.starts_at)}
          </p>
        </div>
        <Badge kind={b.status === "requested" ? "warm" : "sage"}>
          {b.status}
        </Badge>
      </div>
      <div className="booking-progress">
        {["Requested", "Accepted", "Paid", "Completed"].map((s, i) => {
          const active =
            i === 0 ||
            (i === 1 && confirmed) ||
            (i === 2 && b.payment_status === "paid") ||
            (i === 3 && b.status === "completed");
          return (
            <div key={s} className={active ? "done" : ""}>
              <span>{active ? <Check size={14} /> : i + 1}</span>
              {s}
            </div>
          );
        })}
      </div>
      {b.status === "requested" && (
        <div className="action-banner">
          <div>
            <b>
              {role === "host"
                ? "A family would love to spend time with you."
                : "Your request is with the host."}
            </b>
            <p>
              {role === "host"
                ? "Review the details below, then choose what works for you."
                : "You’ll be able to pay and message after acceptance."}
            </p>
          </div>
          {role === "host" && (
            <div className="button-row">
              <Button disabled={busy} onClick={() => void status("accepted")}>
                Accept request <Check size={16} />
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void status("declined")}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      )}
      {b.status === "accepted" &&
        b.payment_status !== "paid" &&
        role === "parent" && (
          <div className="action-banner">
            <div>
              <b>Your host said yes. Make it a date.</b>
              <p>
                {mode === "demo"
                  ? "Complete a simulated payment to explore the full flow."
                  : "Live checkout needs Stripe setup. No payment will be taken here."}
              </p>
            </div>
            <Button onClick={() => setPayOpen(true)}>
              {mode === "demo" ? "Demo checkout" : "View payment setup"}{" "}
              <Arrow />
            </Button>
          </div>
        )}
      <div className="tabs">
        {["Overview", "Messages", "Care updates", "Review"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="hub-grid">
        <div>
          {tab === "Overview" && (
            <>
              <section className="panel">
                <Heading title="The plan for your time together" />
                <div className="hub-details">
                  <div>
                    <CalendarDays />
                    <small>WHEN</small>
                    <b>{dateLabel(b.starts_at)}</b>
                    <span>
                      {timeLabel(b.starts_at)} – {timeLabel(b.ends_at)}
                    </span>
                  </div>
                  <div>
                    <BookOpen />
                    <small>YOUR ACTIVITY</small>
                    <b>{b.service}</b>
                    <span>{host?.neighborhood}</span>
                  </div>
                </div>
                <div className="host-intro">
                  <img src={host?.image || "/images/eleanor.jpg"} alt="" />
                  <div>
                    <b>{host?.name}</b>
                    <p>{host?.title}</p>
                  </div>
                  <Link className="text-link" href={`/hosts/${b.host_id}`}>
                    View profile <ArrowUpRight size={16} />
                  </Link>
                </div>
              </section>
              <section className="panel">
                <h3>Care, with a little context</h3>
                <Badge>
                  <ShieldCheck size={13} /> Private booking information
                </Badge>
                <p>
                  <b>Age range:</b> {b.child_age_range || "Not applicable"}
                </p>
                {confirmed || role === "parent" ? (
                  <p>{b.care_notes || "No additional care notes shared."}</p>
                ) : (
                  <p>Private care notes become available after acceptance.</p>
                )}
              </section>
              {b.status === "accepted" && b.payment_status === "paid" && (
                <div className="panel">
                  <h3>A lovely moment, wrapped up.</h3>
                  <p>
                    {mode === "demo"
                      ? "Simulate the end of this service to explore feedback."
                      : "After the service has ended, mark the booking complete to open feedback."}
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() => void status("completed")}
                  >
                    Mark complete <CheckCircle2 size={17} />
                  </Button>
                </div>
              )}
              {["requested", "accepted"].includes(b.status) &&
                b.payment_status !== "paid" && (
                  <Button
                    variant="outline"
                    onClick={() => void status("cancelled")}
                  >
                    Cancel unpaid request
                  </Button>
                )}
            </>
          )}
          {tab === "Messages" &&
            (confirmed ? (
              <div className="panel no-pad">
                <Chat key={b.id} booking={b} />
              </div>
            ) : (
              <Empty
                title="Say hello after acceptance"
                description="Your shared conversation opens when the host accepts."
              />
            ))}
          {tab === "Care updates" && (
            <section className="panel">
              <Heading
                title="The little moments, shared"
                description="Private text updates from your host."
              />
              {data.messages
                .filter((m) => m.booking_id === id && m.type === "update")
                .map((m) => (
                  <div className="care-update" key={m.id}>
                    <span className="small-icon">
                      <Leaf size={18} />
                    </span>
                    <div>
                      <small>
                        {dateLabel(m.created_at)} · {timeLabel(m.created_at)}
                      </small>
                      <p>{m.body}</p>
                    </div>
                  </div>
                ))}
              {!data.messages.some(
                (m) => m.booking_id === id && m.type === "update",
              ) && (
                <p>
                  No updates yet. They’ll appear here as your time together
                  unfolds.
                </p>
              )}
              {role === "host" && confirmed && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    try {
                      await action("message", {
                        booking_id: id,
                        body: f.get("body"),
                        type: "update",
                      });
                      form.reset();
                      notify("Care update shared.");
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  <label>
                    Share a little moment
                    <textarea
                      name="body"
                      required
                      maxLength={2000}
                      placeholder="What did you enjoy together today?"
                    />
                  </label>
                  <Button type="submit">
                    Share update <Send size={16} />
                  </Button>
                </form>
              )}
              <p className="tiny">
                Share photos in Messages. Video updates are planned for a later release.
              </p>
            </section>
          )}
          {tab === "Review" && <BookingFeedback booking={b} />}
        </div>
        <aside>
          <Receipt booking={b} host={host} />
          {confirmed && tab !== "Messages" && (
            <div className="panel no-pad">
              <Chat key={b.id} booking={b} />
            </div>
          )}
          <Link href="/support" className="help-card help-link">
            <ShieldCheck />
            <div>
              <b>Need a little support?</b>
              <p>We’ll help you find the next step.</p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        </aside>
      </div>
      <Dialog.Root open={payOpen} onOpenChange={setPayOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title>
              {mode === "demo" ? "A practice checkout." : "Secure checkout"}
            </Dialog.Title>
            <Dialog.Description>
              {mode === "demo"
                ? "This simulates a successful payment. No card details, real charges, or bank payouts."
                : "Continue to Stripe to pay securely. If payment setup is incomplete, your booking stays unpaid and no charge is made."}
            </Dialog.Description>
            <div className="checkout-total">{money(booking.amount)}</div>
            <p>
              {booking.service} with {host?.name}
            </p>
            <div className="button-row">
              <Button
                onClick={async () => {
                  try {
                    await action("pay", { id });
                    setPayOpen(false);
                    if (mode === "demo")
                      notify(
                        "Demo payment complete. No real money was charged.",
                      );
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                {mode === "demo" ? "Simulate payment" : "Continue to Stripe"}{" "}
                <Check size={17} />
              </Button>
              <Dialog.Close className="btn outline">Close</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export function Messages() {
  const search = useSearchParams();
  const { data, role, uid } = useVillage();
  const bookings = data.bookings.filter(
    (b) =>
      (role === "host" ? b.host_id === uid : b.parent_id === uid) &&
      ["accepted", "completed"].includes(b.status),
  );
  const [selected, setSelected] = useState(search.get("booking") || "");
  useEffect(() => {
    setSelected(search.get("booking") || "");
  }, [search]);
  const b = bookings.find((b) => b.id === selected) || bookings[0];
  return (
    <>
      <Heading
        eyebrow="KEEP THE CONVERSATION GOING"
        title="A little hello goes a long way."
        description="Your conversations, connected to each booking."
      />
      {!b ? (
        <Empty
          title="Your inbox is ready"
          description="Conversations open after a booking is accepted."
        />
      ) : (
        <div className="inbox panel no-pad">
          <div className="conversation-list">
            {bookings.map((x) => (
              <button
                className={x.id === b.id ? "active" : ""}
                key={x.id}
                onClick={() => setSelected(x.id)}
              >
                <img
                  src={
                    data.hosts.find((h) => h.id === x.host_id)?.image ||
                    "/images/eleanor.jpg"
                  }
                  alt=""
                />
                <span>
                  <b>
                    {role === "host"
                      ? "Family booking"
                      : data.hosts.find((h) => h.id === x.host_id)?.name}
                  </b>
                  <small>
                    {x.service} · {dateLabel(x.starts_at)}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <div>
            <div className="inbox-booking">
              <span>{b.id}</span>
              <Link href={`/bookings/${b.id}`} className="text-link">
                Open care hub <ArrowUpRight size={15} />
              </Link>
            </div>
            <Chat key={b.id} booking={b} />
          </div>
        </div>
      )}
    </>
  );
}
export function Schedule() {
  const { data, uid, action, notify } = useVillage();
  const [view, setView] = useState("Calendar");
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const rows = data.bookings.filter(
    (b) => b.host_id === uid && ["accepted", "requested"].includes(b.status),
  );
  return (
    <>
      <Heading
        eyebrow="TIME FOR THE THINGS YOU LOVE"
        title="Your schedule, your pace."
        description="A little room for family, community, and yourself."
      />
      <div className="schedule-grid">
        <section className="panel">
          <div className="calendar-toolbar">
            <h3>
              {month.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="button-row">
              <button
                className="icon-button"
                aria-label="Previous month"
                onClick={() => setOffset(offset - 1)}
              >
                ←
              </button>
              <button
                className="icon-button"
                aria-label="Next month"
                onClick={() => setOffset(offset + 1)}
              >
                →
              </button>
            </div>
          </div>
          <div className="tabs">
            {["Calendar", "List"].map((t) => (
              <button
                key={t}
                className={t === view ? "active" : ""}
                onClick={() => setView(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {view === "Calendar" ? (
            <div className="calendar">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <b className="day-label" key={d}>
                  {d}
                </b>
              ))}
              {Array.from({ length: month.getDay() }, (_, i) => (
                <div key={"blank" + i} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const day = i + 1;
                const bookings = rows.filter((b) => {
                  const d = new Date(b.starts_at);
                  return (
                    d.getFullYear() === month.getFullYear() &&
                    d.getMonth() === month.getMonth() &&
                    d.getDate() === day
                  );
                });
                return (
                  <div
                    key={day}
                    className={
                      day === now.getDate() && offset === 0 ? "today" : ""
                    }
                  >
                    <span>{day}</span>
                    {bookings.map((b) => (
                      <Link href={`/bookings/${b.id}`} key={b.id}>
                        {timeLabel(b.starts_at)}
                        <small>{b.service}</small>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            rows.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </section>
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (String(f.get("end")) <= String(f.get("start"))) {
              notify("End time must be after start time.");
              return;
            }
            try {
              await action("availability", {
                starts_at: new Date(
                  String(f.get("date")) + "T" + String(f.get("start")),
                ).toISOString(),
                ends_at: new Date(
                  String(f.get("date")) + "T" + String(f.get("end")),
                ).toISOString(),
              });
              notify("Available time saved.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <h3>Make a little time.</h3>
          <p>Add a date when you’re open to a new booking.</p>
          <label>
            Date
            <input type="date" name="date" required />
          </label>
          <label>
            From
            <input type="time" name="start" defaultValue="09:00" required />
          </label>
          <label>
            Until
            <input type="time" name="end" defaultValue="17:00" required />
          </label>
          <Button type="submit">
            Save availability <Plus size={16} />
          </Button>
          <div className="availability-list">
            {(data.availability || [])
              .filter((a) => a.host_id === uid)
              .map((a) => (
                <div key={a.id}>
                  <Badge kind="sage">Available</Badge>
                  <p>
                    {dateLabel(a.starts_at)}
                    <br />
                    {timeLabel(a.starts_at)} – {timeLabel(a.ends_at)}
                  </p>
                </div>
              ))}
          </div>
        </form>
      </div>
    </>
  );
}
export function Earnings() {
  const { data, uid, role, mode } = useVillage();
  const rows = data.bookings.filter(
    (b) =>
      (role === "host" ? b.host_id === uid : b.parent_id === uid) &&
      b.payment_status === "paid",
  );
  const gross = rows.reduce((n, b) => n + b.amount, 0);
  return (
    <>
      <Heading
        eyebrow="EVERY HOUR, A LITTLE DIFFERENCE"
        title={
          role === "host" ? "Your time, appreciated." : "Payments & receipts"
        }
        description={
          mode === "demo"
            ? "Demo amounts only. No actual charges or payouts."
            : "A clear record of your booking payments."
        }
      />
      <div className="stat-grid">
        {[
          ["Booking total", gross],
          ["Platform fee", gross * 0.15],
          ["Host earnings", gross * 0.85],
        ].map(([label, value]) => (
          <div className="stat-card" key={String(label)}>
            <Wallet />
            <div>
              <b>{money(Number(value))}</b>
              <span>{String(label)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="panel">
        <Heading title="Every connection, accounted for" />
        {rows.length ? (
          rows.map((b) => <BookingCard booking={b} key={b.id} />)
        ) : (
          <Empty
            title="A fresh beginning"
            description="Paid bookings will appear here."
          />
        )}
      </div>
      <div className="soft-note">
        <ShieldCheck />
        <span>
          {mode === "demo"
            ? "Demo payouts are not initiated."
            : "Stripe test checkout is available when configured. Bank payout setup is managed separately."}{" "}
          A completed payment does not mean money has reached a host’s bank
          account.
        </span>
      </div>
    </>
  );
}
export function Account() {
  const { name, role, mode, data, action, notify, uid } = useVillage();
  const host = data.hosts.find((h) => h.id === uid);
  return (
    <>
      <Heading
        eyebrow="YOUR PLACE IN THE VILLAGE"
        title={
          role === "host"
            ? "Tell your story."
            : "Your family, your preferences."
        }
        description="Keep the little details up to date."
      />
      <div className="account-grid">
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await action("profile", Object.fromEntries(f));
              notify("Your profile is saved.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <h3>{role === "host" ? "Host profile" : "Parent profile"}</h3>
          <label>
            Display name
            <input
              name="name"
              defaultValue={host?.name || name}
              required
              maxLength={80}
            />
          </label>
          <label>
            {role === "host" ? "Your story" : "Care preferences"}
            <textarea
              name="bio"
              defaultValue={host?.bio || ""}
              maxLength={2000}
            />
          </label>
          <label>
            Languages
            <input
              name="languages"
              defaultValue={host?.languages.join(", ") || "English"}
            />
          </label>
          {role === "host" && (
            <label>
              Hourly rate ($)
              <input
                type="number"
                name="rate"
                min="10"
                max="200"
                defaultValue={host?.rate || 24}
              />
            </label>
          )}
          <Button type="submit">
            Save changes <Check size={16} />
          </Button>
        </form>
        <div>
          <div className="panel">
            <h3>A little privacy goes a long way.</h3>
            {role === "parent" && (
              <p>
                <Link className="text-link" href="/parent/payments">
                  Payments &amp; receipts <ArrowUpRight size={16} />
                </Link>
              </p>
            )}
            <p>
              Keep children’s names and photos out of public profiles. Add only
              necessary care information inside a booking.
            </p>
            <Link className="text-link" href="/support#privacy">
              Privacy & support <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="panel">
            <h3>Your support cases</h3>
            {data.cases
              .filter((c) => c.user_id === uid)
              .map((c) => (
                <div className="case-row" key={c.id}>
                  <b>{c.subject}</b>
                  <Badge>{c.status}</Badge>
                  <p>{c.body}</p>
                  <small>{c.id}</small>
                </div>
              ))}
            {!data.cases.some((c) => c.user_id === uid) && (
              <p>No open cases. We’re here if you need a hand.</p>
            )}
            <Button href="/support" variant="outline">
              Get help
            </Button>
          </div>
          {mode === "demo" && (
            <div className="panel">
              <h3>A fresh demo</h3>
              <p>
                Reset fictional bookings, messages, and feedback in this
                browser.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset all local demo bookings, messages, and reviews?",
                    )
                  )
                    void action("reset", {}).then(() => notify("Demo reset."));
                }}
              >
                Reset demo data
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export function Admin({ tab }: { tab: string }) {
  const { data, action, notify, role, mode } = useVillage();
  if (role !== "admin")
    return (
      <Empty
        title="Admin access required"
        description="Use the labeled admin demo from the navigation, or sign in with an authorized account."
      />
    );
  const section = tab || "overview";
  return (
    <>
      <Heading
        eyebrow="A THOUGHTFUL VILLAGE STARTS HERE"
        title={
          {
            overview: "A clear view of your village.",
            users: "People make the place.",
            bookings: "Every shared plan.",
            payments: "The numbers, clearly.",
            support: "A little support goes a long way.",
          }[section] || "Village operations"
        }
        description={
          mode === "demo"
            ? "Demo administration · Changes affect fictional browser-local records only."
            : "Authorized administrative workspace."
        }
      />
      {section === "overview" && (
        <>
          <div className="stat-grid">
            {[
              ["Host profiles", data.hosts.length],
              ["Bookings", data.bookings.length],
              [
                "Open cases",
                data.cases.filter((c) => c.status === "open").length,
              ],
            ].map(([t, n]) => (
              <div className="stat-card" key={String(t)}>
                <Users />
                <div>
                  <b>{n}</b>
                  <span>{t}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3>Make room for good connections.</h3>
            <p>
              Review host listings, inspect bookings, and keep support moving.
              Verification and listing approval are separate decisions.
            </p>
            <div className="button-row">
              <Button href="/admin/users">
                Review hosts <Arrow />
              </Button>
              <Button href="/admin/support" variant="outline">
                Support cases
              </Button>
            </div>
          </div>
        </>
      )}
      {section === "users" && (
        <div className="panel">
          {data.hosts.map((h) => (
            <div className="admin-row" key={h.id}>
              <img src={h.image} alt="" />
              <div>
                <b>{h.name}</b>
                <small>
                  {h.services.join(", ")} ·{" "}
                  {mode === "demo"
                    ? "Demo only - not verified"
                    : "Verification not asserted"}
                </small>
              </div>
              <Badge>{h.approved ? "Listed" : "Hidden"}</Badge>
              <Button
                variant="outline"
                onClick={() =>
                  void action("approve", { id: h.id })
                    .then(() => notify("Listing visibility updated."))
                    .catch((e) => notify(e.message))
                }
              >
                {h.approved ? "Hide listing" : "Approve listing"}
              </Button>
            </div>
          ))}
        </div>
      )}
      {section === "bookings" && (
        <div className="panel">
          {data.bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
      {section === "payments" && (
        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Total</th>
                  <th>Host share</th>
                  <th>Payment</th>
                  <th>Payout</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/bookings/${b.id}`}>{b.id}</Link>
                    </td>
                    <td>{money(b.amount)}</td>
                    <td>{money(b.amount * 0.85)}</td>
                    <td>
                      <Badge>{b.payment_status}</Badge>
                    </td>
                    <td>Not initiated</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {section === "support" && (
        <div className="panel">
          {data.cases.length ? (
            data.cases.map((c) => (
              <div className="case-row" key={c.id}>
                <Badge>{c.status}</Badge>
                <h3>{c.subject}</h3>
                <p>{c.body}</p>
                <small>{c.id}</small>
                {c.status === "open" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void action("resolve", { id: c.id })
                        .then(() => notify("Case resolved."))
                        .catch((e) => notify(e.message))
                    }
                  >
                    Mark resolved
                  </Button>
                )}
              </div>
            ))
          ) : (
            <Empty
              title="A quiet inbox"
              description="New support cases will appear here."
            />
          )}
        </div>
      )}
    </>
  );
}
