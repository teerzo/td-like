"use client";

import { VoxelBox } from "@/components/game/models/voxel-box";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";

export const MOUNTAIN_VOXEL = 0.12;

type MountainBlock = {
  x: number;
  y: number;
  z: number;
};

function buildMountainBlocks() {
  const blocks: MountainBlock[] = [];
  const layers = [
    { y: 0, radius: 2 },
    { y: 1, radius: 2 },
    { y: 2, radius: 1 },
    { y: 3, radius: 1 },
    { y: 4, radius: 0 },
  ] as const;

  for (const layer of layers) {
    for (let x = -layer.radius; x <= layer.radius; x += 1) {
      for (let z = -layer.radius; z <= layer.radius; z += 1) {
        if (Math.abs(x) + Math.abs(z) <= layer.radius + 1) {
          blocks.push({ x, y: layer.y, z });
        }
      }
    }
  }

  return blocks;
}

const MOUNTAIN_BLOCKS = buildMountainBlocks();

export function MountainModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const stoneMap = useCastleSpriteMap("stone");

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {MOUNTAIN_BLOCKS.map((block, index) => (
        <VoxelBox
          key={`mountain-${index}`}
          position={[
            block.x * MOUNTAIN_VOXEL,
            block.y * MOUNTAIN_VOXEL + MOUNTAIN_VOXEL / 2,
            block.z * MOUNTAIN_VOXEL,
          ]}
          map={stoneMap}
          size={MOUNTAIN_VOXEL}
          textureRepeat={[1, 1]}
        />
      ))}
    </group>
  );
}

export function mountainVariant(x: number, z: number) {
  const hash = Math.abs(x * 67231 + z * 55337);

  return {
    rotation: (hash % 90) * (Math.PI / 180),
    scale: 0.9 + (hash % 20) / 100,
    offsetX: ((hash % 12) - 6) / 150,
    offsetZ: (((hash / 12) % 12) - 6) / 150,
  };
}
