"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { getProjectileTravelDuration } from "@/lib/tower-types";

type ProjectileProps = {
  from: [number, number, number];
  to: [number, number, number];
  speed: number;
  onHit: () => void;
};

export function Projectile({ from, to, speed, onHit }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const hit = useRef(false);
  const duration = useMemo(
    () => getProjectileTravelDuration(from, to, speed),
    [from, to, speed],
  );

  useFrame((_, delta) => {
    if (hit.current || !meshRef.current) {
      return;
    }

    if (duration <= 0) {
      hit.current = true;
      onHit();
      return;
    }

    progress.current += delta / duration;

    if (progress.current >= 1) {
      progress.current = 1;
      hit.current = true;
      onHit();
    }

    const t = progress.current;
    meshRef.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  });

  return (
    <mesh ref={meshRef} position={from}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial
        color="#ffe566"
        emissive="#9a7200"
        emissiveIntensity={0.6}
        roughness={0.4}
      />
    </mesh>
  );
}
