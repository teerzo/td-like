"use client";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { DebugHitbox } from "@/components/game/debug-hitbox";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";
import { PixelTextureMaterial } from "@/lib/pixel-art/use-pixel-texture";

export function FishingHutModel({
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

  const pointerProps = onSelect
    ? {
        onClick: handleClick,
        onPointerOver: handlePointerOver,
        onPointerOut: handlePointerOut,
      }
    : {};

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {onSelect ? (
        <DebugHitbox
          size={[0.85, 0.85, 0.85]}
          position={[0, 0.4, 0]}
          color="#38bdf8"
        />
      ) : null}

      {/* Dock planks over the water */}
      <mesh position={[0.08, 0.06, 0.18]} {...pointerProps}>
        <boxGeometry args={[0.62, 0.05, 0.34]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.08, 0.06, -0.02]} {...pointerProps}>
        <boxGeometry args={[0.5, 0.05, 0.22]} />
        <meshStandardMaterial map={woodMap} roughness={0.92} metalness={0} />
      </mesh>

      {/* Stilts */}
      {[
        [-0.18, 0.22],
        [0.28, 0.22],
        [-0.18, -0.08],
        [0.28, -0.08],
      ].map(([px, pz], index) => (
        <mesh key={`stilt-${index}`} position={[px!, 0.02, pz!]}>
          <boxGeometry args={[0.06, 0.12, 0.06]} />
          <meshStandardMaterial color="#3a2418" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* Hut cabin */}
      <mesh position={[-0.06, 0.28, -0.08]} {...pointerProps}>
        <boxGeometry args={[0.42, 0.36, 0.38]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      {/* Door */}
      <mesh position={[-0.06, 0.22, 0.12]} {...pointerProps}>
        <boxGeometry args={[0.14, 0.22, 0.04]} />
        <meshStandardMaterial color="#2a1a12" roughness={1} metalness={0} />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.06, 0.5, -0.08]} rotation={[0, 0, 0]} {...pointerProps}>
        <boxGeometry args={[0.5, 0.1, 0.46]} />
        <meshStandardMaterial color="#6b3a2a" roughness={0.95} metalness={0} />
      </mesh>
      <mesh
        position={[-0.06, 0.56, -0.08]}
        rotation={[0, Math.PI / 4, 0]}
        {...pointerProps}
      >
        <boxGeometry args={[0.36, 0.08, 0.36]} />
        <meshStandardMaterial color="#7a4632" roughness={0.95} metalness={0} />
      </mesh>

      {/* Dock post + fishing pole */}
      <mesh position={[0.3, 0.22, 0.22]}>
        <boxGeometry args={[0.05, 0.36, 0.05]} />
        <meshStandardMaterial map={woodMap} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0.38, 0.4, 0.28]} rotation={[0, 0, -0.85]}>
        <boxGeometry args={[0.04, 0.42, 0.04]} />
        <meshStandardMaterial color="#c4a574" roughness={0.8} metalness={0} />
      </mesh>
      {/* Small water ripple / fish crate */}
      <mesh position={[0.22, 0.12, 0.28]}>
        <boxGeometry args={[0.16, 0.1, 0.14]} />
        <meshStandardMaterial color="#5c4030" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.22, 0.18, 0.28]}>
        <boxGeometry args={[0.08, 0.05, 0.08]} />
        <PixelTextureMaterial texture="water" repeat={[1, 1]} />
      </mesh>
    </group>
  );
}

export function fishingHutVariant(x: number, z: number) {
  const hash = Math.abs(x * 52841 + z * 29173);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.92 + (hash % 12) / 100,
  };
}
