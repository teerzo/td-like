"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { DebugHitbox } from "@/components/game/debug-hitbox";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";
import { TILE_SIZE } from "@/lib/terrain";

const PATCH_SIZE = TILE_SIZE * 0.88;

function pointerHandlers(
  onSelect?: (pointer: GrassTilePointer) => void,
) {
  if (!onSelect) {
    return {};
  }

  return {
    onClick: (event: {
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    }) => {
      event.stopPropagation();
      onSelect({ clientX: event.clientX, clientY: event.clientY });
    },
    onPointerOver: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "auto";
    },
  };
}

export function LumberPlotModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  selected = false,
  onSelect,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  selected?: boolean;
  onSelect?: (pointer: GrassTilePointer) => void;
}) {
  const woodMap = useCastleSpriteMap("wood");
  const pointerProps = pointerHandlers(onSelect);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {onSelect ? (
        <DebugHitbox
          size={[PATCH_SIZE, 0.22, PATCH_SIZE]}
          position={[0, 0.12, 0]}
          color="#a3e635"
        />
      ) : null}
      <mesh position={[-0.12, 0.07, 0.08]} rotation={[0, 0.4, 0.12]} {...pointerProps}>
        <cylinderGeometry args={[0.08, 0.08, 0.42, 8]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.14, 0.07, -0.06]} rotation={[0.15, -0.5, 0]} {...pointerProps}>
        <cylinderGeometry args={[0.07, 0.07, 0.38, 8]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.02, 0.14, 0.02]} rotation={[0, 0.2, 0.05]} {...pointerProps}>
        <cylinderGeometry args={[0.07, 0.07, 0.34, 8]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[TILE_SIZE * 0.9, TILE_SIZE * 0.9]} />
          <meshStandardMaterial
            color="#bef264"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function lumberPlotVariant(x: number, z: number) {
  const hash = Math.abs(x * 27449 + z * 59183);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.94 + (hash % 12) / 100,
  };
}

export function LumberMillModel({
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
  const woodMap = useCastleSpriteMap("wood");
  const stoneMap = useCastleSpriteMap("stone");
  const pointerProps = pointerHandlers(onSelect);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {onSelect ? (
        <DebugHitbox size={[0.95, 0.95, 0.95]} position={[0, 0.48, 0]} color="#84cc16" />
      ) : null}
      <mesh position={[-0.08, 0.28, 0]} {...pointerProps}>
        <boxGeometry args={[0.58, 0.56, 0.48]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[-0.08, 0.6, 0]} rotation={[0, 0, 0.08]} {...pointerProps}>
        <boxGeometry args={[0.68, 0.12, 0.56]} />
        <meshStandardMaterial color="#5c4030" roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.32, 0.22, 0.02]} {...pointerProps}>
        <boxGeometry args={[0.22, 0.44, 0.22]} />
        <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0.32, 0.48, 0.14]} rotation={[Math.PI / 2, 0, 0]} {...pointerProps}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0.22, 0.1, -0.28]} rotation={[0, 0.35, 0.1]} {...pointerProps}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.08, 0.1, -0.28]} rotation={[0, -0.2, -0.08]} {...pointerProps}>
        <cylinderGeometry args={[0.06, 0.06, 0.36, 8]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>
    </group>
  );
}

export function lumberMillVariant(x: number, z: number) {
  const hash = Math.abs(x * 38219 + z * 61837);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.92 + (hash % 10) / 100,
  };
}
