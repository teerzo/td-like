/** Gold cost to place a lumber mill on a lumber plot. */
export const LUMBER_MILL_COST = 20;

export function canAffordLumberMill(resources: { gold: number }) {
  return resources.gold >= LUMBER_MILL_COST;
}

/** Wood granted per lumber mill when a wave/level is cleared. */
export const LUMBER_MILL_INCOME = 5;

export function hasLumberMillAt(
  mills: readonly { gx: number; gz: number }[],
  gx: number,
  gz: number,
) {
  return mills.some((mill) => mill.gx === gx && mill.gz === gz);
}
