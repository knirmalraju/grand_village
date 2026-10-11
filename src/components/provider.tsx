"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AppData,
  initialData,
  Role,
  Booking,
  Status,
  Message,
  canTransition,
  overlaps,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { MotionConfig } from "motion/react";
type ContextType = {
  data: AppData;
  role: Role;
  mode: "demo" | "live";
  uid: string;
  name: string;
  ready: boolean;
  notice: string;
  notify: (s: string) => void;
  demo: (r: Role) => void;
  refresh: () => Promise<void>;
  action: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
  logout: () => Promise<void>;
};
const Context = createContext<ContextType>(null!);
const KEY = "grandvillage-demo-v1";
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [role, setRole] = useState<Role>("parent");
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [uid, setUid] = useState("parent-demo");
  const [name, setName] = useState("Sarah");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const notify = useCallback((s: string) => setNotice(s), []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    setMode("live");
    setUid(session.user.id);
    const res = await fetch("/api/data", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setData({
        bookings: [],
        messages: [],
        reviews: [],
        cases: [],
        saved: [],
        readMarkers: {},
        availability: [],
        hosts: [],
      });
      notify(json.error);
      throw new Error(json.error);
    }
    setData(json.data);
    setRole(json.role);
    setUid(session.user.id);
    setName(json.name);
    setMode("live");
  }, [notify]);
  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {}
    }
    const r = localStorage.getItem("gv-role") as Role | null;
    if (r && ["parent", "host", "admin"].includes(r)) {
      setRole(r);
      setUid(
        r === "host"
          ? localStorage.getItem("gv-host-id") || "eleanor"
          : r === "admin"
            ? "admin-demo"
            : "parent-demo",
      );
      setName(r === "host" ? "Eleanor" : r === "admin" ? "Alex" : "Sarah");
    }
    setReady(true);
    if (localStorage.getItem("gv-mode") === "live")
      void refresh().catch(() => {});
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue && active)
        setData(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && localStorage.getItem("gv-mode") === "live")
        setTimeout(() => void refresh().catch(() => {}), 0);
    });
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      listener.subscription.unsubscribe();
    };
  }, [refresh]);
  useEffect(() => {
    if (mode === "live") {
      const ch = supabase
        .channel("gv-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookings" },
          () => void refresh().catch(() => {}),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => void refresh().catch(() => {}),
        )
        .subscribe();
      const t = setInterval(() => void refresh().catch(() => {}), 20000);
      return () => {
        void supabase.removeChannel(ch);
        clearInterval(t);
      };
    }
  }, [mode, refresh]);
  function demo(r: Role) {
    setMode("demo");
    setRole(r);
    setUid(
      r === "host"
        ? localStorage.getItem("gv-host-id") || "eleanor"
        : r === "admin"
          ? "admin-demo"
          : "parent-demo",
    );
    setName(r === "host" ? "Eleanor" : r === "admin" ? "Alex" : "Sarah");
    localStorage.setItem("gv-role", r);
    localStorage.setItem("gv-mode", "demo");
    const saved = localStorage.getItem(KEY);
    setData(saved ? JSON.parse(saved) : initialData());
  }
  async function action(type: string, payload: Record<string, unknown>) {
    if (mode === "live") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in first.");
      const res = await fetch(
        type === "message" && payload.photo_data
          ? "/api/messages/photo"
          : "/api/action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ type, payload }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await refresh();
      if (type === "pay" && json.result?.url)
        window.location.assign(json.result.url);
      return json.result;
    }
    const current = JSON.parse(
      localStorage.getItem(KEY) || JSON.stringify(data),
    ) as AppData;
    let result: unknown;
    if (type === "book") {
      if (role !== "parent")
        throw new Error("Switch to the parent demo to request a booking.");
      const host = current.hosts.find((h) => h.id === payload.host_id);
      if (!host) throw new Error("Host not found");
      const hours =
        (new Date(String(payload.ends_at)).getTime() -
          new Date(String(payload.starts_at)).getTime()) /
        3600000;
      if (hours <= 0 || hours > 8)
        throw new Error("Choose a duration between 1 and 8 hours.");
      if (new Date(String(payload.starts_at)) <= new Date())
        throw new Error("Choose a future date and time.");
      const b = {
        ...payload,
        id: "GV-" + Date.now().toString().slice(-7),
        parent_id: uid,
        parent_name: "Sarah Jenkins",
        status: "requested",
        payment_status: "unpaid",
        amount: hours * host.rate,
      } as Booking;
      if (
        current.bookings.some(
          (x) =>
            x.host_id === b.host_id &&
            x.status === "accepted" &&
            overlaps(x, b),
        )
      )
        throw new Error("This host is already booked at that time.");
      current.bookings.unshift(b);
      result = b.id;
    }
    if (type === "status") {
      const b = current.bookings.find((x) => x.id === payload.id);
      if (!b || !canTransition(b, payload.status as Status, role))
        throw new Error("This booking cannot make that change.");
      if (role === "host" && b.host_id !== uid)
        throw new Error("This request belongs to another host.");
      if (
        payload.status === "accepted" &&
        current.bookings.some(
          (x) =>
            x.id !== b.id &&
            x.host_id === b.host_id &&
            x.status === "accepted" &&
            overlaps(x, b),
        )
      )
        throw new Error("There is already an accepted booking at that time.");
      b.status = payload.status as Status;
    }
    if (type === "pay") {
      const b = current.bookings.find((x) => x.id === payload.id);
      if (
        role !== "parent" ||
        !b ||
        b.status !== "accepted" ||
        b.payment_status === "paid"
      )
        throw new Error("Only an accepted, unpaid booking can be paid.");
      b.payment_status = "paid";
    }
    if (type === "message") {
      const b = current.bookings.find((x) => x.id === payload.booking_id);
      if (!b || !["accepted", "completed"].includes(b.status))
        throw new Error("Messages open after acceptance.");
      if (b.parent_id !== uid && b.host_id !== uid)
        throw new Error("Only booking participants can send messages.");
      if (payload.type === "update" && role !== "host")
        throw new Error("Only the host can post care updates.");
      const photo =
        typeof payload.photo_data === "string" ? payload.photo_data : undefined;
      if (
        photo &&
        (!/^data:image\/jpeg;base64,/.test(photo) || photo.length > 1_400_000)
      )
        throw new Error("Please choose a smaller JPG photo.");
      const msg = {
        booking_id: b.id,
        body: String(payload.body || ""),
        type: payload.type,
        photo_url: photo,
        id: crypto.randomUUID(),
        sender_id: uid,
        created_at: new Date().toISOString(),
      } as Message;
      if ((!msg.body.trim() && !photo) || msg.body.length > 2000)
        throw new Error("Enter a message of 1–2,000 characters.");
      current.messages.push(msg);
    }
    if (type === "review") {
      const b = current.bookings.find((x) => x.id === payload.booking_id);
      if (!b || b.status !== "completed")
        throw new Error("Reviews open after completion.");
      if (
        current.reviews.some(
          (r) => r.booking_id === b.id && r.reviewer_id === uid,
        )
      )
        throw new Error("You already reviewed this booking.");
      if (role !== "parent" || b.parent_id !== uid)
        throw new Error("Only the booking parent can leave feedback.");
      if (
        !Number.isInteger(Number(payload.rating)) ||
        Number(payload.rating) < 1 ||
        Number(payload.rating) > 5 ||
        String(payload.body).trim().length < 5 ||
        String(payload.body).trim().length > 1000
      )
        throw new Error("Choose 1–5 stars and write 5–1,000 characters.");
      current.reviews.push({
        id: crypto.randomUUID(),
        booking_id: b.id,
        reviewer_id: uid,
        rating: Number(payload.rating),
        body: String(payload.body),
      });
    }
    if (type === "read") {
      current.readMarkers = {
        ...(current.readMarkers || {}),
        [uid + ":" + String(payload.booking_id)]: new Date().toISOString(),
      };
    }
    if (type === "save") {
      const id = String(payload.id);
      current.saved = current.saved.includes(id)
        ? current.saved.filter((x) => x !== id)
        : [...current.saved, id];
    }
    if (type === "support")
      current.cases.unshift({
        id: "CASE-" + Date.now().toString().slice(-6),
        user_id: uid,
        subject: String(payload.subject),
        body: String(payload.body),
        status: "open",
      });
    if (type === "resolve") {
      if (role !== "admin") throw new Error("Admin access required");
      current.cases = current.cases.map((c) =>
        c.id === payload.id ? { ...c, status: "resolved" } : c,
      );
    }
    if (type === "approve") {
      if (role !== "admin") throw new Error("Admin access required");
      current.hosts = current.hosts.map((h) =>
        h.id === payload.id ? { ...h, approved: !h.approved } : h,
      );
    }
    if (type === "host_onboard") {
      const id = "demo-host";
      const host = {
        id,
        name: String(payload.name),
        title: "A new story in the village.",
        bio: String(payload.bio),
        image: "/images/eleanor.jpg",
        rate: Number(payload.rate),
        languages: String(payload.languages)
          .split(",")
          .map((s) => s.trim()),
        services: [String(payload.services)],
        neighborhood: "Your neighborhood",
        tags: ["A new connection"],
        approved: false,
      };
      current.hosts = [...current.hosts.filter((h) => h.id !== id), host];
      setRole("host");
      setUid(id);
      setName(host.name.split(" ")[0]);
      localStorage.setItem("gv-host-id", id);
      localStorage.setItem("gv-role", "host");
    }
    if (type === "profile") {
      localStorage.setItem("gv-profile-" + role, JSON.stringify(payload));
      if (role === "host")
        current.hosts = current.hosts.map((h) =>
          h.id === uid
            ? {
                ...h,
                name: String(payload.name || h.name),
                bio: String(payload.bio || h.bio),
                rate: Number(payload.rate || h.rate),
              }
            : h,
        );
      setName(String(payload.name || name).split(" ")[0]);
    }
    if (type === "availability") {
      if (role !== "host") throw new Error("Host account required.");
      current.availability = [
        ...(current.availability || []),
        {
          id: crypto.randomUUID(),
          host_id: uid,
          starts_at: String(payload.starts_at),
          ends_at: String(payload.ends_at),
        },
      ];
    }
    if (type === "reset") {
      localStorage.removeItem("gv-host-id");
      if (role === "host") {
        setUid("eleanor");
        setName("Eleanor");
      }
      const fresh = initialData();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      setData(fresh);
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      throw new Error(
        "Demo storage is full. Use a smaller photo or reset demo data in Account.",
      );
    }
    setData(current);
    return result;
  }
  async function logout() {
    await supabase.auth.signOut();
    demo("parent");
  }
  return (
    <MotionConfig reducedMotion="user">
      <Context.Provider
        value={{
          data,
          role,
          mode,
          uid,
          name,
          ready,
          notice,
          notify,
          demo,
          refresh,
          action,
          logout,
        }}
      >
        {children}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
      </Context.Provider>
    </MotionConfig>
  );
}
export const useVillage = () => useContext(Context);
