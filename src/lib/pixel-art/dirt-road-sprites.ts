import { GROUND_SPRITE_SHEET } from "@/lib/pixel-art/ground-sprite-sheet";
import { atlasFrameUvTransform } from "@/lib/pixel-art/sprite-atlas-uv";

/** Dirt road frames live on the shared ground sprite sheet. */
export const DIRT_ROAD_SPRITE_SHEET = GROUND_SPRITE_SHEET;

export const DIRT_ROAD_SPRITE_IDS = [
  "dirt",
  "ns",
  "ew",
  "ne",
  "es",
  "sw",
  "wn",
  "nw",
  "ws",
  "se",
  "en",
  "tw",
  "tn",
  "te",
  "ts",
  "xnns",
  "xnew",
  "xsns",
  "xsew",
  "xens",
  "xeew",
  "xwns",
  "xwew",
] as const;

export type DirtRoadSpriteId = (typeof DIRT_ROAD_SPRITE_IDS)[number];

export const DIRT_ROAD_FRAMES: Record<
  DirtRoadSpriteId,
  { col: number; row: number }
> = {
  dirt: { col: 0, row: 1 },
  ns: { col: 1, row: 1 },
  ew: { col: 2, row: 1 },
  tw: { col: 3, row: 1 },
  ne: { col: 0, row: 2 },
  es: { col: 1, row: 2 },
  sw: { col: 2, row: 2 },
  wn: { col: 3, row: 2 },
  nw: { col: 0, row: 3 },
  ws: { col: 1, row: 3 },
  se: { col: 2, row: 3 },
  en: { col: 3, row: 3 },
  tn: { col: 0, row: 4 },
  te: { col: 1, row: 4 },
  ts: { col: 2, row: 4 },
  xnns: { col: 0, row: 5 },
  xnew: { col: 1, row: 5 },
  xsns: { col: 2, row: 5 },
  xsew: { col: 3, row: 5 },
  xens: { col: 0, row: 6 },
  xeew: { col: 1, row: 6 },
  xwns: { col: 2, row: 6 },
  xwew: { col: 3, row: 6 },
};

export function dirtRoadSpriteUvTransform(sprite: DirtRoadSpriteId) {
  return atlasFrameUvTransform(
    DIRT_ROAD_SPRITE_SHEET,
    DIRT_ROAD_FRAMES[sprite],
  );
}
