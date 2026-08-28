"use client";

import type * as THREE from "three";

import { DIRT_TILE_SIZE } from "@/lib/terrain";

/** Slightly above grass so road tiles render on top without z-fighting. */
export const DIRT_ROAD_Y = 0.01;

export const DIRT_TILE_REPEAT: [number, number] = [1, 1];

export function DirtRoadTile({
  map,
  position = [0, DIRT_ROAD_Y, 0],
  opacity = 1,
}: {
  map: THREE.Texture;
  position?: [number, number, number];
  opacity?: number;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
    >
      <planeGeometry args={[DIRT_TILE_SIZE, DIRT_TILE_SIZE]} />
      <meshStandardMaterial
        map={map}
        roughness={0.95}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
      />
    </mesh>
  );
}
