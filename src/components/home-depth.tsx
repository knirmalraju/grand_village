"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const Ornaments = dynamic(() => import("./hero-ornaments"), { ssr: false });

export function HeroDepth({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "100px" });
  const entered = useInView(ref, { margin: "100px", once: true });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [0, 65]);
  const y = useSpring(drift, { stiffness: 90, damping: 28 });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(pointerY, { stiffness: 120, damping: 24 });
  const rotateY = useSpring(pointerX, { stiffness: 120, damping: 24 });
  return (
    <div
      ref={ref}
      className="hero-visual depth-stage"
      onPointerMove={(event) => {
        if (!enabled || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 7);
        pointerY.set(-((event.clientY - rect.top) / rect.height - 0.5) * 7);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <div className="depth-halo" aria-hidden="true" />
      <motion.div
        className="depth-photo"
        style={
          enabled ? { y, rotateX, rotateY } : { y: 0, rotateX: 0, rotateY: 0 }
        }
      >
        {children}
      </motion.div>
      <div className="hero-ornaments" aria-hidden="true">
        {enabled && entered ? (
          <Ornaments visible={visible} />
        ) : (
          <span className="ornament-static">♥</span>
        )}
      </div>
    </div>
  );
}

export function Parallax({
  children,
  enabled,
  className = "",
}: {
  children: ReactNode;
  enabled: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [28, -28]);
  const y = useSpring(drift, { stiffness: 100, damping: 30 });
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: enabled ? y : 0 }}>{children}</motion.div>
    </div>
  );
}
