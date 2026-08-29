"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { DebugHitbox } from "@/components/game/debug-hitbox";
import type { GlobalGridCoord } from "@/lib/global-grid";
import { useGrassSpriteMap } from "@/lib/pixel-art/use-grass-sprite-maps";
import { grassTextureForTile } from "@/lib/pixel-art/grass-sprites";
import { TILE_SIZE } from "@/lib/terrain";

export const HILL_BASE_HEIGHT = 0.28;

const HILL_FOOTPRINT = TILE_SIZE * 0.96;
const SELECTED_OVERLAY_Y = 0.004;

export function HillTile({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  height = HILL_BASE_HEIGHT,
  tileX = 0,
  tileZ = 0,
  selected = false,
  onSelect,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  height?: number;
  tileX?: number;
  tileZ?: number;
  selected?: boolean;
  onSelect?: (pointer: GrassTilePointer) => void;
}) {
  const sprite = grassTextureForTile(tileX, tileZ);
  const grassMap = useGrassSpriteMap(sprite);

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
          size={[HILL_FOOTPRINT, height, HILL_FOOTPRINT]}
          position={[0, height / 2, 0]}
          color="#86efac"
        />
      ) : null}
      <mesh
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[HILL_FOOTPRINT, height, HILL_FOOTPRINT]} />
        <meshStandardMaterial
          color="#3f7a3a"
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      <mesh
        position={[0, height + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[HILL_FOOTPRINT, HILL_FOOTPRINT]} />
        <meshStandardMaterial
          map={grassMap}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {selected ? (
        <mesh
          position={[0, height + SELECTED_OVERLAY_Y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[HILL_FOOTPRINT, HILL_FOOTPRINT]} />
          <meshStandardMaterial
            color="#7dd3fc"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function hillVariant(x: number, z: number) {
  const hash = Math.abs(x * 7919 + z * 104729);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.94 + (hash % 12) / 100,
    height: HILL_BASE_HEIGHT + ((hash % 18) / 100),
    offsetX: ((hash % 8) - 4) / 200,
    offsetZ: (((hash / 8) % 8) - 4) / 200,
  };
}

/** Build a selectable hill handler for a global tile coord. */
export function hillSelectHandler(
  gx: number,
  gz: number,
  onSelectTile?: (coord: GlobalGridCoord, pointer: GrassTilePointer) => void,
) {
  if (!onSelectTile) {
    return undefined;
  }

  return (pointer: GrassTilePointer) => {
    onSelectTile({ gx, gz }, pointer);
  };
}
