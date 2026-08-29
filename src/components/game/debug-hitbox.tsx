"use client";

import type { ThreeEvent } from "@react-three/fiber";

import { usePlayPerfFlags } from "@/components/game/play-perf-toggles";

type DebugHitboxProps = {
  /** Box size in world units `[width, height, depth]`. */
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
};

/**
 * Wireframe overlay for clickable volumes. Does not participate in raycasting.
 * Only renders when the Perf → Hits debug toggle is on.
 */
export function DebugHitbox({
  size,
  position = [0, 0, 0],
  color = "#34d399",
}: DebugHitboxProps) {
  const { hitboxes } = usePlayPerfFlags();
  if (!hitboxes) {
    return null;
  }

  return (
    <mesh position={position} raycast={() => {}}>
      <boxGeometry args={size} />
      <meshBasicMaterial
        color={color}
        wireframe
        depthTest={false}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

type DebugClickVolumeProps = {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
};

/** Click volume: invisible normally, wireframe when hitbox debug is on. */
export function DebugClickVolume({
  size,
  position = [0, 0, 0],
  color = "#34d399",
  onClick,
  onPointerOver,
  onPointerOut,
}: DebugClickVolumeProps) {
  const { hitboxes } = usePlayPerfFlags();

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <boxGeometry args={size} />
      {hitboxes ? (
        <meshBasicMaterial
          color={color}
          wireframe
          depthTest={false}
          transparent
          opacity={0.95}
        />
      ) : (
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      )}
    </mesh>
  );
}
