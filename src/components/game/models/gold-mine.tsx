"use client";

import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";

export function GoldMineModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const stoneMap = useCastleSpriteMap("stone");
  const woodMap = useCastleSpriteMap("wood");

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Mound / berm */}
      <mesh position={[0, 0.08, -0.05]}>
        <boxGeometry args={[0.78, 0.16, 0.62]} />
        <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
      </mesh>
      {/* Tunnel mouth */}
      <mesh position={[0, 0.2, 0.12]}>
        <boxGeometry args={[0.42, 0.34, 0.28]} />
        <meshStandardMaterial color="#1a1520" roughness={1} metalness={0} />
      </mesh>
      {/* Timber frame */}
      <mesh position={[-0.24, 0.22, 0.24]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.24, 0.22, 0.24]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.4, 0.24]}>
        <boxGeometry args={[0.56, 0.08, 0.08]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      {/* Gold ore piles */}
      <mesh position={[-0.22, 0.14, -0.18]}>
        <boxGeometry args={[0.18, 0.14, 0.16]} />
        <meshStandardMaterial
          color="#e8c84a"
          emissive="#a67c00"
          emissiveIntensity={0.35}
          roughness={0.55}
          metalness={0.45}
        />
      </mesh>
      <mesh position={[0.2, 0.12, -0.14]}>
        <boxGeometry args={[0.14, 0.12, 0.14]} />
        <meshStandardMaterial
          color="#f0d56a"
          emissive="#a67c00"
          emissiveIntensity={0.3}
          roughness={0.55}
          metalness={0.45}
        />
      </mesh>
      <mesh position={[0.02, 0.18, -0.22]}>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshStandardMaterial
          color="#d4af37"
          emissive="#8a6a00"
          emissiveIntensity={0.4}
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

export function goldMineVariant(x: number, z: number) {
  const hash = Math.abs(x * 61543 + z * 39419);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.95 + (hash % 10) / 100,
  };
}
