"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Shape } from "three";
import { useEffect, useState, type ReactNode } from "react";
import { SafeScene, SceneContextMonitor } from "./safe-scene";

const heart = new Shape();
heart.moveTo(0, -0.48);
heart.bezierCurveTo(-0.1, -0.3, -0.6, 0.02, -0.6, 0.35);
heart.bezierCurveTo(-0.6, 0.75, -0.12, 0.86, 0, 0.5);
heart.bezierCurveTo(0.12, 0.86, 0.6, 0.75, 0.6, 0.35);
heart.bezierCurveTo(0.6, 0.02, 0.1, -0.3, 0, -0.48);

function ResponsiveGroup({ children }: { children: ReactNode }) {
  const width = useThree((state) => state.viewport.width);
  return <group scale={Math.min(1, width / 7.4)}>{children}</group>;
}

export default function HeroOrnaments({
  visible = true,
}: {
  visible?: boolean;
}) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const update = () => setActive(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <SafeScene fallback={<span className="ornament-static">♥</span>}>
      {(onLost) => (
        <Canvas
          frameloop={active && visible ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
        >
          <SceneContextMonitor onLost={onLost} />
          <ambientLight intensity={1.8} />
          <directionalLight
            position={[-3, 5, 5]}
            intensity={3}
            color="#fff0dc"
          />
          <directionalLight
            position={[4, -2, 3]}
            intensity={1.4}
            color="#d6c2ed"
          />
          <ResponsiveGroup>
            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
              <mesh
                position={[-2.65, 2.05, 0]}
                rotation={[0.15, -0.35, -0.3]}
                scale={0.65}
              >
                <extrudeGeometry
                  args={[
                    heart,
                    {
                      depth: 0.2,
                      bevelEnabled: true,
                      bevelSegments: 4,
                      steps: 1,
                      bevelSize: 0.12,
                      bevelThickness: 0.12,
                      curveSegments: 24,
                    },
                  ]}
                />
                <meshStandardMaterial
                  color="#bb7967"
                  roughness={0.3}
                  metalness={0.12}
                />
              </mesh>
            </Float>
            <Float speed={1.2} rotationIntensity={0.45} floatIntensity={0.35}>
              <mesh position={[2.85, -0.6, 0]} rotation={[0.5, 0.3, 0.4]}>
                <torusGeometry args={[0.43, 0.14, 16, 48]} />
                <meshStandardMaterial
                  color="#9e8caf"
                  metalness={0.18}
                  roughness={0.27}
                />
              </mesh>
            </Float>
            <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.35}>
              <mesh
                position={[-1.3, 2.9, -0.3]}
                scale={[0.2, 0.4, 0.15]}
                rotation={[0, 0, -0.6]}
              >
                <sphereGeometry args={[1, 24, 24]} />
                <meshStandardMaterial color="#9db49a" roughness={0.42} />
              </mesh>
              <mesh position={[-2.9, -0.8, 0]}>
                <sphereGeometry args={[0.13, 20, 20]} />
                <meshStandardMaterial
                  color="#dcb98d"
                  metalness={0.25}
                  roughness={0.3}
                />
              </mesh>
            </Float>
          </ResponsiveGroup>
        </Canvas>
      )}
    </SafeScene>
  );
}
