"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const DAY_BG = new THREE.Color("#7ea3c9");
const NIGHT_BG = new THREE.Color("#243a5c");
const SUN_COLOR = new THREE.Color("#fff1d6");
const MOON_COLOR = new THREE.Color("#c4d0f0");

type DayNightCycleProps = {
  /** Gameplay phase — lighting eases toward day or night. */
  isNight: boolean;
};

/**
 * Scene lighting + sky driven by explicit day/night phase
 * (raid send → night, wave cleared → day).
 */
export function DayNightCycle({ isNight }: DayNightCycleProps) {
  const bgRef = useRef<THREE.Color>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const dayAmountRef = useRef(isNight ? 0 : 1);
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const target = isNight ? 0 : 1;
    dayAmountRef.current = THREE.MathUtils.damp(
      dayAmountRef.current,
      target,
      2.8,
      delta,
    );
    const day = dayAmountRef.current;
    const night = 1 - day;

    if (bgRef.current) {
      scratch.copy(NIGHT_BG).lerp(DAY_BG, day);
      bgRef.current.copy(scratch);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.44 + day * 0.28;
    }

    if (sunRef.current) {
      const elevation = -0.15 + day * 1.05;
      const azimuth = 0.35 + day * 1.9;
      const radius = 22;
      sunRef.current.position.set(
        Math.cos(azimuth) * radius,
        Math.sin(elevation) * radius,
        Math.sin(azimuth) * radius * 0.65,
      );
      sunRef.current.intensity = 0.22 + day * 1.18;
      sunRef.current.color.copy(SUN_COLOR);
    }

    if (moonRef.current) {
      moonRef.current.intensity = night * 0.9;
      moonRef.current.color.copy(MOON_COLOR);
    }
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={["#7ea3c9"]} />
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight
        ref={sunRef}
        position={[10, 16, 8]}
        intensity={1.4}
        color="#fff1d6"
      />
      <directionalLight
        ref={moonRef}
        position={[-8, 10, -6]}
        intensity={0}
        color="#a8b8e8"
      />
    </>
  );
}
