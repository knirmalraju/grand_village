"use client";
import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useVillage } from "./provider";
import { Button } from "./ui";

export function PushSettings() {
  const { mode, uid } = useVillage();
  const [key, setKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Checking this browser…");
  async function request(method: string, body?: unknown) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Sign in to enable browser notifications.");
    const res = await fetch("/api/push/subscription", {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  }
  useEffect(() => {
    let cancelled = false;
    setKey(null);
    setEnabled(false);
    if (mode === "demo") {
      setStatus(
        "In-app reminders work in this demo. Browser push requires a live parent account and server setup.",
      );
      return;
    }
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus(
        "Push notifications are not supported in this browser. In-app reminders are still available.",
      );
      return;
    }
    void (async () => {
      try {
        const config = await request("GET");
        if (cancelled) return;
        if (!config.configured) {
          setStatus(
            "Browser push is waiting for the server notification setup.",
          );
          return;
        }
        setKey(config.publicKey);
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (cancelled) return;
        // Re-register an existing subscription for this signed-in account.
        if (subscription) {
          await request("POST", subscription.toJSON());
          if (cancelled) return;
          setEnabled(true);
        }
        setStatus(
          subscription
            ? "Notifications are enabled on this browser."
            : Notification.permission === "denied"
              ? "Notifications are blocked. Allow them in your browser’s site settings, then try again."
              : "Get a private reminder when your senior host sends a message or photo—even when this tab is closed.",
        );
      } catch (e) {
        if (!cancelled) setStatus((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, uid]);
  async function toggle() {
    setBusy(true);
    try {
      if (enabled) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await request("DELETE", { endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
        setEnabled(false);
        setStatus(
          "Browser notifications are off. In-app reminders remain available.",
        );
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(
            permission === "denied"
              ? "Notifications are blocked. You can enable them in your browser’s site settings."
              : "Permission was not granted. You can try again when you’re ready.",
          );
          return;
        }
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key!,
        });
        try {
          await request("POST", subscription.toJSON());
        } catch (e) {
          await subscription.unsubscribe();
          throw e;
        }
        setEnabled(true);
        setStatus("Notifications are enabled on this browser.");
      }
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="push-settings panel">
      <span className="reminder-bell">
        <BellRing size={23} />
      </span>
      <div>
        <h3>Keep your village close.</h3>
        <p role="status">{status}</p>
        <small>
          Push previews never include message text or photos. Delivery depends
          on your browser and device settings.
        </small>
      </div>
      <Button
        variant="outline"
        disabled={!key || busy}
        onClick={() => void toggle()}
      >
        {busy
          ? "Updating…"
          : enabled
            ? "Turn off notifications"
            : "Enable notifications"}
      </Button>
    </section>
  );
}
