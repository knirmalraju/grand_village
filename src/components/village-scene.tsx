"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { useInView } from "motion/react";
import { SafeScene, SceneContextMonitor, VillageFallback } from "./safe-scene";
import type { Group } from "three";
function House({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.7, 0.75, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.91, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.66, 0.48, 4]} />
        <meshStandardMaterial color="#714f65" />
      </mesh>
      <mesh position={[0, 0.22, 0.333]}>
        <boxGeometry args={[0.18, 0.42, 0.025]} />
        <meshStandardMaterial color="#674c50" />
      </mesh>
      <mesh position={[0.21, 0.52, 0.337]}>
        <boxGeometry args={[0.14, 0.17, 0.02]} />
        <meshStandardMaterial
          color="#fff2be"
          emissive="#ffcd82"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}
function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.4, 8]} />
        <meshStandardMaterial color="#9a7958" />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.29, 16, 16]} />
        <meshStandardMaterial color="#8da68c" roughness={1} />
      </mesh>
    </group>
  );
}
function Village() {
  const ref = useRef<Group>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.035;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, -0.13, 0]} receiveShadow>
        <cylinderGeometry args={[2, 1.9, 0.22, 64]} />
        <meshStandardMaterial color="#e6ddd0" />
      </mesh>
      <House position={[-0.65, 0, 0.3]} color="#debab0" />
      <House position={[0.65, 0, 0.15]} color="#f3dfbc" scale={0.85} />
      <House position={[0, 0, -0.85]} color="#c7c7d9" scale={0.75} />
      <Tree x={-1.2} z={-0.5} />
      <Tree x={1.25} z={-0.6} />
      <Tree x={0.1} z={1.15} />
      <mesh position={[0, -0.009, 0.3]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#d7c3a9" />
      </mesh>
    </group>
  );
}
export default function VillageScene() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "100px" });
  const [active, setActive] = useState(true);
  useEffect(() => {
    const update = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <SafeScene fallback={<VillageFallback />}>
        {(onLost) => (
          <Canvas
            frameloop={visible && active ? "always" : "never"}
            shadows
            dpr={[1, 1.5]}
            camera={{ position: [3.5, 3, 4.5], fov: 38 }}
            aria-label="Decorative miniature village. Drag to explore."
          >
            <SceneContextMonitor onLost={onLost} />
            <ambientLight intensity={1.8} />
            <directionalLight position={[3, 6, 4]} intensity={2.5} castShadow />
            <Float speed={1} floatIntensity={0.12} rotationIntensity={0.05}>
              <Village />
            </Float>
            <ContactShadows
              position={[0, -0.3, 0]}
              opacity={0.3}
              scale={7}
              blur={2.5}
            />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={0.6}
              maxPolarAngle={1.2}
            />
          </Canvas>
        )}
      </SafeScene>
    </div>
  );
}
