"use client";

import type { TextureId } from "@/lib/pixel-art/textures";
import {
  PixelTextureMaterial,
} from "@/lib/pixel-art/use-pixel-texture";

const TRUNK_WIDTH = 0.14;
const TRUNK_HEIGHT = 0.36;
const FOLIAGE_SIZE = 0.52;

export function TreeModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, TRUNK_HEIGHT / 2, 0]}>
        <boxGeometry args={[TRUNK_WIDTH, TRUNK_HEIGHT, TRUNK_WIDTH]} />
        <PixelTextureMaterial texture="bark" repeat={[1, 2]} />
      </mesh>
      <mesh position={[0, TRUNK_HEIGHT + FOLIAGE_SIZE * 0.38, 0]}>
        <boxGeometry args={[FOLIAGE_SIZE, FOLIAGE_SIZE, FOLIAGE_SIZE]} />
        <PixelTextureMaterial texture="tree-foliage" repeat={[2, 2]} />
      </mesh>
      <mesh
        position={[0, TRUNK_HEIGHT + FOLIAGE_SIZE * 0.72, 0]}
        scale={[0.72, 0.55, 0.72]}
      >
        <boxGeometry args={[FOLIAGE_SIZE, FOLIAGE_SIZE, FOLIAGE_SIZE]} />
        <PixelTextureMaterial texture="tree-foliage" repeat={[2, 2]} />
      </mesh>
    </group>
  );
}

export function treeVariant(x: number, z: number) {
  const hash = Math.abs(x * 928371 + z * 689287);

  return {
    rotation: (hash % 360) * (Math.PI / 180),
    scale: 0.82 + (hash % 25) / 100,
    offsetX: ((hash % 20) - 10) / 120,
    offsetZ: (((hash / 20) % 20) - 10) / 120,
  };
}
