"use client";

import { PixelTextureMaterial } from "@/lib/pixel-art/use-pixel-texture";
import { useDirtRoadSpriteMap } from "@/lib/pixel-art/use-dirt-road-sprite-maps";
import { TILE_SIZE } from "@/lib/terrain";

export const POND_Y = 0.012;

const POND_SIZE = TILE_SIZE * 0.82;
const RIM_SIZE = TILE_SIZE * 0.94;
const RIM_HEIGHT = 0.04;

export function PondModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const dirtMap = useDirtRoadSpriteMap("dirt");

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, POND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[POND_SIZE, POND_SIZE]} />
        <PixelTextureMaterial texture="water" repeat={[2, 2]} />
      </mesh>
      {(
        [
          [0, -RIM_SIZE / 2, RIM_SIZE, RIM_HEIGHT],
          [0, RIM_SIZE / 2, RIM_SIZE, RIM_HEIGHT],
          [-RIM_SIZE / 2, 0, RIM_HEIGHT, RIM_SIZE],
          [RIM_SIZE / 2, 0, RIM_HEIGHT, RIM_SIZE],
        ] as const
      ).map(([x, z, width, depth], index) => (
        <mesh
          key={`pond-rim-${index}`}
          position={[x, RIM_HEIGHT / 2, z]}
        >
          <boxGeometry args={[width, RIM_HEIGHT, depth]} />
          <meshStandardMaterial map={dirtMap} roughness={0.95} metalness={0} />
        </mesh>
      ))}
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
  };
}
