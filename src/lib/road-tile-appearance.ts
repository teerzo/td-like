import type { DirtRoadSpriteId } from "@/lib/pixel-art/dirt-road-sprites";
import {
  getEntranceEdge,
  isEntranceTile,
  isRoadTile,
  type WorldLayout,
} from "@/lib/world-layout";

type RoadDir = "n" | "e" | "s" | "w";

const ROAD_DIRS: { dir: RoadDir; x: number; z: number }[] = [
  { dir: "n", x: 0, z: -1 },
  { dir: "e", x: 1, z: 0 },
  { dir: "s", x: 0, z: 1 },
  { dir: "w", x: -1, z: 0 },
];

const NEIGHBOR_SPRITE: Partial<Record<string, DirtRoadSpriteId>> = {
  ns: "ns",
  ew: "ew",
  ne: "ne",
  es: "es",
  sw: "sw",
  wn: "wn",
  nw: "nw",
  ws: "ws",
  se: "se",
  en: "en",
  nes: "tw",
  esw: "tn",
  nsw: "te",
  new: "ts",
};

export type DirtRoadAppearance = {
  sprite: DirtRoadSpriteId;
};

function getRoadNeighborKey(layout: WorldLayout, x: number, z: number) {
  let key = "";

  for (const { dir, x: dx, z: dz } of ROAD_DIRS) {
    if (isRoadTile(layout, x + dx, z + dz)) {
      key += dir;
    }
  }

  return key;
}

/** Straight ns/ew sprite aligned with the entrance corridor. */
export function getEntranceStraightSprite(
  layout: WorldLayout,
): DirtRoadSpriteId {
  const edge = getEntranceEdge(layout.entrance, layout.size);

  return edge === "east" || edge === "west" ? "ew" : "ns";
}

function isEntranceGateTile(layout: WorldLayout, x: number, z: number) {
  return layout.gate.x === x && layout.gate.z === z;
}

/** Matches the straight ns/ew dirt road sprites. */
export function isStraightDirtTile(
  layout: WorldLayout,
  x: number,
  z: number,
) {
  if (isEntranceTile(layout, x, z) || isEntranceGateTile(layout, x, z)) {
    return true;
  }

  const neighbors = getRoadNeighborKey(layout, x, z);

  return neighbors === "ns" || neighbors === "ew";
}

export function getDirtRoadAppearance(
  layout: WorldLayout,
  x: number,
  z: number,
): DirtRoadAppearance {
  if (isEntranceTile(layout, x, z) || isEntranceGateTile(layout, x, z)) {
    return { sprite: getEntranceStraightSprite(layout) };
  }

  const neighbors = getRoadNeighborKey(layout, x, z);

  return {
    sprite: NEIGHBOR_SPRITE[neighbors] ?? "dirt",
  };
}
