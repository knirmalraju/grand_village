"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  MessageCircle,
  UserRound,
  Wallet,
  Inbox,
  ShieldCheck,
  Users,
  LifeBuoy,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Flower2,
  Bell,
  MessageSquareHeart,
} from "lucide-react";
import { Logo, Button, Footer, Empty } from "./ui";
import {
  Home,
  Directory,
  Profile,
  Login,
  ResetPassword,
  Join,
  Support,
} from "./marketing";
import {
  Dashboard,
  Bookings,
  BookingHub,
  Messages,
  Schedule,
  Earnings,
  Account,
  Admin,
} from "./dashboard";
import { useVillage } from "./provider";
import { MessageReminders, MessageReminderBanner } from "./message-reminders";
import { Feedback } from "./feedback";
import { Role } from "@/lib/data";
export function VillageApp() {
  return (
    <Suspense fallback={<div className="loading">A little moment…</div>}>
      <App />
    </Suspense>
  );
}
function App() {
  const path = usePathname();
  const router = useRouter();
  const { role, mode, name, demo, logout, ready, data, uid } = useVillage();
  const [mobile, setMobile] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const publicNavRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (path !== "/") return;
    const hero = document.querySelector(".premium-hero-intro");
    const nav = publicNavRef.current;
    if (!hero || !nav) return;
    let frame = 0;
    const update = () => {
      setPastHero(
        hero.getBoundingClientRect().bottom <=
          nav.getBoundingClientRect().bottom,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(hero);
    resize.observe(nav);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [path]);
  const isDash = /^\/(parent|host|admin|bookings)(\/|$)/.test(path);
  const roleRoot =
    role === "host" ? "/host" : role === "admin" ? "/admin" : "/parent";
  const unread = data.messages.filter(
    (m) =>
      m.type === "chat" &&
      m.sender_id !== uid &&
      data.bookings.some(
        (b) =>
          b.id === m.booking_id && (b.parent_id === uid || b.host_id === uid),
      ) &&
      m.created_at > (data.readMarkers?.[uid + ":" + m.booking_id] || ""),
  ).length;
  const nav =
    role === "host"
      ? [
          ["Overview", "/host", LayoutDashboard],
          ["Requests", "/host/requests", Inbox],
          ["Schedule", "/host/schedule", CalendarDays],
          ["Messages", "/host/messages", MessageCircle],
          ["Earnings", "/host/earnings", Wallet],
          ["Feedback", "/host/feedback", MessageSquareHeart],
        ]
      : role === "admin"
        ? [
            ["Overview", "/admin", LayoutDashboard],
            ["Users & hosts", "/admin/users", Users],
            ["Bookings", "/admin/bookings", CalendarDays],
            ["Payments", "/admin/payments", Wallet],
            ["Support & reports", "/admin/support", LifeBuoy],
          ]
        : [
            ["Overview", "/parent", LayoutDashboard],
            ["Find a host", "/hosts", Search],
            ["Bookings", "/parent/bookings", CalendarDays],
            ["Messages", "/parent/messages", MessageCircle],
            ["Feedback", "/parent/feedback", MessageSquareHeart],
            ["Reminders", "/parent/notifications", Bell],
            ["Account", "/parent/account", UserRound],
          ];
  function switchRole(r: Role) {
    demo(r);
    if (!path.startsWith("/bookings/"))
      router.push(
        r === "host" ? "/host" : r === "admin" ? "/admin" : "/parent",
      );
    setMobile(false);
  }
  let content;
  if (path === "/") content = <Home />;
  else if (path === "/hosts") content = <Directory />;
  else if (path.startsWith("/hosts/"))
    content = <Profile id={path.split("/")[2]} />;
  else if (path === "/login") content = <Login />;
  else if (path === "/reset-password") content = <ResetPassword />;
  else if (path === "/join") content = <Join />;
  else if (path === "/support") content = <Support />;
  else if (path.startsWith("/bookings/"))
    content = <BookingHub id={path.split("/")[2]} />;
  else if (path.startsWith("/admin"))
    content = <Admin tab={path.split("/")[2] || "overview"} />;
  else if (path === "/parent" || path === "/host") content = <Dashboard />;
  else if (path.endsWith("/bookings")) content = <Bookings />;
  else if (path.endsWith("/requests")) content = <Bookings requests />;
  else if (path === "/parent/notifications") content = <MessageReminders />;
  else if (path.endsWith("/feedback")) content = <Feedback />;
  else if (path.endsWith("/messages")) content = <Messages />;
  else if (path.endsWith("/schedule")) content = <Schedule />;
  else if (path.endsWith("/earnings") || path.endsWith("/payments"))
    content = <Earnings />;
  else if (path.endsWith("/account") || path.endsWith("/profile"))
    content = <Account />;
  else
    content = (
      <Empty
        title="A path yet to be explored"
        description="Let’s head back to your village."
        action={<Button href="/">Go home</Button>}
      />
    );
  const routeRole = path.startsWith("/admin")
    ? "admin"
    : path.startsWith("/host/") || path === "/host"
      ? "host"
      : path.startsWith("/parent")
        ? "parent"
        : null;
  if (isDash && routeRole && routeRole !== role)
    content = (
      <Empty
        title={`This is the ${routeRole} workspace`}
        description={
          mode === "demo"
            ? "Switch demo views to explore this side of GrandVillage."
            : "Sign in with the appropriate account to access this workspace."
        }
        action={
          mode === "demo" ? (
            <Button onClick={() => switchRole(routeRole as Role)}>
              Explore {routeRole} demo
            </Button>
          ) : (
            <Button href="/login">Sign in</Button>
          )
        }
      />
    );
  return (
    <div
      className={
        isDash
          ? "app-shell"
          : `marketing-shell ${path === "/" ? "premium-site" : ""}`
      }
    >
      {isDash ? (
        <>
          <aside className={`sidebar ${mobile ? "open" : ""}`}>
            <Logo />
            <div className="workspace-label">
              {role === "host"
                ? "HOST WORKSPACE"
                : role === "admin"
                  ? "VILLAGE OPERATIONS"
                  : "YOUR FAMILY VILLAGE"}
            </div>
            <nav>
              {nav.map(([label, href, Icon]) => {
                const I = Icon as typeof Search;
                return (
                  <Link
                    key={String(href)}
                    href={String(href)}
                    className={path === href ? "active" : ""}
                    onClick={() => setMobile(false)}
                  >
                    <I size={19} />
                    {String(label)}
                    {label === "Messages" && unread > 0 && (
                      <span className="unread-count">{unread}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="sidebar-bottom">
              {role === "host" && (
                <Link href="/host/profile">
                  <UserRound size={18} />
                  My profile
                </Link>
              )}
              <Link href="/support">
                <LifeBuoy size={18} />A little help
              </Link>
              <div className="sidebar-note">
                <Flower2 size={27} />
                <b>
                  Good people.
                  <br />
                  Close to home.
                </b>
                <p>A little connection makes a world of difference.</p>
              </div>
              <button
                className="sidebar-user"
                onClick={() => {
                  void logout().then(() => router.push("/"));
                }}
              >
                <span className="user-avatar">{name[0]}</span>
                <span>
                  <b>{name}</b>
                  <small>
                    {mode === "demo" ? "Demo account" : "Signed in"}
                  </small>
                </span>
                <LogOut size={16} />
              </button>
            </div>
          </aside>
          <div className="dashboard-area">
            <header className="dashboard-top">
              <button
                className="mobile-toggle"
                aria-label="Toggle navigation"
                aria-expanded={mobile}
                onClick={() => setMobile(!mobile)}
              >
                {mobile ? <X /> : <Menu />}
              </button>
              <span className="top-context">
                <span className="status-dot" />
                {mode === "demo"
                  ? "Your demo village"
                  : "Your connected village"}
              </span>
              <div className="top-actions">
                {role === "parent" && (
                  <Link
                    className="reminder-nav"
                    href="/parent/notifications"
                    aria-label={`${unread} unread message reminders`}
                  >
                    <Bell size={19} />
                    {unread > 0 && <span>{unread}</span>}
                  </Link>
                )}
                {mode === "demo" && (
                  <label className="role-switch">
                    Explore as
                    <select
                      value={role}
                      onChange={(e) => switchRole(e.target.value as Role)}
                    >
                      <option value="parent">Parent</option>
                      <option value="host">Senior host</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                )}
                <Link href="/" className="text-link">
                  Visit homepage <ArrowUpRight size={15} />
                </Link>
                <span className="user-avatar">{name[0]}</span>
              </div>
            </header>
            <div className="demo-strip">
              {mode === "demo"
                ? "DEMO PREVIEW · Fictional profiles, browser-local data, and simulated payments."
                : "LIVE ACCOUNT · Supabase connected. Payments require Stripe configuration."}
            </div>
            <main id="main" className="dashboard-main">
              {ready &&
                role === "parent" &&
                path !== "/parent/notifications" &&
                !path.endsWith("/messages") &&
                !path.startsWith("/bookings/") && <MessageReminderBanner />}
              {ready ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={path}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="loading">Opening your village…</div>
              )}
            </main>
          </div>
        </>
      ) : (
        <>
          <div
            ref={publicNavRef}
            className={
              path === "/"
                ? `homepage-nav ${pastHero ? "is-solid" : "is-transparent"}`
                : undefined
            }
          >
            <header className="public-header container">
              <Logo />
              <nav className={mobile ? "open" : ""}>
                <Link
                  href="/"
                  className={path === "/" ? "active" : ""}
                  onClick={() => setMobile(false)}
                >
                  Home
                </Link>
                <Link
                  href="/hosts"
                  className={path.startsWith("/hosts") ? "active" : ""}
                  onClick={() => setMobile(false)}
                >
                  Find a host
                </Link>
                <Link href="/join" onClick={() => setMobile(false)}>
                  Become a host
                </Link>
                <Link href="/#how-it-works" onClick={() => setMobile(false)}>
                  How it works
                </Link>
                <Link href="/support" onClick={() => setMobile(false)}>
                  Help & support
                </Link>
              </nav>
              <div className="header-actions">
                <Link className="login-link" href="/login">
                  Log in
                </Link>
                <Button href={roleRoot} variant="small">
                  My village <ArrowUpRight size={16} />
                </Button>
                <button
                  className="mobile-toggle"
                  aria-label="Toggle navigation"
                  aria-expanded={mobile}
                  onClick={() => setMobile(!mobile)}
                >
                  {mobile ? <X /> : <Menu />}
                </button>
              </div>
            </header>
          </div>
          <main id="main">{content}</main>
          <Footer />
        </>
      )}
    </div>
  );
}
