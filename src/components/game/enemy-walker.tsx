"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { EnemyModel } from "@/components/game/models/enemy";
import type { EnemyMovementType, EnemyTypeId } from "@/lib/enemy-types";

const FLYING_Y_OFFSET = 0.35;
const DEATH_DURATION = 0.55;

type EnemyWalkerProps = {
  path: [number, number, number][];
  typeId: EnemyTypeId;
  moveSpeed: number;
  movementType: EnemyMovementType;
  dying?: boolean;
  /** When true, the enemy holds position (daytime). */
  paused?: boolean;
  onReachExit?: () => void;
  onDeathComplete?: () => void;
  onPositionUpdate?: (position: [number, number, number]) => void;
};

export function EnemyWalker({
  path,
  typeId,
  moveSpeed,
  movementType,
  dying = false,
  paused = false,
  onReachExit,
  onDeathComplete,
  onPositionUpdate,
}: EnemyWalkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const finished = useRef(false);
  const deathProgress = useRef(0);
  const deathDone = useRef(false);
  const yOffset = movementType === "flying" ? FLYING_Y_OFFSET : 0;

  useFrame((_, delta) => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group) {
      return;
    }

    if (dying) {
      if (deathDone.current) {
        return;
      }

      deathProgress.current = Math.min(1, deathProgress.current + delta / DEATH_DURATION);
      const t = deathProgress.current;
      // Ease-out fall, squash, and fade.
      const ease = 1 - (1 - t) * (1 - t);

      if (model) {
        model.rotation.x = ease * (Math.PI / 2);
        model.position.y = -ease * 0.35;
        const squash = 1 - ease * 0.55;
        const stretch = 1 + ease * 0.25;
        model.scale.set(stretch, squash, stretch);
        model.traverse((child) => {
          if (
            "material" in child &&
            child.material &&
            typeof child.material === "object" &&
            "opacity" in child.material
          ) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.transparent = true;
            material.depthWrite = t < 0.85;
            material.opacity = 1 - ease;
          }
        });
      }

      if (t >= 1) {
        deathDone.current = true;
        onDeathComplete?.();
      }

      return;
    }

    if (finished.current || path.length < 2) {
      return;
    }

    if (!paused) {
      progress.current += moveSpeed * delta;
    }

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

    group.position.set(
      start[0] + (end[0] - start[0]) * segmentT,
      start[1] + (end[1] - start[1]) * segmentT + yOffset,
      start[2] + (end[2] - start[2]) * segmentT,
    );
    group.rotation.y = Math.atan2(end[0] - start[0], end[2] - start[2]);

    onPositionUpdate?.([
      group.position.x,
      group.position.y,
      group.position.z,
    ]);
  });

  const start = path[0] ?? ([0, 0, 0] as [number, number, number]);

  return (
    <group ref={groupRef} position={[start[0], start[1] + yOffset, start[2]]}>
      <group ref={modelRef}>
        <EnemyModel typeId={typeId} />
      </group>
    </group>
  );
}
