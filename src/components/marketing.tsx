"use client";
import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Heart,
  Leaf,
  Utensils,
  Car,
  ShoppingBasket,
  Palette,
  MapPin,
  CalendarDays,
  Search,
  Check,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Flower2,
  Users,
  ChevronDown,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Host, services, money } from "@/lib/data";
import { useVillage } from "./provider";
import { Button, Reveal, Heading, HostCard, Badge, Empty, Arrow } from "./ui";
import { supabase } from "@/lib/supabase";
import {
  PremiumHero,
  ConnectionStatement,
  ScrollJourney,
} from "./premium-home";
import { Parallax } from "./home-depth";
const VillageScene = dynamic(() => import("./village-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-fallback">
      ⌂<span>A place to belong.</span>
    </div>
  ),
});
const categoryIcons = [BookOpen, Heart, Utensils, Car, ShoppingBasket, Palette];
export function Home() {
  const { data } = useVillage();
  const [service, setService] = useState("Childcare");
  const [area, setArea] = useState("");
  const [scene, setScene] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    setScene(!reduced && !motionPaused);
  }, [reduced, motionPaused]);
  return (
    <div className="premium-home">
      <PremiumHero
        enabled={scene}
        paused={motionPaused}
        reduced={!!reduced}
        onToggle={() => setMotionPaused(!motionPaused)}
      />
      <ConnectionStatement enabled={scene} />
      <Reveal className="container search-wrap">
        <form
          className="home-search"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/hosts?service=${encodeURIComponent(service)}&area=${encodeURIComponent(area)}`;
          }}
        >
          <div className="search-field">
            <BookOpen />
            <label>
              I’m looking for
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="search-field">
            <MapPin />
            <label>
              In my neighborhood
              <input
                placeholder="Neighborhood or city"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>
          </div>
          <div className="search-field">
            <CalendarDays />
            <label>
              A time that works
              <span className="search-helper">
                Choose a host to see availability
              </span>
            </label>
          </div>
          <Button type="submit">
            Find a host <Search size={18} />
          </Button>
        </form>
        <p className="search-foot">
          <Leaf size={14} /> Thoughtful connections, at your pace. Browse first.
          Get to know each other.
        </p>
      </Reveal>
      <div className="values-strip">
        <div className="container">
          <span>
            <Users /> Real people, meaningful connections
          </span>
          <span>
            <Heart /> Care that feels personal
          </span>
          <span>
            <ShieldCheck /> Thoughtful about your privacy
          </span>
        </div>
      </div>
      <ScrollJourney enabled={scene} />
      <section className="container section">
        <Heading
          eyebrow="A LITTLE SOMETHING FOR EVERY FAMILY"
          title="Everyday help. Extraordinary people."
          description="From after-school stories to recipes worth passing down."
        />
        <div className="category-grid">
          {services.map((s, i) => {
            const Icon = categoryIcons[i];
            return (
              <Link
                href={`/hosts?service=${s}`}
                className={`category category-${i}`}
                key={s}
              >
                <Icon size={26} />
                <span>{s}</span>
                <ArrowUpRight size={17} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="hosts-section">
        <div className="container section">
          <Heading
            eyebrow="MEET YOUR NEXT FAVORITE PERSON"
            title="Good company is closer than you think."
            description="A few friendly faces from our example village. Who feels like your kind of person?"
            action={
              <Link className="text-link" href="/hosts">
                Explore all hosts <Arrow />
              </Link>
            }
          />
          <div className="host-grid">
            {data.hosts
              .filter((h) => h.approved)
              .slice(0, 3)
              .map((h, i) => (
                <HostCard host={h} index={i} key={h.id} />
              ))}
          </div>
          <p className="disclosure">
            Meet our fictional demo hosts. Profiles and service availability are
            illustrative.
          </p>
        </div>
      </section>
      <section id="how-it-works" className="container section how-section">
        <div className="how-heading">
          <div className="eyebrow">FROM HELLO TO PART OF THE FAMILY</div>
          <h2>
            A connection starts
            <br />
            with something <em>simple.</em>
          </h2>
          <p>
            You choose the people and the pace.
            <br />
            We bring the pieces together.
          </p>
          <Link href="/hosts" className="text-link">
            Let’s find your village <Arrow />
          </Link>
          <Parallax enabled={scene} className="village-parallax">
            <div className="scene-wrap">
              {scene ? (
                <VillageScene />
              ) : (
                <div className="scene-fallback">
                  ⌂<span>A place to belong.</span>
                </div>
              )}
              <small>
                A little village, a lot of possibility.{" "}
                {scene && (
                  <span className="scene-drag-hint">Drag to explore.</span>
                )}
              </small>
            </div>
          </Parallax>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Find a familiar kind of person",
              "Explore interests, experience, languages, and schedules. Find someone who feels right for your family.",
            ],
            [
              "02",
              "Make a plan, together",
              "Request a time. Your host accepts, then you confirm with payment. One shared booking keeps everyone in the loop.",
            ],
            [
              "03",
              "Let the good moments grow",
              "Stay connected through messages and care updates. Share feedback, book again, and build something lasting.",
            ],
          ].map(([n, t, d]) => (
            <Reveal className="step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container">
        <div className="join-banner">
          <div className="eyebrow">YOUR EXPERIENCE HAS A PLACE HERE</div>
          <h2>
            More stories to share.
            <br />
            <em>More people to share them with.</em>
          </h2>
          <p>
            Bring your skills, your time, and your wonderfully unique self.
            <br />
            Become a senior host and help a neighborhood feel like home.
          </p>
          <Button href="/join" variant="light">
            Find your next chapter <ArrowUpRight size={18} />
          </Button>
          <Flower2 className="banner-flower" strokeWidth={0.7} />
        </div>
      </section>
      <section className="container section faq-section">
        <Heading
          eyebrow="A FEW THINGS YOU MIGHT WONDER"
          title="A little clarity before you begin."
        />
        <FAQ />
      </section>
    </div>
  );
}
export function FAQ() {
  return (
    <div className="faq">
      {[
        [
          "Who can become a senior host?",
          "Senior adults who want to share their time and skills can apply. Real service access will require our approval and vetting process. Current profiles are fictional demo examples.",
        ],
        [
          "How do I find the right person?",
          "Start with a service, then filter by language, neighborhood, and budget. Read the host’s story and experience, and choose a time that works for you.",
        ],
        [
          "How do bookings and payments work?",
          "Send a request, wait for host acceptance, then pay. The current demo simulates payments without charging money. Live Stripe payments require separate configuration.",
        ],
        [
          "How is my family’s information shared?",
          "There are no public child profiles. Necessary care details stay attached to the booking and are shared only with its confirmed host.",
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <ChevronDown size={20} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export function Directory() {
  const { data, mode } = useVillage();
  const params = useSearchParams();
  const [service, setService] = useState(
    params.get("service") || "All services",
  );
  const [language, setLanguage] = useState("Any language");
  const [area, setArea] = useState(params.get("area") || "");
  const [rate, setRate] = useState(50);
  const [sort, setSort] = useState("Recommended");
  const [savedOnly, setSavedOnly] = useState(false);
  let result = data.hosts.filter(
    (h) =>
      h.approved &&
      (!savedOnly || data.saved.includes(h.id)) &&
      (service === "All services" || h.services.includes(service)) &&
      (language === "Any language" || h.languages.includes(language)) &&
      (!area ||
        `${h.name} ${h.neighborhood}`
          .toLowerCase()
          .includes(area.toLowerCase())) &&
      h.rate <= rate,
  );
  if (sort === "Price: low to high")
    result = [...result].sort((a, b) => a.rate - b.rate);
  return (
    <div className="container directory">
      <div className="eyebrow">YOUR PEOPLE ARE OUT THERE</div>
      <h1>
        Find a little help.
        <br />
        <em>Discover a real connection.</em>
      </h1>
      <p className="lead">
        Meet senior hosts with time to share and stories to tell.
      </p>
      <div className="directory-layout">
        <aside className="filter-panel">
          <h3>
            <SlidersHorizontal size={18} /> A good fit for you
          </h3>
          <label>
            Service
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              {["All services", ...services].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Neighborhood or name
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Try Maplewood"
            />
          </label>
          <label>
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {["Any language", "English", "Spanish", "French"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Hourly budget <b>{money(rate)}</b>
            <input
              type="range"
              min="15"
              max="50"
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
            />
            <span className="range-label">
              <span>$15</span>
              <span>$50</span>
            </span>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />
            Only saved hosts
          </label>
          <button
            className="text-link"
            onClick={() => {
              setService("All services");
              setLanguage("Any language");
              setRate(50);
              setArea("");
              setSavedOnly(false);
            }}
          >
            Reset filters
          </button>
          <div className="filter-note">
            <Heart size={22} />
            <b>The best fit is personal.</b>
            <p>
              Look for shared interests and a style that feels right for your
              family.
            </p>
          </div>
        </aside>
        <div>
          <div className="results-bar">
            <span>
              <b>{result.length} hosts</b> to get to know
            </span>
            <label className="sort-label">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Recommended</option>
                <option>Price: low to high</option>
              </select>
            </label>
          </div>
          <div className="directory-grid">
            {result.map((h, i) => (
              <HostCard key={h.id} host={h} index={i} />
            ))}
          </div>
          {!result.length && (
            <Empty
              title="A different search might help"
              description="Try another neighborhood, a wider budget, or fewer filters."
            />
          )}
          <p className="disclosure">
            {mode === "demo"
              ? "Demo profiles · No real services or verification claims."
              : "Only approved host listings are shown."}{" "}
            Availability is checked when you request a slot.
          </p>
        </div>
      </div>
    </div>
  );
}
export function Profile({ id }: { id: string }) {
  const { data, action, notify, mode, role } = useVillage();
  const router = useRouter();
  const host = data.hosts.find((h) => h.id === id);
  const [busy, setBusy] = useState(false);
  if (!host)
    return (
      <div className="container section">
        <Empty
          title="This host isn’t available"
          description="Explore the directory to find another person for your village."
          action={<Button href="/hosts">Find a host</Button>}
        />
      </div>
    );
  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const start = new Date(
        String(f.get("date")) + "T" + String(f.get("time")),
      );
      const end = new Date(
        start.getTime() + Number(f.get("duration")) * 3600000,
      );
      const result = await action("book", {
        host_id: id,
        service: f.get("service"),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        child_age_range: f.get("age"),
        care_notes: f.get("notes"),
      });
      notify("Request sent. Your host will review it next.");
      router.push(`/bookings/${result}`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container profile-page">
      <Link href="/hosts" className="text-link">
        ← Back to your village
      </Link>
      <div className="profile-cover">
        <img src={host.image} alt={host.name} />
        <div>
          <div className="eyebrow">
            A FAMILIAR FACE IN {host.neighborhood.toUpperCase()}
          </div>
          <h1>
            Meet {host.name.split(" ")[0]}
            <span className="accent">.</span>
          </h1>
          <p className="profile-tagline">{host.title}</p>
          <div className="tags">
            <Badge>
              <MapPin size={13} />
              {host.neighborhood}
            </Badge>
            <Badge>{host.languages.join(" & ")}</Badge>
            <Badge kind="warm">
              {mode === "demo"
                ? "Demo only · Not verified"
                : "Approved listing"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="profile-layout">
        <div>
          <section className="panel">
            <h2>A little about me</h2>
            <p className="large-copy">{host.bio}</p>
            <h3>What we could do together</h3>
            <div className="service-pills">
              {host.services.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <h3>My kind of afternoon</h3>
            <div className="interest-grid">
              {host.tags.map((t, i) => (
                <div key={t}>
                  {i === 0 ? <BookOpen /> : i === 1 ? <Leaf /> : <Heart />}
                  <b>{t}</b>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Good to know</h2>
            <div className="info-row">
              <Clock />
              <div>
                <b>Make a plan that works for both of you</b>
                <p>
                  Choose a preferred time. Your booking is confirmed only after
                  host acceptance and payment.
                </p>
              </div>
            </div>
            <div className="info-row">
              <ShieldCheck />
              <div>
                <b>Clear expectations, thoughtful sharing</b>
                <p>
                  Keep coordination in the booking. Private care notes are
                  shared only after acceptance.
                </p>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Stories from families</h2>
            {data.reviews
              .filter(
                (r) =>
                  data.bookings.find((b) => b.id === r.booking_id)?.host_id ===
                  id,
              )
              .map((r) => (
                <div className="review" key={r.id}>
                  <span className="stars">{"★".repeat(r.rating)}</span>
                  <p>{r.body}</p>
                  <small>
                    Completed booking {mode === "demo" ? "· Demo feedback" : ""}
                  </small>
                </div>
              ))}
            {!data.reviews.some(
              (r) =>
                data.bookings.find((b) => b.id === r.booking_id)?.host_id ===
                id,
            ) && (
              <p>No reviews yet. Feedback appears after a completed booking.</p>
            )}
          </section>
        </div>
        <aside>
          <form className="panel booking-form" onSubmit={book}>
            <div className="rate">
              <b>{money(host.rate)}</b>
              <span> / hour</span>
            </div>
            <p>A little time together starts here.</p>
            {mode === "live" && (
              <div className="availability-list">
                <b>Published availability</b>
                {(data.availability || [])
                  .filter(
                    (a) => a.host_id === id && new Date(a.ends_at) > new Date(),
                  )
                  .map((a) => (
                    <p key={a.id}>
                      {new Date(a.starts_at).toLocaleString()} –{" "}
                      {new Date(a.ends_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  ))}
                {!(data.availability || []).some(
                  (a) => a.host_id === id && new Date(a.ends_at) > new Date(),
                ) && <p>No future slots published yet.</p>}
              </div>
            )}
            <label>
              Service
              <select name="service">
                {host.services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Date
                <input
                  required
                  type="date"
                  name="date"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </label>
              <label>
                Start time
                <input required name="time" type="time" defaultValue="15:00" />
              </label>
            </div>
            <label>
              How long?
              <select name="duration">
                {[1, 2, 3, 4].map((n) => (
                  <option value={n} key={n}>
                    {n} hour{n > 1 ? "s" : ""} · {money(n * host.rate)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Child’s age range (if relevant)
              <select name="age">
                <option>Not applicable</option>
                <option>3–5 years</option>
                <option>6–8 years</option>
                <option>9–12 years</option>
              </select>
            </label>
            <label>
              A note for your host
              <textarea
                name="notes"
                maxLength={1000}
                placeholder="Interests, preferences, or something that helps us plan…"
              />
            </label>
            <Button type="submit" disabled={busy || role !== "parent"}>
              {busy ? "Sending…" : "Request a little time"} <Arrow />
            </Button>
            <small>You won’t be charged now. Pay after acceptance.</small>
            {role !== "parent" && (
              <p className="error">
                Switch to the parent view to request a booking.
              </p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
export function Login() {
  const { demo, notify, refresh } = useVillage();
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [role, setRole] = useState<"parent" | "host">("parent");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")),
      password = String(f.get("password"));
    try {
      localStorage.setItem("gv-mode", "live");
      const { data, error } = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role, display_name: f.get("name") },
              emailRedirectTo: window.location.origin + "/login",
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) {
        notify("Check your email to confirm your account before signing in.");
        return;
      }
      await refresh();
      router.push(role === "host" ? "/host" : "/parent");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container">
      <div className="auth-story">
        <span className="eyebrow">WELCOME TO YOUR VILLAGE</span>
        <h1>
          A familiar feeling.
          <br />
          <em>A fresh beginning.</em>
        </h1>
        <img src="/images/hero.jpg" alt="Generations sharing time together" />
        <p>Good people. Shared stories. A place to belong.</p>
      </div>
      <div className="auth-form panel">
        <h2>{signup ? "Find your place here." : "Lovely to see you."}</h2>
        <p>
          {signup
            ? "Create your GrandVillage account."
            : "Sign in to pick up where you left off."}
        </p>
        <div className="segmented">
          <button
            className={role === "parent" ? "active" : ""}
            onClick={() => setRole("parent")}
          >
            I’m a parent
          </button>
          <button
            className={role === "host" ? "active" : ""}
            onClick={() => setRole("host")}
          >
            I’m a senior host
          </button>
        </div>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Your name
              <input name="name" required autoComplete="name" />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create account" : "Sign in"}{" "}
            <Arrow />
          </Button>
        </form>
        <button
          className="text-link auth-toggle"
          onClick={() => setSignup(!signup)}
        >
          {signup
            ? "Already part of the village? Sign in"
            : "New here? Create an account"}
        </button>
        <Link href="/reset-password" className="text-link">
          Forgot your password?
        </Link>
        <div className="demo-login">
          <b>Just taking a look?</b>
          <p>Explore with fictional profiles. No account needed.</p>
          <div className="button-row">
            <Button
              variant="outline"
              onClick={() => {
                demo("parent");
                router.push("/parent");
              }}
            >
              Parent demo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                demo("host");
                router.push("/host");
              }}
            >
              Host demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export function ResetPassword() {
  const { notify } = useVillage();
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <div className="narrow section">
      <div className="panel">
        <h1>{recovery ? "A fresh start." : "Let’s get you back in."}</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const { error } = recovery
              ? await supabase.auth.updateUser({
                  password: String(f.get("password")),
                })
              : await supabase.auth.resetPasswordForEmail(
                  String(f.get("email")),
                  { redirectTo: window.location.origin + "/reset-password" },
                );
            notify(
              error
                ? error.message
                : recovery
                  ? "Password updated. You can now sign in."
                  : "If an account exists, a reset link is on its way.",
            );
          }}
        >
          <label>
            {recovery ? "New password" : "Email address"}
            <input
              name={recovery ? "password" : "email"}
              type={recovery ? "password" : "email"}
              required
              minLength={recovery ? 8 : undefined}
            />
          </label>
          <Button type="submit">
            {recovery ? "Update password" : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
export function Join() {
  const { action, notify, mode } = useVillage();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState({
    name: "",
    bio: "",
    rate: "24",
    languages: "English",
    services: "Childcare",
    day: "Monday",
    start: "09:00",
    end: "17:00",
  });
  const fields = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setValues({ ...values, [key]: e.target.value }),
  });
  return (
    <div className="container join-page">
      <div className="eyebrow">THERE’S A PLACE FOR YOUR EXPERIENCE</div>
      <h1>
        Your next chapter
        <br />
        starts with <em>hello.</em>
      </h1>
      <p className="lead">
        Share a little about yourself. We’ll take it one step at a time.
      </p>
      <div className="onboarding">
        <div className="onboarding-steps">
          {["About you", "Services & rates", "Availability", "Next steps"].map(
            (s, i) => (
              <div
                className={i === step ? "active" : i < step ? "complete" : ""}
                key={s}
              >
                <span>{i < step ? <Check size={16} /> : i + 1}</span>
                {s}
              </div>
            ),
          )}
        </div>
        <div className="panel">
          {done ? (
            <Empty
              title="Your story is taking shape."
              description={
                mode === "demo"
                  ? "Your demo profile is saved in this browser. For a real application, create a host account and complete onboarding after database setup."
                  : "Your profile is saved for review. Approval and verification are separate steps before your listing goes public."
              }
              action={
                <Button href={mode === "demo" ? "/login" : "/host"}>
                  {mode === "demo"
                    ? "Create a real account"
                    : "Go to dashboard"}{" "}
                  <Arrow />
                </Button>
              }
            />
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (step < 3) {
                  setStep(step + 1);
                  return;
                }
                try {
                  await action("host_onboard", values);
                  setDone(true);
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <div className="eyebrow">STEP {step + 1} OF 4</div>
              <h2>
                {
                  [
                    "Let’s get to know you.",
                    "What would you love to share?",
                    "Make room for what matters.",
                    "A thoughtful start.",
                  ][step]
                }
              </h2>
              {step === 0 && (
                <>
                  <label>
                    Your name
                    <input
                      required
                      {...fields("name")}
                      placeholder="How should families greet you?"
                    />
                  </label>
                  <label>
                    Your story
                    <textarea
                      required
                      {...fields("bio")}
                      placeholder="A little about your experience, interests, and the things you love…"
                    />
                  </label>
                  <label>
                    Languages
                    <input required {...fields("languages")} />
                  </label>
                </>
              )}
              {step === 1 && (
                <>
                  <label>
                    Primary service
                    <select {...fields("services")}>
                      {services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hourly rate ($)
                    <input
                      required
                      type="number"
                      min="10"
                      max="200"
                      {...fields("rate")}
                    />
                  </label>
                  <div className="soft-note">
                    You choose your rate. A platform fee is shown in the booking
                    breakdown before you accept.
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <label>
                    Preferred day
                    <select {...fields("day")}>
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      From
                      <input type="time" required {...fields("start")} />
                    </label>
                    <label>
                      Until
                      <input type="time" required {...fields("end")} />
                    </label>
                  </div>
                  <p>
                    You can add specific available dates from your host
                    schedule.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="soft-note">
                    <ShieldCheck />
                    <b>Your profile is the first step.</b>
                    <p>
                      Identity and background checks are not performed in this
                      demo. Real listings need administrative approval and an
                      operational vetting process.
                    </p>
                  </div>
                  <label className="check-label">
                    <input type="checkbox" required />I understand that saving a
                    profile does not mean I am verified or approved.
                  </label>
                </>
              )}
              <div className="button-row">
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button type="submit">
                  {step === 3 ? "Save profile" : "Continue"} <Arrow />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export function Support() {
  const { action, notify } = useVillage();
  const [sent, setSent] = useState(false);
  return (
    <div className="container support-page">
      <div className="eyebrow">A LITTLE HELP, WHEN YOU NEED IT</div>
      <h1>
        We’re here to
        <br />
        <em>help you find your way.</em>
      </h1>
      <div className="support-grid">
        <div>
          <FAQ />
          <div id="privacy" className="panel">
            <ShieldCheck />
            <h3>Your family’s details stay private.</h3>
            <p>
              No public child profiles. Booking participants see only the care
              information they need. Support complaints aren’t shared
              automatically with the other person.
            </p>
            <p>
              This demo does not provide an emergency response service. For
              immediate danger, contact your local emergency services.
            </p>
          </div>
        </div>
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await action("support", {
                subject: f.get("subject"),
                body: f.get("body"),
              });
              setSent(true);
              notify("Support case saved. You can find it in your account.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <MessageCircle />
          <h2>Let’s sort it out.</h2>
          <p>
            Tell us what’s happening. In demo mode, cases stay in this browser.
          </p>
          {sent ? (
            <Empty
              title="Your case is saved."
              description="You can review it in your account. Demo cases do not notify a real support team."
            />
          ) : (
            <>
              <label>
                What can we help with?
                <select name="subject">
                  <option>A booking</option>
                  <option>My account</option>
                  <option>Payments</option>
                  <option>Report a concern</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>
                Tell us a little more
                <textarea
                  name="body"
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Include your booking reference if relevant."
                />
              </label>
              <Button type="submit">
                Save support request <Arrow />
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
