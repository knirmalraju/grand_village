"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import {
  Star,
  ArrowUpRight,
  MessageSquareHeart,
  Check,
  ShieldCheck,
  X,
  Feather,
  CalendarDays,
} from "lucide-react";
import { useVillage } from "./provider";
import { Button, Empty } from "./ui";
import type { Booking, Review } from "@/lib/data";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="feedback-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          aria-hidden="true"
          fill={n <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}
const sessionDate = (b: Booking) =>
  new Date(b.starts_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export function FeedbackComposer({
  booking,
  onSaved,
}: {
  booking: Booking;
  onSaved?: () => void;
}) {
  const { action, notify } = useVillage();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels = ["", "Poor", "Fair", "Good", "Very good", "Wonderful"];
  return (
    <form
      className="feedback-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!rating || body.trim().length < 5) {
          setError("Choose a rating and write at least 5 characters.");
          return;
        }
        setBusy(true);
        setError("");
        try {
          await action("review", {
            booking_id: booking.id,
            rating,
            body: body.trim(),
          });
          notify("Your feedback has been shared. Thank you.");
          onSaved?.();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset className="rating-field" disabled={busy}>
        <legend>How was your experience?</legend>
        <div className="rating-options">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? "selected" : ""}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                required
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              />
              <Star
                size={32}
                fill={n <= rating ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </label>
          ))}
        </div>
        <span className="rating-description" aria-live="polite">
          {labels[rating] || "Select your rating"}
        </span>
      </fieldset>
      <label htmlFor={`feedback-${booking.id}`}>
        Tell us about your time together
      </label>
      <textarea
        id={`feedback-${booking.id}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        minLength={5}
        maxLength={1000}
        required
        disabled={busy}
        placeholder="What went well? Was there anything that could have been better?"
        rows={5}
      />
      <div className="feedback-form-meta">
        <span>Honest, thoughtful feedback makes a difference.</span>
        <span>{body.length}/1,000</span>
      </div>
      <p className="feedback-privacy">
        <ShieldCheck size={16} /> Shared with your host and village support.
        Please leave out children’s names and private care details.
      </p>
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Sharing…" : "Share feedback"}
        <ArrowUpRight size={16} />
      </Button>
    </form>
  );
}

function ReviewBody({ review }: { review: Review }) {
  return (
    <div className="feedback-written">
      <Stars rating={review.rating} />
      <blockquote>{review.body}</blockquote>
      <span className="feedback-saved">
        <Check size={14} /> Feedback shared
      </span>
    </div>
  );
}

export function BookingFeedback({ booking }: { booking: Booking }) {
  const { data, role, uid } = useVillage();
  const review = data.reviews.find(
    (r) => r.booking_id === booking.id && r.reviewer_id === booking.parent_id,
  );
  return (
    <section className="panel">
      <div className="eyebrow">A MOMENT TO REFLECT</div>
      <h2>A few words can mean a lot.</h2>
      {review ? (
        <ReviewBody review={review} />
      ) : booking.status !== "completed" ? (
        <p>Feedback opens after the booking is completed.</p>
      ) : role === "parent" && booking.parent_id === uid ? (
        <FeedbackComposer booking={booking} />
      ) : (
        <p>The parent hasn’t shared feedback for this booking yet.</p>
      )}
    </section>
  );
}

export function Feedback() {
  const { data, role, uid } = useVillage();
  const reduced = useReducedMotion();
  const hostView = role === "host";
  const [tab, setTab] = useState<"pending" | "shared">("pending");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [hostFilter, setHostFilter] = useState("all");
  const bookings = data.bookings
    .filter(
      (b) =>
        b.status === "completed" &&
        (hostView ? b.host_id === uid : b.parent_id === uid),
    )
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const reviewFor = (b: Booking) =>
    data.reviews.find(
      (r) => r.booking_id === b.id && r.reviewer_id === b.parent_id,
    );
  const pending = bookings.filter((b) => !reviewFor(b));
  const shared = bookings.filter((b) => reviewFor(b));
  const average = shared.length
    ? (
        shared.reduce((sum, b) => sum + reviewFor(b)!.rating, 0) / shared.length
      ).toFixed(1)
    : "—";
  const showingShared = hostView || tab === "shared";
  const displayed = (showingShared ? shared : pending).filter(
    (b) => hostFilter === "all" || b.host_id === hostFilter,
  );
  const availableHosts = data.hosts.filter((h) =>
    bookings.some((b) => b.host_id === h.id),
  );
  return (
    <div className="feedback-page">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">THE PEOPLE WHO MAKE A DIFFERENCE</div>
          <h1>
            {hostView
              ? "Kind words. Real impact."
              : "Your voice, a better village."}
          </h1>
          <p>
            {hostView
              ? "Thoughtful reflections from the families you’ve spent time with."
              : "Reflect on your time together and help your senior host grow."}
          </p>
        </div>
        <span className="feedback-heading-icon">
          <MessageSquareHeart size={27} />
        </span>
      </div>
      <section className="feedback-banner">
        <div>
          <span className="eyebrow">A LITTLE GRATITUDE GOES A LONG WAY</span>
          <h2>
            Good care deserves
            <br />
            <em>a few thoughtful words.</em>
          </h2>
          <p>
            Celebrate what worked. Share what could be better.
            <br />
            Every experience is worth listening to.
          </p>
        </div>
        <div className="feedback-seal" aria-hidden="true">
          <Feather size={38} strokeWidth={1} />
          <span>
            THOUGHTFULLY
            <br />
            SHARED
          </span>
        </div>
      </section>
      <div className="feedback-metrics">
        <div>
          <span className="feedback-metric-icon">
            <MessageSquareHeart size={21} />
          </span>
          <div>
            <b>{shared.length}</b>
            <span>{hostView ? "Reviews received" : "Feedback shared"}</span>
          </div>
        </div>
        <div>
          <span className="feedback-metric-icon gold">
            <Star size={21} />
          </span>
          <div>
            <b>
              {average}
              <small> / 5</small>
            </b>
            <span>
              {hostView ? "Your average rating" : "Average rating you’ve given"}
            </span>
          </div>
        </div>
        <div>
          <span className="feedback-metric-icon sage">
            <CalendarDays size={21} />
          </span>
          <div>
            <b>{hostView ? bookings.length : pending.length}</b>
            <span>
              {hostView
                ? "Completed connections"
                : "Experiences awaiting feedback"}
            </span>
          </div>
        </div>
      </div>
      <div className="feedback-toolbar">
        {hostView ? (
          <h2>From your families</h2>
        ) : (
          <div className="feedback-tabs" aria-label="Feedback views">
            {(
              [
                ["pending", "Awaiting feedback", pending.length],
                ["shared", "Shared feedback", shared.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                aria-pressed={tab === value}
                className={tab === value ? "active" : ""}
                onClick={() => setTab(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
        {!hostView && (
          <label className="feedback-filter">
            <span className="sr-only">Filter by senior host</span>
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
            >
              <option value="all">All senior hosts</option>
              {availableHosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="feedback-layout">
        <div className="feedback-list">
          {displayed.map((b, i) => {
            const host = data.hosts.find((h) => h.id === b.host_id);
            const review = reviewFor(b);
            return (
              <motion.article
                key={b.id}
                className="feedback-card"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.24) }}
              >
                <div className="feedback-card-top">
                  {hostView ? (
                    <span className="feedback-parent-avatar" aria-hidden="true">
                      {(b.parent_name || "Parent")[0]}
                    </span>
                  ) : (
                    <img src={host?.image || "/images/eleanor.jpg"} alt="" />
                  )}
                  <div>
                    <span className="feedback-kicker">
                      {hostView ? "PARENT FEEDBACK" : "YOUR SENIOR HOST"}
                    </span>
                    <h3>
                      {hostView
                        ? b.parent_name || "Parent"
                        : host?.name || "Senior host"}
                    </h3>
                    <p>
                      {b.service} · {sessionDate(b)}
                    </p>
                  </div>
                  <span className="feedback-complete">
                    <Check size={12} /> Completed
                  </span>
                </div>
                {review ? (
                  <ReviewBody review={review} />
                ) : (
                  <div className="feedback-invitation">
                    <p>
                      How was your time with{" "}
                      {host?.name.split(" ")[0] || "your host"}?
                    </p>
                    <Button onClick={() => setSelected(b)}>
                      Write feedback
                      <Feather size={16} />
                    </Button>
                  </div>
                )}
                <Link
                  className="feedback-booking-link"
                  href={`/bookings/${b.id}`}
                >
                  View booking <ArrowUpRight size={13} />
                </Link>
              </motion.article>
            );
          })}
          {!displayed.length && (
            <div className="feedback-empty">
              <MessageSquareHeart size={36} strokeWidth={1} />
              <Empty
                title={
                  showingShared
                    ? "Your story is still unfolding."
                    : "You’re all caught up."
                }
                description={
                  showingShared
                    ? "Shared feedback will appear here after a parent reviews a completed booking."
                    : "Completed bookings that need your feedback will appear here."
                }
                action={
                  <Button
                    href={hostView ? "/host/requests" : "/parent/bookings"}
                    variant="outline"
                  >
                    View bookings
                  </Button>
                }
              />
            </div>
          )}
        </div>
        <aside className="feedback-guide">
          <span className="eyebrow">A THOUGHTFUL NOTE</span>
          <h2>
            Honest words.
            <br />
            <em>Lasting connections.</em>
          </h2>
          <p>The most helpful feedback is specific, balanced, and kind.</p>
          <div>
            <span>01</span>
            <p>Share a moment that stood out.</p>
          </div>
          <div>
            <span>02</span>
            <p>Let your host know what worked well.</p>
          </div>
          <div>
            <span>03</span>
            <p>Suggest what could improve next time.</p>
          </div>
          <Link href="/support">
            Need help with a concern? <ArrowUpRight size={14} />
          </Link>
          <small>For sensitive concerns, contact support directly.</small>
        </aside>
      </div>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content feedback-dialog">
            <Dialog.Close
              className="feedback-dialog-close"
              aria-label="Close feedback"
            >
              <X size={20} />
            </Dialog.Close>
            <span className="eyebrow">YOUR EXPERIENCE MATTERS</span>
            <Dialog.Title>A few words, a lasting impact.</Dialog.Title>
            <Dialog.Description>
              {selected
                ? `${selected.service} with ${data.hosts.find((h) => h.id === selected.host_id)?.name || "your senior host"} · ${sessionDate(selected)}`
                : ""}
            </Dialog.Description>
            {selected && (
              <FeedbackComposer
                key={selected.id}
                booking={selected}
                onSaved={() => {
                  setSelected(null);
                  setTab("shared");
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
