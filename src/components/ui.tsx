"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  ArrowRight,
  House,
  Flower2,
} from "lucide-react";
import { Host, money } from "@/lib/data";
import { useVillage } from "./provider";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="GrandVillage home">
      <span className="logo-mark">
        <House size={21} />
        <Heart size={9} fill="currentColor" />
      </span>
      <span>
        Grand<span className="logo-light">Village</span>
        <small>GOOD PEOPLE. CLOSE TO HOME.</small>
      </span>
    </Link>
  );
}
export function Button({
  children,
  href,
  onClick,
  variant = "",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: string;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const cls = `btn ${variant} ${className}`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({
  children,
  kind = "",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Flower2 size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function HostCard({ host, index = 0 }: { host: Host; index?: number }) {
  const { data, action, notify } = useVillage();
  return (
    <Reveal delay={index * 0.05} className="host-card">
      <Link href={`/hosts/${host.id}`} className="host-photo">
        <img src={host.image} alt={host.name} />
        <span className="photo-tag">{host.services[0]}</span>
      </Link>
      <button
        className={`save-button ${data.saved.includes(host.id) ? "saved" : ""}`}
        aria-label={`${data.saved.includes(host.id) ? "Unsave" : "Save"} ${host.name}`}
        onClick={() =>
          void action("save", { id: host.id }).catch((e) => notify(e.message))
        }
      >
        <Heart
          size={19}
          fill={data.saved.includes(host.id) ? "currentColor" : "none"}
        />
      </button>
      <div className="host-content">
        <div className="host-title">
          <h3>
            <Link href={`/hosts/${host.id}`}>{host.name}</Link>
          </h3>
          <span className="tiny">Demo host</span>
        </div>
        <p className="location">
          <MapPin size={14} />
          {host.neighborhood} · {host.languages.join(" & ")}
        </p>
        <p className="host-quote">“{host.title}”</p>
        <div className="tags">
          {host.tags.slice(0, 2).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="host-bottom">
          <span>
            <b>{money(host.rate)}</b>
            <small> / hour</small>
          </span>
          <Link href={`/hosts/${host.id}`} className="text-link">
            Meet {host.name.split(" ")[0]} <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-top">
        <div>
          <Logo />
          <p>
            For the little moments.
            <br />
            And the people who make them matter.
          </p>
        </div>
        <div>
          <b>For families</b>
          <Link href="/hosts">Find a host</Link>
          <Link href="/parent">Your dashboard</Link>
          <Link href="/support">How it works</Link>
        </div>
        <div>
          <b>For hosts</b>
          <Link href="/join">Become a host</Link>
          <Link href="/host">Host dashboard</Link>
          <Link href="/support">Host resources</Link>
        </div>
        <div>
          <b>Here to help</b>
          <Link href="/support">Help & support</Link>
          <Link href="/support#privacy">Privacy & trust</Link>
          <Link href="/login">
            Log in <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} GrandVillage. A little closer, together.
        </span>
        <span>Demo preview · Fictional profiles and transactions</span>
      </div>
    </footer>
  );
}
export function Arrow() {
  return <ArrowRight size={18} />;
}
