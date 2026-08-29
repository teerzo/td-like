"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { DebugHitbox } from "@/components/game/debug-hitbox";
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
  onSelect,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  onSelect?: (pointer: GrassTilePointer) => void;
}) {
  const stoneMap = useCastleSpriteMap("stone");

  function handleClick(event: {
    stopPropagation: () => void;
    clientX: number;
    clientY: number;
  }) {
    if (!onSelect) {
      return;
    }

    event.stopPropagation();
    onSelect({ clientX: event.clientX, clientY: event.clientY });
  }

  function handlePointerOver(event: { stopPropagation: () => void }) {
    if (!onSelect) {
      return;
    }

    event.stopPropagation();
    document.body.style.cursor = "pointer";
  }

  function handlePointerOut() {
    if (!onSelect) {
      return;
    }

    document.body.style.cursor = "auto";
  }

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {onSelect ? (
        <DebugHitbox size={[0.45, 0.4, 0.4]} position={[0, 0.2, 0]} color="#a8a29e" />
      ) : null}
      {ROCK_BLOCKS.map((block, index) => (
        <mesh
          key={`rock-${index}`}
          position={block.position}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
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
