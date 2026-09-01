"use client";

import { CASTLE_VOXEL } from "@/components/game/models/castle-blocks";
import type { CastleSpriteId } from "@/lib/pixel-art/castle-sprites";
import type { TextureId } from "@/lib/pixel-art/textures";
import { useCastleSpriteMaps } from "@/lib/pixel-art/use-castle-sprite-maps";
import { usePixelTextureMap } from "@/lib/pixel-art/use-pixel-texture";
import type { TowerTypeId } from "@/lib/tower-types";
import type * as THREE from "three";

type BlockMaterial =
  | { kind: "castle"; id: CastleSpriteId }
  | { kind: "pixel"; id: TextureId };

type Block = {
  x: number;
  y: number;
  z: number;
  material: BlockMaterial;
};

function addBlock(
  blocks: Map<string, Block>,
  x: number,
  y: number,
  z: number,
  material: BlockMaterial,
) {
  blocks.set(`${x}:${y}:${z}`, { x, y, z, material });
}

function addSolidBox(
  blocks: Map<string, Block>,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  material: BlockMaterial,
) {
  for (let x = x0; x <= x1; x += 1) {
    for (let z = z0; z <= z1; z += 1) {
      for (let y = y0; y <= y1; y += 1) {
        addBlock(blocks, x, y, z, material);
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
        addBlock(blocks, x, y, z, { kind: "castle", id: "stone" });
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

      addBlock(blocks, x, y, z, { kind: "castle", id: "stone" });
    }
  }
}

function buildCannonBlocks() {
  const blocks = new Map<string, Block>();
  const townRadius = 2;
  const shaftRadius = 1;
  const gateZ = townRadius;

  addTownWallRing(blocks, townRadius, 0, 1, gateZ);

  addBlock(blocks, 0, 0, gateZ, { kind: "castle", id: "wood" });
  addBlock(blocks, 0, 1, gateZ, { kind: "castle", id: "wood" });

  addBlock(blocks, -1, 0, -1, { kind: "castle", id: "wood" });
  addBlock(blocks, 1, 0, -1, { kind: "castle", id: "wood" });
  addBlock(blocks, -1, 0, 1, { kind: "castle", id: "wood" });
  addBlock(blocks, 1, 0, 1, { kind: "castle", id: "wood" });
  addBlock(blocks, 0, 0, 0, { kind: "castle", id: "wood" });

  addSolidBox(
    blocks,
    -shaftRadius,
    shaftRadius,
    2,
    5,
    -shaftRadius,
    shaftRadius,
    { kind: "castle", id: "stone" },
  );

  addShaftBattlements(blocks, shaftRadius, 6);

  for (const [x, z] of [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    addBlock(blocks, x, 7, z, { kind: "castle", id: "roof" });
  }

  return [...blocks.values()];
}

/** Tall thin lookout — brick base, bark shaft, wood crow's nest. */
function buildArcherBlocks() {
  const blocks = new Map<string, Block>();

  addSolidBox(blocks, -1, 1, 0, 0, -1, 1, { kind: "pixel", id: "brick" });
  addSolidBox(blocks, 0, 0, 1, 7, 0, 0, { kind: "pixel", id: "bark" });
  addSolidBox(blocks, -1, 1, 8, 8, -1, 1, { kind: "castle", id: "wood" });

  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    addBlock(blocks, x, 9, z, { kind: "castle", id: "wood" });
  }

  addBlock(blocks, 0, 9, 0, { kind: "castle", id: "roof" });

  return [...blocks.values()];
}

/** Stone frame with a heavy bolt arm — anti-tank siege piece. */
function buildBallistaBlocks() {
  const blocks = new Map<string, Block>();

  addSolidBox(blocks, -2, 2, 0, 0, -2, 2, { kind: "castle", id: "stone" });
  addSolidBox(blocks, -1, 1, 1, 2, -1, 1, { kind: "castle", id: "wood" });

  for (const z of [-1, 0, 1] as const) {
    addBlock(blocks, 2, 1, z, { kind: "castle", id: "wood" });
    addBlock(blocks, 3, 1, z, { kind: "castle", id: "wood" });
  }

  addBlock(blocks, 4, 1, 0, { kind: "castle", id: "stone" });
  addBlock(blocks, 0, 3, 0, { kind: "castle", id: "wood" });
  addBlock(blocks, 0, 4, 0, { kind: "castle", id: "roof" });

  return [...blocks.values()];
}

/** Squatter mage keep — brick walls, stone crown, peaked roof, water tip. */
function buildMageBlocks() {
  const blocks = new Map<string, Block>();

  addSolidBox(blocks, -2, 2, 0, 0, -2, 2, { kind: "pixel", id: "brick" });
  addSolidBox(blocks, -1, 1, 1, 3, -1, 1, { kind: "pixel", id: "brick" });
  addSolidBox(blocks, -1, 1, 4, 4, -1, 1, { kind: "castle", id: "stone" });

  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    addBlock(blocks, x, 5, z, { kind: "castle", id: "roof" });
  }

  addBlock(blocks, 0, 5, 0, { kind: "castle", id: "stone" });
  addBlock(blocks, 0, 6, 0, { kind: "castle", id: "roof" });
  addBlock(blocks, 0, 7, 0, { kind: "pixel", id: "water" });

  return [...blocks.values()];
}

const TOWER_BLOCKS: Record<TowerTypeId, Block[]> = {
  cannon: buildCannonBlocks(),
  archer: buildArcherBlocks(),
  ballista: buildBallistaBlocks(),
  mage: buildMageBlocks(),
};

function resolveBlockMap(
  material: BlockMaterial,
  castleMaps: Record<CastleSpriteId, THREE.Texture>,
  pixelMaps: Record<TextureId, THREE.Texture>,
) {
  if (material.kind === "castle") {
    return castleMaps[material.id];
  }

  return pixelMaps[material.id];
}

/** Y offset for tower previews inside circular build-action menu icons. */
export const TOWER_MENU_PREVIEW_POSITION: [number, number, number] = [
  0, -0.58, 0,
];

/** Camera for tower menu icon previews — pitched down so models sit in the circle. */
export const TOWER_MENU_PREVIEW_CAMERA: [number, number, number] = [
  1.35, 1.05, 1.35,
];

export function TowerModel({
  position = [0, 0, 0],
  typeId = "cannon",
}: {
  position?: [number, number, number];
  typeId?: TowerTypeId;
}) {
  const castleMaps = useCastleSpriteMaps();
  const brickMap = usePixelTextureMap("brick", [1, 1]);
  const barkMap = usePixelTextureMap("bark", [1, 1]);
  const waterMap = usePixelTextureMap("water", [1, 1]);
  const foliageMap = usePixelTextureMap("tree-foliage", [1, 1]);

  const pixelMaps = {
    brick: brickMap,
    bark: barkMap,
    water: waterMap,
    "tree-foliage": foliageMap,
  } satisfies Record<TextureId, THREE.Texture>;

  const blocks = TOWER_BLOCKS[typeId];

  return (
    <group position={position}>
      {blocks.map((block, index) => (
        <mesh
          key={`${typeId}-${index}`}
          position={[
            block.x * CASTLE_VOXEL,
            block.y * CASTLE_VOXEL + CASTLE_VOXEL / 2,
            block.z * CASTLE_VOXEL,
          ]}
        >
          <boxGeometry args={[CASTLE_VOXEL, CASTLE_VOXEL, CASTLE_VOXEL]} />
          <meshStandardMaterial
            map={resolveBlockMap(block.material, castleMaps, pixelMaps)}
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
