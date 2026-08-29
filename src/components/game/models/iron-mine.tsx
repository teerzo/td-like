"use client";

import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";

export function IronMineModel({
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
      <mesh position={[0, 0.08, -0.05]}>
        <boxGeometry args={[0.78, 0.16, 0.62]} />
        <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0, 0.2, 0.12]}>
        <boxGeometry args={[0.42, 0.34, 0.28]} />
        <meshStandardMaterial color="#141820" roughness={1} metalness={0} />
      </mesh>
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
      <mesh position={[-0.22, 0.14, -0.18]}>
        <boxGeometry args={[0.18, 0.14, 0.16]} />
        <meshStandardMaterial
          color="#8a939e"
          emissive="#3a4048"
          emissiveIntensity={0.25}
          roughness={0.45}
          metalness={0.7}
        />
      </mesh>
      <mesh position={[0.2, 0.12, -0.14]}>
        <boxGeometry args={[0.14, 0.12, 0.14]} />
        <meshStandardMaterial
          color="#a8b0ba"
          emissive="#3a4048"
          emissiveIntensity={0.2}
          roughness={0.45}
          metalness={0.7}
        />
      </mesh>
      <mesh position={[0.02, 0.18, -0.22]}>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshStandardMaterial
          color="#6e7782"
          emissive="#2a3038"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.75}
        />
      </mesh>
    </group>
  );
}

export function ironMineVariant(x: number, z: number) {
  const hash = Math.abs(x * 42853 + z * 57131);

  return {
    rotation: ((hash % 4) * 90) * (Math.PI / 180),
    scale: 0.95 + (hash % 10) / 100,
  };
}
