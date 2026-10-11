"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDown, ArrowUpRight, Heart, MoveUpRight } from "lucide-react";
import { HeroDepth } from "./home-depth";
import { Button } from "./ui";

function HeroBackgroundVideo({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useInView(ref);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const syncPlayback = () => {
      if (enabled && visible && !document.hidden) {
        void video.play().catch(() => {
          // Autoplay can be blocked by browser power/data-saving policies.
          // The poster remains a readable, static background.
        });
      } else video.pause();
    };
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [enabled, visible]);
  return (
    <div className="hero-video-background" aria-hidden="true">
      <video
        ref={ref}
        src="/video.mp4"
        poster="/images/hero.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        disablePictureInPicture
      />
    </div>
  );
}

export function PremiumHero({
  enabled,
  paused,
  reduced,
  onToggle,
}: {
  enabled: boolean;
  paused: boolean;
  reduced: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.8], [0.92, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.6], [0, -70]);
  const progress = useSpring(useScroll().scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });
  return (
    <section ref={ref} className="premium-hero">
      <motion.div
        className="page-scroll-progress"
        style={{ scaleX: enabled ? progress : 0 }}
        aria-hidden="true"
      />
      <div className="premium-grid" aria-hidden="true" />
      <div className="premium-orbit orbit-one" aria-hidden="true" />
      <div className="premium-orbit orbit-two" aria-hidden="true" />
      <div className="premium-hero-intro">
        <HeroBackgroundVideo enabled={enabled} />
        <motion.div
          className="premium-hero-copy container"
          style={{ y: enabled ? titleY : 0 }}
        >
          <motion.div
            className="premium-pill"
            initial={false}
            animate={{ opacity: 1 }}
          >
            <span /> DIFFERENT GENERATIONS. ONE VILLAGE.
          </motion.div>
          <h1>
            <span>Good people.</span>
            <br />
            <motion.span
              className="rose-type"
              initial={enabled ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Closer together.
            </motion.span>
          </h1>
          <p>
            Extra hands. Shared stories. A little more belonging.
            <br />
            Meet senior hosts who make everyday life feel more like family.
          </p>
          <div className="premium-hero-actions">
            <Button href="/hosts">
              Find your people <ArrowUpRight size={18} />
            </Button>
            <Button href="/join" variant="outline">
              Become a host <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="premium-footnotes">
            <span>CARE WITH CONNECTION</span>
            <span>TIME WELL SHARED</span>
            <span>RIGHT IN YOUR NEIGHBORHOOD</span>
          </div>
        </motion.div>
        <div className="premium-hero-bottom container">
          <a href="#village-story">
            <ArrowDown size={15} /> SCROLL TO FEEL THE CONNECTION
          </a>
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={paused}
            disabled={reduced}
          >
            {reduced
              ? "REDUCED MOTION"
              : paused
                ? "▷ PLAY MOTION"
                : "Ⅱ PAUSE MOTION"}
          </button>
        </div>
      </div>
      <motion.div
        className="cinematic-photo container"
        style={{ scale: enabled ? scale : 1 }}
      >
        <HeroDepth enabled={enabled}>
          <div className="hero-frame">
            <img
              className="hero-image"
              src="/images/hero.jpg"
              alt="A senior host and child enjoying an afternoon of drawing together"
              fetchPriority="high"
            />
            <div className="hero-image-shade" />
            <div className="cinematic-caption">
              <span>THE LITTLE MOMENTS ARE THE BIG THINGS.</span>
              <h2>
                A familiar face.
                <br />
                <em>A fuller heart.</em>
              </h2>
            </div>
            <span className="cinematic-stamp">
              <Heart size={18} /> GOOD COMPANY.
              <br />
              GREAT CONNECTIONS.
            </span>
          </div>
        </HeroDepth>
      </motion.div>
    </section>
  );
}
function RevealWord({
  children,
  progress,
  index,
  total,
  enabled,
}: {
  children: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
  enabled: boolean;
}) {
  const color = useTransform(
    progress,
    [index / total, (index + 1) / total],
    ["#827b86", "#f8f2ec"],
  );
  return (
    <motion.span style={{ color: enabled ? color : "#f8f2ec" }}>
      {children}{" "}
    </motion.span>
  );
}
export function ConnectionStatement({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start .85", "end .55"],
  });
  const words =
    "Life feels lighter when we have someone to share it with.".split(" ");
  return (
    <section
      ref={ref}
      id="village-story"
      className="connection-statement container"
    >
      <div className="editorial-label">
        <span>01 / THE GRANDVILLAGE IDEA</span>
        <Heart size={18} />
      </div>
      <h2 aria-label="Life feels lighter when we have someone to share it with.">
        {words.map((word, i) => (
          <RevealWord
            key={i}
            index={i}
            total={words.length}
            progress={scrollYProgress}
            enabled={enabled}
          >
            {word}
          </RevealWord>
        ))}
      </h2>
      <div className="statement-footer">
        <span className="statement-star" aria-hidden="true">
          ✳
        </span>
        <p>
          For parents, a little breathing room.
          <br />
          For senior hosts, a new chapter.
          <br />
          For everyone, a meaningful connection.
        </p>
        <Link href="/hosts">
          Find your kind of people <MoveUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
const chapters = [
  {
    number: "01",
    title: "A little help.",
    text: "An extra pair of hands for the busy days. Find a host whose experience, interests, and pace feel right for your family.",
    image: "/images/hero.jpg",
    alt: "A shared afternoon of creative activities",
    tag: "EVERYDAY CARE",
  },
  {
    number: "02",
    title: "A lot to share.",
    text: "Recipes, stories, and skills worth passing on. Make room for the small moments that bring generations together.",
    image: "/images/maria.jpg",
    alt: "Senior host Maria in her kitchen",
    tag: "TIME TOGETHER",
  },
  {
    number: "03",
    title: "Something lasting.",
    text: "Stay close through messages and photos. Share feedback, book again, and let a familiar face become part of your village.",
    image: "/images/community.jpg",
    alt: "A moment of connection between generations",
    tag: "A SENSE OF BELONGING",
  },
];
export function ScrollJourney({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(
    scrollYProgress,
    [0, 0.18, 0.34, 0.6, 0.76, 1],
    ["0%", "0%", "-33.3333%", "-33.3333%", "-66.6667%", "-66.6667%"],
  );
  return (
    <section
      ref={ref}
      className={`scroll-journey ${enabled ? "" : "journey-static"}`}
      aria-label="Three ways a village makes a difference"
    >
      <div className="journey-sticky container">
        <div className="journey-intro">
          <span className="eyebrow">02 / MORE THAN A BOOKING</span>
          <h2>
            Little moments.
            <br />
            <em>Lasting meaning.</em>
          </h2>
          <p>Good connections grow one shared afternoon at a time.</p>
          <Link className="text-link" href="/hosts">
            Explore your village <ArrowUpRight size={17} />
          </Link>
          <div className="journey-progress" aria-hidden="true">
            <motion.span style={{ scaleX: enabled ? scrollYProgress : 1 }} />
          </div>
          <small className="journey-scroll-label">
            KEEP SCROLLING TO EXPLORE →
          </small>
        </div>
        <div className="journey-window">
          <motion.div className="journey-track" style={{ x: enabled ? x : 0 }}>
            {chapters.map((c) => (
              <article className="journey-card" key={c.number}>
                <div className="journey-photo">
                  <img src={c.image} alt={c.alt} loading="lazy" />
                  <span>{c.tag}</span>
                  <b>{c.number}</b>
                </div>
                <div className="journey-card-copy">
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
