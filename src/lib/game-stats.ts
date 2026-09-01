import type { ResourceId } from "@/components/game/resource-icon";
import type { EnemyTypeId } from "@/lib/enemy-types";

export type GameRunStats = {
  kills: Partial<Record<EnemyTypeId, number>>;
  leaks: Partial<Record<EnemyTypeId, number>>;
  goldEarned: number;
  ironEarned: number;
  woodEarned: number;
  stoneEarned: number;
  foodEarned: number;
  wavesCleared: number;
  waveReached: number;
};

export type LifetimeStats = Pick<
  GameRunStats,
  | "kills"
  | "leaks"
  | "goldEarned"
  | "ironEarned"
  | "woodEarned"
  | "stoneEarned"
  | "foodEarned"
>;

export function createEmptyLifetimeStats(): LifetimeStats {
  return {
    kills: {},
    leaks: {},
    goldEarned: 0,
    ironEarned: 0,
    woodEarned: 0,
    stoneEarned: 0,
    foodEarned: 0,
  };
}

export function recordResourceEarned(
  stats: LifetimeStats,
  resource: ResourceId,
  amount: number,
) {
  if (amount <= 0) {
    return;
  }

  switch (resource) {
    case "gold":
      stats.goldEarned += amount;
      break;
    case "iron":
      stats.ironEarned += amount;
      break;
    case "wood":
      stats.woodEarned += amount;
      break;
    case "stone":
      stats.stoneEarned += amount;
      break;
    case "food":
      stats.foodEarned += amount;
      break;
  }
}

export function recordKill(stats: LifetimeStats, typeId: EnemyTypeId) {
  stats.kills[typeId] = (stats.kills[typeId] ?? 0) + 1;
}

export function recordLeak(stats: LifetimeStats, typeId: EnemyTypeId) {
  stats.leaks[typeId] = (stats.leaks[typeId] ?? 0) + 1;
}

export function totalKills(kills: Partial<Record<EnemyTypeId, number>>): number {
  let total = 0;
  for (const count of Object.values(kills)) {
    total += count ?? 0;
  }
  return total;
}

export function buildGameRunStats(
  lifetime: LifetimeStats,
  waveLevel: number,
): GameRunStats {
  return {
    ...lifetime,
    kills: { ...lifetime.kills },
    leaks: { ...lifetime.leaks },
    wavesCleared: Math.max(0, waveLevel - 1),
    waveReached: waveLevel,
  };
}
