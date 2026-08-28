"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { EnemyModel } from "@/components/game/models/enemy";
import { TILE_SPACING } from "@/lib/terrain";

const ENEMY_SPEED = TILE_SPACING * 1.25;

type EnemyWalkerProps = {
  path: [number, number, number][];
  onReachExit?: () => void;
  onPositionUpdate?: (position: [number, number, number]) => void;
};

export function EnemyWalker({
  path,
  onReachExit,
  onPositionUpdate,
}: EnemyWalkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const finished = useRef(false);

  useFrame((_, delta) => {
    if (finished.current || path.length < 2 || !groupRef.current) {
      return;
    }

    progress.current += (ENEMY_SPEED / TILE_SPACING) * delta;
    const maxProgress = path.length - 1;

    if (progress.current >= maxProgress) {
      progress.current = maxProgress;
      finished.current = true;
      onReachExit?.();
    }

    const segmentIndex = Math.min(Math.floor(progress.current), path.length - 2);
    const segmentT = progress.current - segmentIndex;
    const start = path[segmentIndex]!;
    const end = path[segmentIndex + 1]!;

    groupRef.current.position.set(
      start[0] + (end[0] - start[0]) * segmentT,
      start[1] + (end[1] - start[1]) * segmentT,
      start[2] + (end[2] - start[2]) * segmentT,
    );
    groupRef.current.rotation.y = Math.atan2(
      end[0] - start[0],
      end[2] - start[2],
    );

    onPositionUpdate?.([
      groupRef.current.position.x,
      groupRef.current.position.y,
      groupRef.current.position.z,
    ]);
  });

  const start = path[0] ?? ([0, 0, 0] as [number, number, number]);

  return (
    <group ref={groupRef} position={start}>
      <EnemyModel />
    </group>
  );
}
