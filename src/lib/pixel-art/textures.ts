export const TEXTURES = {
  brick: "/textures/brick.png",
  "tree-foliage": "/textures/tree-foliage.png",
  bark: "/textures/bark.png",
  water: "/textures/water.png",
} as const;

export type TextureId = keyof typeof TEXTURES;

export {
  GRASS_SPRITE_IDS,
  GRASS_TEXTURE_IDS,
  grassTextureForTile,
  type GrassSpriteId,
} from "@/lib/pixel-art/grass-sprites";

export type { GrassSpriteId as GrassTextureId } from "@/lib/pixel-art/grass-sprites";

export {
  GROUND_TILE_PX,
  GROUND_SPRITE_SHEET,
} from "@/lib/pixel-art/ground-sprite-sheet";
