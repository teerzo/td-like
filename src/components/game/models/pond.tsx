"use client";

import { useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";

import { PixelTextureMaterial } from "@/lib/pixel-art/use-pixel-texture";
import { useDirtRoadSpriteMap } from "@/lib/pixel-art/use-dirt-road-sprite-maps";
import { TILE_SIZE } from "@/lib/terrain";

export const POND_Y = 0.014;

const WATER_RADIUS = TILE_SIZE * 0.38;
const RIM_RADIUS = TILE_SIZE * 0.46;
const RIM_HEIGHT = 0.035;
const OUTLINE_SEGMENTS = 16;

function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Irregular closed loop — a wobbly “circle” unique per seed. */
function createPondShape(seed: number, baseRadius: number, reverse = false) {
  const shape = new Shape();
  const points: [number, number][] = [];

  for (let i = 0; i < OUTLINE_SEGMENTS; i += 1) {
    const t = (i / OUTLINE_SEGMENTS) * Math.PI * 2;
    const h1 = hash01(seed + i * 17);
    const h2 = hash01(seed * 3 + i * 41);
    const wobble =
      0.78 +
      0.16 * Math.sin(t * 2 + seed) +
      0.12 * Math.cos(t * 3 - seed * 0.7) +
      0.1 * Math.sin(t * 5 + h1 * 6) +
      0.06 * (h2 - 0.5);
    const r = baseRadius * wobble;
    points.push([Math.cos(t) * r, Math.sin(t) * r]);
  }

  if (reverse) {
    points.reverse();
  }

  for (let i = 0; i < points.length; i += 1) {
    const [px, py] = points[i]!;
    if (i === 0) {
      shape.moveTo(px, py);
    } else {
      shape.lineTo(px, py);
    }
  }

  shape.closePath();
  return shape;
}

export function PondModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  seed = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  /** Stable per-tile seed for the irregular outline. */
  seed?: number;
}) {
  const dirtMap = useDirtRoadSpriteMap("dirt");

  const { waterGeometry, rimGeometry } = useMemo(() => {
    const waterShape = createPondShape(seed, WATER_RADIUS);
    const rimShape = createPondShape(seed + 9, RIM_RADIUS);
    // Cut the water hole out of the rim so only a bank remains.
    rimShape.holes.push(createPondShape(seed, WATER_RADIUS * 0.92, true));

    return {
      waterGeometry: new ExtrudeGeometry(waterShape, {
        depth: 0.008,
        bevelEnabled: false,
      }),
      rimGeometry: new ExtrudeGeometry(rimShape, {
        depth: RIM_HEIGHT,
        bevelEnabled: false,
      }),
    };
  }, [seed]);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh
        geometry={rimGeometry}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow={false}
        receiveShadow
      >
        <meshStandardMaterial map={dirtMap} roughness={0.95} metalness={0} />
      </mesh>
      <mesh
        geometry={waterGeometry}
        position={[0, RIM_HEIGHT * 0.35, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <PixelTextureMaterial texture="water" repeat={[2, 2]} />
      </mesh>
    </group>
  );
}

export function pondVariant(x: number, z: number) {
  const hash = Math.abs(x * 31847 + z * 87421);

  return {
    rotation: (hash % 45) * (Math.PI / 180),
    scale: 0.92 + (hash % 16) / 100,
    offsetX: ((hash % 10) - 5) / 140,
    offsetZ: (((hash / 10) % 10) - 5) / 140,
    seed: hash % 10000,
  };
}
