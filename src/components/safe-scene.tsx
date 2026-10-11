"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { supportsWebGL2 } from "@/lib/webgl";

let support: boolean | undefined;

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SceneContextMonitor({ onLost }: { onLost: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const handleLost = (event: Event) => {
      event.preventDefault();
      support = false;
      onLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [canvas, onLost]);
  return null;
}

export function SafeScene({
  children,
  fallback,
}: {
  children: (onLost: () => void) => ReactNode;
  fallback: ReactNode;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    support ??= supportsWebGL2();
    setAvailable(support);
  }, []);
  return available ? (
    <SceneBoundary fallback={fallback}>
      {children(() => setAvailable(false))}
    </SceneBoundary>
  ) : (
    fallback
  );
}

export function VillageFallback() {
  return (
    <div
      className="scene-fallback"
      role="img"
      aria-label="A welcoming neighborhood of homes"
    >
      <svg viewBox="0 0 320 220" width="280" aria-hidden="true">
        <ellipse cx="160" cy="184" rx="145" ry="29" fill="#e6ddd0" />
        <g fill="#8da68c">
          <circle cx="40" cy="119" r="25" />
          <circle cx="281" cy="122" r="28" />
        </g>
        <g stroke="#9a7958" strokeWidth="7">
          <path d="M40 140v40M281 145v34" />
        </g>
        <path d="M124 88h70v77h-70z" fill="#c7c7d9" />
        <path d="m113 88 46-40 46 40z" fill="#714f65" />
        <path d="M62 128h82v59H62z" fill="#debab0" />
        <path d="m50 128 53-46 53 46z" fill="#714f65" />
        <path d="M183 119h76v66h-76z" fill="#f3dfbc" />
        <path d="m172 119 49-44 49 44z" fill="#714f65" />
        <path d="M92 154h20v33H92zM211 151h20v34h-20z" fill="#674c50" />
        <g fill="#fff2be">
          <path d="M119 142h14v16h-14zM191 132h14v16h-14zM144 105h20v21h-20z" />
        </g>
      </svg>
      <span>A place to belong.</span>
    </div>
  );
}
