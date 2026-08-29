"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  Group,
  MathUtils,
  MeshBasicMaterial,
  SphereGeometry,
} from "three";

const CLOUD_COUNT = 9;
const PUFFS_PER_CLOUD = 5;
const DRIFT_SPEED = 0.55;
const WRAP_HALF = 42;
const CLOUD_Y_MIN = 11;
const CLOUD_Y_MAX = 17;

type CloudSpec = {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  scale: number;
  puffs: { ox: number; oy: number; oz: number; s: number }[];
};

function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildCloudSpecs(): CloudSpec[] {
  const clouds: CloudSpec[] = [];

  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    const h1 = hash01(i * 3.1 + 1);
    const h2 = hash01(i * 5.7 + 2);
    const h3 = hash01(i * 7.3 + 3);
    const h4 = hash01(i * 11.1 + 4);
    const puffs = [];

    for (let p = 0; p < PUFFS_PER_CLOUD; p += 1) {
      const seed = i * 40 + p * 9;
      puffs.push({
        ox: (hash01(seed) - 0.5) * 3.4,
        oy: (hash01(seed + 2) - 0.5) * 0.7,
        oz: (hash01(seed + 4) - 0.5) * 2.2,
        s: 0.7 + hash01(seed + 6) * 0.9,
      });
    }

    clouds.push({
      baseX: (h1 - 0.5) * WRAP_HALF * 2,
      baseY: CLOUD_Y_MIN + h2 * (CLOUD_Y_MAX - CLOUD_Y_MIN),
      baseZ: (h3 - 0.5) * WRAP_HALF * 1.6,
      speed: DRIFT_SPEED * (0.65 + h4 * 0.7),
      scale: 1.1 + h1 * 0.9,
      puffs,
    });
  }

  return clouds;
}

const sharedGeometry = new SphereGeometry(1.1, 8, 6);
const sharedMaterial = new MeshBasicMaterial({
  color: "#f2f6fb",
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
  fog: false,
});

type DaySkyCloudsProps = {
  isNight: boolean;
};

/** Soft sky puffs that drift across the map by day and fade out at night. */
export function DaySkyClouds({ isNight }: DaySkyCloudsProps) {
  const rootRef = useRef<Group>(null);
  const dayAmountRef = useRef(isNight ? 0 : 1);
  const clouds = useMemo(() => buildCloudSpecs(), []);
  const offsetsRef = useRef(clouds.map(() => 0));

  useFrame((_, delta) => {
    const target = isNight ? 0 : 1;
    dayAmountRef.current = MathUtils.damp(
      dayAmountRef.current,
      target,
      2.4,
      delta,
    );
    const day = dayAmountRef.current;
    sharedMaterial.opacity = day * 0.72;

    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.visible = day > 0.02;

    if (!root.visible) {
      return;
    }

    const offsets = offsetsRef.current;

    for (let i = 0; i < clouds.length; i += 1) {
      const cloud = clouds[i]!;
      const child = root.children[i];
      if (!child) {
        continue;
      }

      offsets[i] = (offsets[i]! + cloud.speed * delta) % (WRAP_HALF * 2);
      let x = cloud.baseX + offsets[i]!;
      if (x > WRAP_HALF) {
        x -= WRAP_HALF * 2;
      }

      child.position.set(x, cloud.baseY, cloud.baseZ);
    }
  });

  return (
    <group ref={rootRef} raycast={() => null}>
      {clouds.map((cloud, index) => (
        <group
          key={index}
          position={[cloud.baseX, cloud.baseY, cloud.baseZ]}
          scale={cloud.scale}
        >
          {cloud.puffs.map((puff, puffIndex) => (
            <mesh
              key={puffIndex}
              geometry={sharedGeometry}
              material={sharedMaterial}
              position={[puff.ox, puff.oy, puff.oz]}
              scale={[puff.s, puff.s * 0.55, puff.s * 0.85]}
              castShadow={false}
              receiveShadow={false}
              raycast={() => null}
              renderOrder={-1}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
