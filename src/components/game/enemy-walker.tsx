"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { EnemyHealthBar } from "@/components/game/enemy-health-bar";
import { EnemyModel } from "@/components/game/models/enemy";
import type { EnemyMovementType, EnemyTypeId } from "@/lib/enemy-types";
import { TILE_SPACING } from "@/lib/terrain";

const FLYING_Y_OFFSET = 0.35;
const DEATH_DURATION = 0.55;

function polylineCumulativeLengths(path: [number, number, number][]) {
  const lengths = [0];
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1]!;
    const b = path[i]!;
    lengths.push(
      lengths[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    );
  }
  return { lengths, total: lengths[lengths.length - 1] ?? 0 };
}

function samplePolyline(
  path: [number, number, number][],
  lengths: number[],
  distance: number,
) {
  const last = path.length - 1;
  if (distance >= (lengths[last] ?? 0)) {
    return { start: path[last - 1]!, end: path[last]!, t: 1 };
  }

  let i = 0;
  while (i < last - 1 && (lengths[i + 1] ?? 0) < distance) {
    i += 1;
  }
  const segLen = (lengths[i + 1] ?? 0) - (lengths[i] ?? 0);
  const t = segLen <= 1e-8 ? 1 : (distance - (lengths[i] ?? 0)) / segLen;
  return { start: path[i]!, end: path[i + 1]!, t };
}

type EnemyWalkerProps = {
  path: [number, number, number][];
  typeId: EnemyTypeId;
  moveSpeed: number;
  movementType: EnemyMovementType;
  hp: number;
  maxHp: number;
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
  hp,
  maxHp,
  dying = false,
  paused = false,
  onReachExit,
  onDeathComplete,
  onPositionUpdate,
}: EnemyWalkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const distanceTraveled = useRef(0);
  const finished = useRef(false);
  const deathProgress = useRef(0);
  const deathDone = useRef(false);
  const yOffset = movementType === "flying" ? FLYING_Y_OFFSET : 0;
  const { lengths, total } = useMemo(
    () => polylineCumulativeLengths(path),
    [path],
  );

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
      distanceTraveled.current += moveSpeed * TILE_SPACING * delta;
    }

    if (total <= 0 || distanceTraveled.current >= total) {
      distanceTraveled.current = total;
      finished.current = true;
      onReachExit?.();
    }

    const { start, end, t: segmentT } = samplePolyline(
      path,
      lengths,
      distanceTraveled.current,
    );

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
      {!dying ? <EnemyHealthBar hp={hp} maxHp={maxHp} /> : null}
    </group>
  );
}
