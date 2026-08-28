"use client";

import { CASTLE_VOXEL } from "@/components/game/models/castle-blocks";
import { useCastleSpriteMaps } from "@/lib/pixel-art/use-castle-sprite-maps";
import type { CastleSpriteId } from "@/lib/pixel-art/castle-sprites";

type Block = {
  x: number;
  y: number;
  z: number;
  texture: CastleSpriteId;
};

function addBlock(
  blocks: Map<string, Block>,
  x: number,
  y: number,
  z: number,
  texture: CastleSpriteId,
) {
  blocks.set(`${x}:${y}:${z}`, { x, y, z, texture });
}

function addSolidBox(
  blocks: Map<string, Block>,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  texture: CastleSpriteId,
) {
  for (let x = x0; x <= x1; x += 1) {
    for (let z = z0; z <= z1; z += 1) {
      for (let y = y0; y <= y1; y += 1) {
        addBlock(blocks, x, y, z, texture);
      }
    }
  }
}

function addTownWallRing(
  blocks: Map<string, Block>,
  radius: number,
  y0: number,
  y1: number,
  gateZ: number,
) {
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const onWall = Math.abs(x) === radius || Math.abs(z) === radius;
      const inGateway = z === gateZ && x === 0 && Math.abs(z) === radius;

      if (!onWall || inGateway) {
        continue;
      }

      for (let y = y0; y <= y1; y += 1) {
        addBlock(blocks, x, y, z, "stone");
      }
    }
  }
}

function addShaftBattlements(
  blocks: Map<string, Block>,
  radius: number,
  y: number,
) {
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const onEdge = Math.abs(x) === radius || Math.abs(z) === radius;

      if (!onEdge || (x + z + radius) % 2 !== 0) {
        continue;
      }

      addBlock(blocks, x, y, z, "stone");
    }
  }
}

function buildRookTownBlocks() {
  const blocks = new Map<string, Block>();
  const townRadius = 2;
  const shaftRadius = 1;
  const gateZ = townRadius;

  addTownWallRing(blocks, townRadius, 0, 1, gateZ);

  addBlock(blocks, 0, 0, gateZ, "wood");
  addBlock(blocks, 0, 1, gateZ, "wood");

  addBlock(blocks, -1, 0, -1, "wood");
  addBlock(blocks, 1, 0, -1, "wood");
  addBlock(blocks, -1, 0, 1, "wood");
  addBlock(blocks, 1, 0, 1, "wood");
  addBlock(blocks, 0, 0, 0, "wood");

  addSolidBox(
    blocks,
    -shaftRadius,
    shaftRadius,
    2,
    5,
    -shaftRadius,
    shaftRadius,
    "stone",
  );

  addShaftBattlements(blocks, shaftRadius, 6);

  for (const [x, z] of [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    addBlock(blocks, x, 7, z, "roof");
  }

  return [...blocks.values()];
}

const ROOK_TOWN_BLOCKS = buildRookTownBlocks();

export function TowerModel({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const textureMaps = useCastleSpriteMaps();

  return (
    <group position={position}>
      {ROOK_TOWN_BLOCKS.map((block, index) => (
        <mesh
          key={`tower-${index}`}
          position={[
            block.x * CASTLE_VOXEL,
            block.y * CASTLE_VOXEL + CASTLE_VOXEL / 2,
            block.z * CASTLE_VOXEL,
          ]}
        >
          <boxGeometry args={[CASTLE_VOXEL, CASTLE_VOXEL, CASTLE_VOXEL]} />
          <meshStandardMaterial
            map={textureMaps[block.texture]}
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
