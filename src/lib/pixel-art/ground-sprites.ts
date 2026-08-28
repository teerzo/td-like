import { GROUND_SPRITE_SHEET } from "@/lib/pixel-art/ground-sprite-sheet";
import { atlasFrameUvTransform } from "@/lib/pixel-art/sprite-atlas-uv";

export { GROUND_SPRITE_SHEET };

export type GroundSpriteId = "grass" | "dirt";
export type TextureWrap = "repeat" | "clamp";

export const GROUND_SPRITE_FRAMES: Record<
  GroundSpriteId,
  { col: number; row: number }
> = {
  grass: { col: 0, row: 0 },
  dirt: { col: 0, row: 1 },
};

export function spriteUvTransform(
  sprite: GroundSpriteId,
  tileRepeat: [number, number] = [1, 1],
  uvOffset: [number, number] = [0, 0],
) {
  const { repeat, offset } = atlasFrameUvTransform(
    GROUND_SPRITE_SHEET,
    GROUND_SPRITE_FRAMES[sprite],
  );

  return {
    repeat: [tileRepeat[0] * repeat[0], tileRepeat[1] * repeat[1]] as [
      number,
      number,
    ],
    offset: [offset[0] + uvOffset[0], offset[1] + uvOffset[1]] as [
      number,
      number,
    ],
    wrapS: sprite === "grass" ? ("repeat" as const) : ("clamp" as const),
    wrapT: sprite === "grass" ? ("repeat" as const) : ("clamp" as const),
  };
}
