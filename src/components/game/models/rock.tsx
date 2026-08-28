"use client";

import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";

const ROCK_BLOCKS = [
  { position: [0, 0.08, 0] as const, size: [0.34, 0.16, 0.28] as const },
  { position: [0.1, 0.2, -0.05] as const, size: [0.22, 0.14, 0.2] as const },
  { position: [-0.09, 0.17, 0.08] as const, size: [0.18, 0.12, 0.16] as const },
  { position: [0.04, 0.28, 0.02] as const, size: [0.16, 0.1, 0.14] as const },
] as const;

export function RockModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const stoneMap = useCastleSpriteMap("stone");

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {ROCK_BLOCKS.map((block, index) => (
        <mesh key={`rock-${index}`} position={block.position}>
          <boxGeometry args={block.size} />
          <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

export function rockVariant(x: number, z: number) {
  const hash = Math.abs(x * 48271 + z * 97331);

  return {
    rotation: (hash % 360) * (Math.PI / 180),
    scale: 0.85 + (hash % 30) / 100,
    offsetX: ((hash % 16) - 8) / 120,
    offsetZ: (((hash / 16) % 16) - 8) / 120,
  };
}
