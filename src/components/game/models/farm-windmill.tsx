"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { GrassTilePointer } from "@/components/game/ground-plane";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";

export function FarmWindmillModel({
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
  const bladesRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 1.4;
    }
  });

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
      <mesh position={[-0.12, 0.22, 0.05]} {...pointerProps}>
        <boxGeometry args={[0.48, 0.44, 0.4]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh
        position={[-0.12, 0.48, 0.05]}
        rotation={[0, 0, 0.08]}
        {...pointerProps}
      >
        <boxGeometry args={[0.56, 0.1, 0.46]} />
        <meshStandardMaterial color="#7a3b2a" roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-0.12, 0.16, 0.26]} {...pointerProps}>
        <boxGeometry args={[0.14, 0.24, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.28, 0.28, -0.08]} {...pointerProps}>
        <boxGeometry args={[0.22, 0.56, 0.22]} />
        <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0.28, 0.6, -0.08]} {...pointerProps}>
        <boxGeometry args={[0.26, 0.1, 0.26]} />
        <meshStandardMaterial color="#5c4030" roughness={0.9} metalness={0} />
      </mesh>
      <group ref={bladesRef} position={[0.28, 0.58, 0.06]}>
        <mesh {...pointerProps}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial map={woodMap} roughness={0.85} metalness={0} />
        </mesh>
        {[0, 90, 180, 270].map((deg) => (
          <mesh
            key={`blade-${deg}`}
            rotation={[0, 0, (deg * Math.PI) / 180]}
            position={[0, 0.22, 0]}
            {...pointerProps}
          >
            <boxGeometry args={[0.08, 0.4, 0.04]} />
            <meshStandardMaterial
              color="#c4a574"
              roughness={0.8}
              metalness={0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function farmWindmillVariant(x: number, z: number) {
  const hash = Math.abs(x * 41927 + z * 73819);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.95 + (hash % 10) / 100,
  };
}
