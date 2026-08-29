"use client";

import { VOXEL } from "@/components/game/models/voxel-box";
import type { EnemyTypeId } from "@/lib/enemy-types";

const ENEMY_PALETTES: Record<
  EnemyTypeId,
  { body: string; head: string; emissive: string }
> = {
  grunt: {
    body: "#c0392b",
    head: "#e74c3c",
    emissive: "#922b21",
  },
  flyer: {
    body: "#2563eb",
    head: "#60a5fa",
    emissive: "#1e3a8a",
  },
};

export function EnemyModel({
  typeId = "grunt",
}: {
  typeId?: EnemyTypeId;
}) {
  const palette = ENEMY_PALETTES[typeId];
  const bodyHeight = VOXEL * 1.35;

  return (
    <group>
      <mesh position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[VOXEL * 1.35, bodyHeight, VOXEL * 1.35]} />
        <meshStandardMaterial
          color={palette.body}
          emissive={palette.emissive}
          emissiveIntensity={0.35}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, bodyHeight + VOXEL * 0.55, 0]}>
        <boxGeometry args={[VOXEL * 1.05, VOXEL * 1.05, VOXEL * 1.05]} />
        <meshStandardMaterial
          color={palette.head}
          emissive={palette.emissive}
          emissiveIntensity={0.25}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[VOXEL * 0.22, bodyHeight + VOXEL * 0.65, VOXEL * 0.42]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#140909" roughness={0.8} />
      </mesh>
      <mesh position={[-VOXEL * 0.22, bodyHeight + VOXEL * 0.65, VOXEL * 0.42]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#140909" roughness={0.8} />
      </mesh>
    </group>
  );
}
