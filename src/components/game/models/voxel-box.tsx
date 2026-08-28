"use client";

import type * as THREE from "three";

import { PixelTextureMaterial } from "@/lib/pixel-art/use-pixel-texture";
import type { TextureId } from "@/lib/pixel-art/textures";

const VOXEL = 0.22;

export function VoxelBox({
  position,
  texture,
  map,
  size = VOXEL,
  textureRepeat = [2, 2],
}: {
  position: [number, number, number];
  texture?: TextureId;
  map?: THREE.Texture;
  size?: number;
  textureRepeat?: [number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size, size]} />
      {map ? (
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      ) : (
        <PixelTextureMaterial texture={texture!} repeat={textureRepeat} />
      )}
    </mesh>
  );
}

export { VOXEL };
