"use client";

import { CASTLE_VOXEL } from "@/components/game/models/castle-blocks";
import { DebugClickVolume } from "@/components/game/debug-hitbox";
import { useCastleSpriteMaps } from "@/lib/pixel-art/use-castle-sprite-maps";
import type { CastleSpriteId } from "@/lib/pixel-art/castle-sprites";
import { TILE_SIZE } from "@/lib/terrain";

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

function addStoneCurtainWall(
  blocks: Map<string, Block>,
  radius: number,
  height: number,
  gateZ: number,
) {
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const onWall = Math.abs(x) === radius || Math.abs(z) === radius;
      const inGateway =
        z === gateZ && Math.abs(x) <= 1 && Math.abs(z) === radius;

      if (!onWall || inGateway) {
        continue;
      }

      for (let y = 0; y < height; y += 1) {
        addBlock(blocks, x, y, z, "stone");
      }
    }
  }
}

function addWallBattlements(
  blocks: Map<string, Block>,
  radius: number,
  y: number,
  gateZ: number,
) {
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const onWall = Math.abs(x) === radius || Math.abs(z) === radius;
      const inGateway = z === gateZ && Math.abs(x) <= 1;

      if (!onWall || inGateway || (x + z + radius) % 2 !== 0) {
        continue;
      }

      addBlock(blocks, x, y, z, "stone");
    }
  }
}

function addCornerTower(
  blocks: Map<string, Block>,
  x0: number,
  z0: number,
  height: number,
) {
  addSolidBox(blocks, x0, x0 + 1, 0, height - 1, z0, z0 + 1, "stone");
  addBlock(blocks, x0, height, z0, "roof");
  addBlock(blocks, x0 + 1, height, z0, "roof");
  addBlock(blocks, x0, height, z0 + 1, "roof");
  addBlock(blocks, x0 + 1, height, z0 + 1, "roof");
  addBlock(blocks, x0, height + 1, z0, "roof");
  addBlock(blocks, x0 + 1, height + 1, z0 + 1, "roof");
}

function addGatehouse(blocks: Map<string, Block>, gateZ: number) {
  for (let y = 0; y <= 2; y += 1) {
    addBlock(blocks, -1, y, gateZ, "wood");
    addBlock(blocks, 1, y, gateZ, "wood");
  }

  addBlock(blocks, 0, 0, gateZ, "wood");
  addSolidBox(blocks, -1, 1, 2, 2, gateZ, gateZ, "wood");
  addBlock(blocks, 0, 3, gateZ - 1, "wood");
}

function addKeep(blocks: Map<string, Block>) {
  addSolidBox(blocks, -1, 0, 0, 4, -1, 0, "stone");
  addBlock(blocks, -1, 5, -1, "roof");
  addBlock(blocks, 0, 5, -1, "roof");
  addBlock(blocks, -1, 5, 0, "roof");
  addBlock(blocks, 0, 5, 0, "roof");
  addBlock(blocks, -1, 6, -1, "roof");
  addBlock(blocks, 0, 6, 0, "roof");
}

function buildCastleBlocks() {
  const blocks = new Map<string, Block>();
  const radius = 2;
  const gateZ = radius;

  addStoneCurtainWall(blocks, radius, 3, gateZ);
  addWallBattlements(blocks, radius, 3, gateZ);

  addCornerTower(blocks, -2, -2, 5);
  addCornerTower(blocks, 1, -2, 5);
  addCornerTower(blocks, -2, 1, 5);
  addCornerTower(blocks, 1, 1, 5);

  addKeep(blocks);
  addGatehouse(blocks, gateZ);

  addSolidBox(blocks, -1, 1, 0, 0, -1, 1, "stone");

  return [...blocks.values()];
}

const CASTLE_BLOCKS = buildCastleBlocks();

type CastlePointer = { clientX: number; clientY: number };

export function CastleModel({
  position = [0, 0, 0],
  onClick,
}: {
  position?: [number, number, number];
  onClick?: (pointer: CastlePointer) => void;
}) {
  const textureMaps = useCastleSpriteMaps();

  return (
    <group position={position}>
      {/* Tile-sized click volume (wireframe when Hits debug is on). */}
      <DebugClickVolume
        position={[0, TILE_SIZE / 2, 0]}
        size={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}
        color="#fbbf24"
        onClick={(event) => {
          if (!onClick) {
            return;
          }
          event.stopPropagation();
          onClick({ clientX: event.clientX, clientY: event.clientY });
        }}
        onPointerOver={(event) => {
          if (!onClick) {
            return;
          }
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (!onClick) {
            return;
          }
          document.body.style.cursor = "auto";
        }}
      />
      {CASTLE_BLOCKS.map((block, index) => (
        <mesh
          key={`castle-${index}`}
          position={[
            block.x * CASTLE_VOXEL,
            block.y * CASTLE_VOXEL + CASTLE_VOXEL / 2,
            block.z * CASTLE_VOXEL,
          ]}
          raycast={() => null}
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
