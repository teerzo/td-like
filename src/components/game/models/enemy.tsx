"use client";

import { VOXEL } from "@/components/game/models/voxel-box";

const ENEMY_COLOR = "#c0392b";
const ENEMY_DARK = "#922b21";

export function EnemyModel() {
  const bodyHeight = VOXEL * 1.35;

  return (
    <group>
      <mesh position={[0, bodyHeight / 2, 0]}>
        <boxGeometry args={[VOXEL * 1.35, bodyHeight, VOXEL * 1.35]} />
        <meshStandardMaterial
          color={ENEMY_COLOR}
          emissive={ENEMY_DARK}
          emissiveIntensity={0.35}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, bodyHeight + VOXEL * 0.55, 0]}>
        <boxGeometry args={[VOXEL * 1.05, VOXEL * 1.05, VOXEL * 1.05]} />
        <meshStandardMaterial
          color="#e74c3c"
          emissive={ENEMY_DARK}
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
