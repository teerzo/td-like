"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { DebugHitbox } from "@/components/game/debug-hitbox";
import { TILE_SIZE } from "@/lib/terrain";

const PATCH_SIZE = TILE_SIZE * 0.9;

export type OreDepositKind = "gold" | "iron";

const DEPOSIT_COLORS: Record<
  OreDepositKind,
  { ground: string; ore: string; oreEmissive: string }
> = {
  gold: {
    ground: "#5a4a32",
    ore: "#e8c84a",
    oreEmissive: "#a67c00",
  },
  iron: {
    ground: "#3a4048",
    ore: "#8a939e",
    oreEmissive: "#4a5560",
  },
};

export function OreDepositModel({
  kind,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  selected = false,
  onSelect,
}: {
  kind: OreDepositKind;
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  selected?: boolean;
  onSelect?: (pointer: GrassTilePointer) => void;
}) {
  const colors = DEPOSIT_COLORS[kind];

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
        <DebugHitbox
          size={[PATCH_SIZE, 0.35, PATCH_SIZE]}
          position={[0, 0.18, 0]}
          color={kind === "gold" ? "#fbbf24" : "#94a3b8"}
        />
      ) : null}
      <mesh
        position={[0, 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[PATCH_SIZE, PATCH_SIZE]} />
        <meshStandardMaterial
          color={colors.ground}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {(
        [
          [-0.18, 0.06, -0.12, 0.2, 0.1, 0.16],
          [0.16, 0.05, 0.08, 0.16, 0.08, 0.14],
          [0.02, 0.07, -0.2, 0.14, 0.09, 0.12],
        ] as const
      ).map(([x, y, z, w, h, d], index) => (
        <mesh
          key={`ore-${index}`}
          position={[x, y, z]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={colors.ore}
            emissive={colors.oreEmissive}
            emissiveIntensity={0.25}
            roughness={0.55}
            metalness={0.4}
          />
        </mesh>
      ))}
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[PATCH_SIZE, PATCH_SIZE]} />
          <meshStandardMaterial
            color="#7dd3fc"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function oreDepositVariant(x: number, z: number) {
  const hash = Math.abs(x * 61543 + z * 39419);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.95 + (hash % 10) / 100,
  };
}
