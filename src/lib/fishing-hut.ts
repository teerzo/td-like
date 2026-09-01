import type { GridCoord } from "@/lib/world-layout";

/** Resource cost to place a fishing hut on a pond. */
export const FISHING_HUT_COST = {
  gold: 20,
  wood: 20,
} as const;

export function canAffordFishingHut(resources: {
  gold: number;
  wood: number;
}) {
  return (
    resources.gold >= FISHING_HUT_COST.gold &&
    resources.wood >= FISHING_HUT_COST.wood
  );
}

/** Food granted per fishing hut when a wave/level is cleared. */
export const FISHING_HUT_INCOME = 5;

export function hasFishingHutAt(
  huts: readonly { gx: number; gz: number }[],
  gx: number,
  gz: number,
) {
  return huts.some((hut) => hut.gx === gx && hut.gz === gz);
}

export function isPondTile(
  pond: GridCoord | null | undefined,
  x: number,
  z: number,
) {
  return !!pond && pond.x === x && pond.z === z;
}
