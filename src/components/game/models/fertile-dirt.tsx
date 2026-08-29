"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { TILE_SIZE } from "@/lib/terrain";

const PATCH_SIZE = TILE_SIZE * 0.92;
const FURROW_Y = 0.012;

export function FertileDirtModel({
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
      <mesh
        position={[0, 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[PATCH_SIZE, PATCH_SIZE]} />
        <meshStandardMaterial color="#6b4423" roughness={1} metalness={0} />
      </mesh>
      {[-0.28, -0.14, 0, 0.14, 0.28].map((offset) => (
        <mesh
          key={`furrow-${offset}`}
          position={[0, FURROW_Y, offset]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[PATCH_SIZE * 0.88, 0.04]} />
          <meshStandardMaterial color="#4a2f18" roughness={1} metalness={0} />
        </mesh>
      ))}
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[PATCH_SIZE, PATCH_SIZE]} />
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

export function fertileDirtVariant(x: number, z: number) {
  const hash = Math.abs(x * 53129 + z * 28753);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.96 + (hash % 8) / 100,
  };
}
