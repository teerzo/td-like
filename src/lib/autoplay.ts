import {
  ARMY_UNIT_IDS,
  armyTotal,
  canAffordUnit,
  spendUnitCost,
  type ArmyResources,
  type ArmyRoster,
  type ArmyUnitId,
} from "@/lib/army-types";
import { canAffordFarm, FARM_COST } from "@/lib/fertile-farm";
import {
  canAffordFishingHut,
  FISHING_HUT_COST,
} from "@/lib/fishing-hut";
import { isEmptyGrassTowerTile, type RevealedTileKind } from "@/lib/forest-nothing";
import { GOLD_MINE_COST, IRON_MINE_COST } from "@/lib/gold-mine";
import { TREE_CLEAR_COST } from "@/lib/resources";
import { getEffectiveAttackRangeTiles } from "@/lib/tower-combat";
import {
  getTowerStats,
  getTowerUpgradeCost,
  TOWER_TYPE_IDS,
  type TowerTypeId,
} from "@/lib/tower-types";
import type { LevelEdge } from "@/lib/world-layout";

export const AUTOPLAY_TICK_MS = 800;
export const AUTOPLAY_MODAL_DELAY_MS = 5000;

export const AUTOPLAY_CONFIDENCE_MIN = 0;
export const AUTOPLAY_CONFIDENCE_MAX = 1;
export const AUTOPLAY_CONFIDENCE_START = 0.2;

const CLEAN_WAVE_CONFIDENCE_GAIN = 0.16;
const LEAK_CONFIDENCE_HIT = 0.1;
const PER_LEAK_CONFIDENCE_LOSS = 0.12;

const CARDINAL = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

export type AutoplayAction =
  | { type: "cutTree"; gx: number; gz: number }
  | { type: "buildMine"; kind: "gold" | "iron"; gx: number; gz: number }
  | { type: "buildFarm"; gx: number; gz: number }
  | { type: "buildFishingHut"; gx: number; gz: number }
  | { type: "placeTower"; typeId: TowerTypeId; gx: number; gz: number }
  | { type: "upgradeTower"; towerId: number }
  | { type: "unlockGate"; edge: LevelEdge }
  | { type: "recruit"; unitId: ArmyUnitId }
  | { type: "sendAttack" }
  | { type: "acceptWaveClear" };

export type AutoplayTower = {
  id: number;
  gx: number;
  gz: number;
  typeId: TowerTypeId;
  level: number;
};

export type AutoplaySnapshot = {
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
  waveLevel: number;
  isNight: boolean;
  waveClearOpen: boolean;
  /** 0 = rattled (stack towers), 1 = confident (expand instead). */
  confidence: number;
  standingForestKeys: ReadonlySet<string>;
  revealedTiles: ReadonlyMap<string, RevealedTileKind>;
  builtMineKeys: ReadonlySet<string>;
  farmKeys: ReadonlySet<string>;
  fishingHutKeys: ReadonlySet<string>;
  clearedObstacleKeys: ReadonlySet<string>;
  towerOccupiedKeys: ReadonlySet<string>;
  towers: readonly AutoplayTower[];
  hillKeys: ReadonlySet<string>;
  /** Global dirt / road tiles enemies walk. */
  roadKeys: ReadonlySet<string>;
  /** Global keys considered "frontier" (road, road-clearance, or revealed buildable). */
  openKeys: ReadonlySet<string>;
  /** Tiles the player can actually click / clear (excludes preview spawn levels). */
  interactableKeys: ReadonlySet<string>;
  /** Global keys where a tower may be placed. */
  buildableTowerKeys: ReadonlyArray<{ gx: number; gz: number; key: string }>;
  unusedGates: readonly LevelEdge[];
  edgeGateCost: number;
  army: ArmyRoster;
};

function parseKey(key: string): { gx: number; gz: number } | null {
  const [a, b] = key.split(":");
  const gx = Number(a);
  const gz = Number(b);
  if (!Number.isFinite(gx) || !Number.isFinite(gz)) {
    return null;
  }
  return { gx, gz };
}

function neighbors(gx: number, gz: number): { gx: number; gz: number }[] {
  return CARDINAL.map(({ dx, dz }) => ({ gx: gx + dx, gz: gz + dz }));
}

/** Helper for play-scene: whether a tile is valid for tower placement. */
export function autoplayTileAllowsTower(
  kind: RevealedTileKind | undefined,
  key: string,
  standingForestKeys: ReadonlySet<string>,
  towerOccupiedKeys: ReadonlySet<string>,
  towerPlacementBlockedKeys: ReadonlySet<string>,
  clearedObstacleKeys: ReadonlySet<string>,
  isGlobalRoad: (gx: number, gz: number) => boolean,
  gx = 0,
  gz = 0,
): boolean {
  return isEmptyGrassTowerTile({
    gx,
    gz,
    tileKey: key,
    revealed: kind,
    standingForestKeys,
    towerOccupiedKeys,
    towerPlacementBlockedKeys,
    clearedObstacleKeys,
    isGlobalRoad,
  });
}

export function countAutoplayLeaks(
  leaks: Readonly<Partial<Record<string, number>>>,
): number {
  let total = 0;
  for (const value of Object.values(leaks)) {
    total += value ?? 0;
  }
  return total;
}

export function nextAutoplayConfidence(
  current: number,
  leakCount: number,
): number {
  const next =
    leakCount <= 0
      ? current + CLEAN_WAVE_CONFIDENCE_GAIN
      : current - LEAK_CONFIDENCE_HIT - leakCount * PER_LEAK_CONFIDENCE_LOSS;

  return Math.min(
    AUTOPLAY_CONFIDENCE_MAX,
    Math.max(AUTOPLAY_CONFIDENCE_MIN, next),
  );
}

function pickWeightedFrom<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) {
      return items[index]!;
    }
  }
  return items[items.length - 1]!;
}

const PREMIUM_TOWER_IDS: readonly TowerTypeId[] = ["mage", "ballista", "cannon"];
const CHEAP_TOWER_ID: TowerTypeId = "archer";

function countTowersOfType(snap: AutoplaySnapshot, typeId: TowerTypeId): number {
  let count = 0;
  for (const tower of snap.towers) {
    if (tower.typeId === typeId) {
      count += 1;
    }
  }
  return count;
}

function premiumTowerCount(snap: AutoplaySnapshot): number {
  let count = 0;
  for (const typeId of PREMIUM_TOWER_IDS) {
    count += countTowersOfType(snap, typeId);
  }
  return count;
}

/** Bank gold toward the next premium tower instead of dumping it on archers. */
function saveTargetTower(snap: AutoplaySnapshot): TowerTypeId | null {
  if (snap.confidence < 0.35) {
    return null;
  }

  const archerCount = countTowersOfType(snap, CHEAP_TOWER_ID);
  const mageCount = countTowersOfType(snap, "mage");
  const ballistaCount = countTowersOfType(snap, "ballista");
  const cannonCount = countTowersOfType(snap, "cannon");

  if (
    snap.waveLevel <= 2 &&
    archerCount < 2 &&
    premiumTowerCount(snap) === 0
  ) {
    return null;
  }

  if (mageCount === 0 && ballistaCount === 0 && cannonCount === 0) {
    return "mage";
  }

  if (snap.waveLevel >= 3 && ballistaCount === 0) {
    return "ballista";
  }

  if (snap.waveLevel >= 4 && cannonCount === 0) {
    return "cannon";
  }

  return null;
}

function desiredTowerCount(snap: AutoplaySnapshot): number {
  const panic = 1 - snap.confidence;
  const calm = 1 + Math.ceil(snap.waveLevel / 2);
  const stressed = 4 + snap.waveLevel * 3;
  return Math.max(1, Math.round(calm + (stressed - calm) * panic));
}

function wantsMoreTowers(snap: AutoplaySnapshot): boolean {
  return snap.towers.length < desiredTowerCount(snap);
}

function desiredBuildablePlots(snap: AutoplaySnapshot): number {
  return Math.min(18, desiredTowerCount(snap) + 2);
}

function wantsMoreTowerPlots(snap: AutoplaySnapshot): boolean {
  return snap.buildableTowerKeys.length < desiredBuildablePlots(snap);
}

function desiredEconomyBuildings(waveLevel: number): number {
  return Math.min(6, Math.max(1, waveLevel));
}

/** Wood needed so farms / fishing huts are actually affordable once revealed. */
function desiredWoodStockpile(snap: AutoplaySnapshot): number {
  let need = Math.min(FISHING_HUT_COST.wood, 12 + snap.waveLevel * 10);

  for (const [key, kind] of snap.revealedTiles) {
    if (kind === "pond" && !snap.fishingHutKeys.has(key)) {
      need = Math.max(need, FISHING_HUT_COST.wood);
    }
    if (kind === "fertile" && !snap.farmKeys.has(key)) {
      need = Math.max(need, FARM_COST.wood);
    }
  }

  return need;
}

function pendingEconomyTiles(snap: AutoplaySnapshot): number {
  let count = 0;
  for (const [key, kind] of snap.revealedTiles) {
    if (kind === "goldDeposit" && !snap.builtMineKeys.has(key)) {
      count += 1;
    } else if (kind === "ironDeposit" && !snap.builtMineKeys.has(key)) {
      count += 1;
    } else if (kind === "pond" && !snap.fishingHutKeys.has(key)) {
      count += 1;
    } else if (kind === "fertile" && !snap.farmKeys.has(key)) {
      count += 1;
    }
  }
  return count;
}

function builtEconomyCount(snap: AutoplaySnapshot): number {
  return snap.builtMineKeys.size + snap.farmKeys.size + snap.fishingHutKeys.size;
}

function wantsMapExpansion(snap: AutoplaySnapshot): boolean {
  if (wantsMoreTowerPlots(snap)) {
    return true;
  }
  if (snap.wood < desiredWoodStockpile(snap)) {
    return true;
  }
  return (
    builtEconomyCount(snap) + pendingEconomyTiles(snap) <
    desiredEconomyBuildings(snap.waveLevel)
  );
}

/** Keep enough gold for the first archer, or a premium tower we can buy this tick. */
function goldReservedForTowers(snap: AutoplaySnapshot): number {
  if (!wantsMoreTowers(snap)) {
    return 0;
  }

  if (snap.towers.length === 0) {
    return getTowerStats(CHEAP_TOWER_ID).cost;
  }

  const saveFor = saveTargetTower(snap);
  if (!saveFor) {
    return 0;
  }

  const cost = getTowerStats(saveFor).cost;
  return snap.gold >= cost ? cost : 0;
}

function pickWeightedTower(
  gold: number,
  waveLevel: number,
  excludeTypeIds: ReadonlySet<TowerTypeId> = new Set(),
): TowerTypeId | null {
  const affordable = TOWER_TYPE_IDS.filter(
    (typeId) =>
      getTowerStats(typeId).cost <= gold && !excludeTypeIds.has(typeId),
  );
  if (affordable.length === 0) {
    return null;
  }

  const exponent = Math.min(2.2, 0.7 + (waveLevel - 1) * 0.12);
  const weights = affordable.map((typeId) =>
    Math.pow(getTowerStats(typeId).cost, exponent),
  );

  return pickWeightedFrom(affordable, weights);
}

function snapshotResources(snap: AutoplaySnapshot): ArmyResources {
  return {
    gold: snap.gold,
    iron: snap.iron,
    wood: snap.wood,
    stone: snap.stone,
    food: snap.food,
  };
}

function pickRandomRecruit(resources: ArmyResources): ArmyUnitId | null {
  const affordable = ARMY_UNIT_IDS.filter((id) => canAffordUnit(id, resources));
  if (affordable.length === 0) {
    return null;
  }

  return affordable[Math.floor(Math.random() * affordable.length)]!;
}

/** Spend all affordable resources on recruits (uniform random picks). */
export function planFoodRecruits(resources: ArmyResources): ArmyUnitId[] {
  const plan: ArmyUnitId[] = [];
  let remaining = resources;

  while (true) {
    const unitId = pickRandomRecruit(remaining);
    if (!unitId) {
      break;
    }

    plan.push(unitId);
    remaining = spendUnitCost(remaining, unitId);
  }

  return plan;
}

function isFrontierNeighbor(
  snap: AutoplaySnapshot,
  gx: number,
  gz: number,
): boolean {
  const key = `${gx}:${gz}`;
  if (snap.openKeys.has(key)) {
    return true;
  }
  if (!snap.interactableKeys.has(key)) {
    return false;
  }
  return !snap.standingForestKeys.has(key);
}

function cuttableTreeCandidates(
  snap: AutoplaySnapshot,
): { gx: number; gz: number; key: string }[] {
  const candidates: { gx: number; gz: number; key: string }[] = [];

  for (const key of snap.standingForestKeys) {
    if (!snap.interactableKeys.has(key)) {
      continue;
    }

    const coord = parseKey(key);
    if (!coord) {
      continue;
    }

    const nearFrontier = neighbors(coord.gx, coord.gz).some((n) =>
      isFrontierNeighbor(snap, n.gx, n.gz),
    );

    if (nearFrontier) {
      candidates.push({ ...coord, key });
    }
  }

  return candidates;
}

function findCuttableTree(
  snap: AutoplaySnapshot,
  reserveGold = 0,
): AutoplayAction | null {
  if (snap.gold < TREE_CLEAR_COST + reserveGold) {
    return null;
  }

  const candidates = cuttableTreeCandidates(snap);
  if (candidates.length === 0) {
    return null;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
  return { type: "cutTree", gx: pick.gx, gz: pick.gz };
}

function findUnlockGate(snap: AutoplaySnapshot): AutoplayAction | null {
  if (snap.unusedGates.length === 0) {
    return null;
  }
  if (snap.towers.length < 1) {
    return null;
  }
  if (snap.gold < snap.edgeGateCost) {
    return null;
  }

  const edge =
    snap.unusedGates[Math.floor(Math.random() * snap.unusedGates.length)]!;
  return { type: "unlockGate", edge };
}

function shouldUnlockGate(snap: AutoplaySnapshot): boolean {
  if (snap.unusedGates.length === 0 || snap.towers.length < 1) {
    return false;
  }
  if (snap.gold < snap.edgeGateCost) {
    return false;
  }
  if (cuttableTreeCandidates(snap).length === 0) {
    return true;
  }
  return snap.waveLevel >= 2;
}

function findBuildAction(snap: AutoplaySnapshot): AutoplayAction | null {
  for (const [key, kind] of snap.revealedTiles) {
    const coord = parseKey(key);
    if (!coord) {
      continue;
    }

    if (kind === "goldDeposit" && !snap.builtMineKeys.has(key)) {
      if (snap.gold >= GOLD_MINE_COST) {
        return { type: "buildMine", kind: "gold", gx: coord.gx, gz: coord.gz };
      }
    }

    if (kind === "ironDeposit" && !snap.builtMineKeys.has(key)) {
      if (snap.gold >= IRON_MINE_COST) {
        return { type: "buildMine", kind: "iron", gx: coord.gx, gz: coord.gz };
      }
    }

    if (kind === "pond" && !snap.fishingHutKeys.has(key)) {
      if (canAffordFishingHut({ gold: snap.gold, wood: snap.wood })) {
        return {
          type: "buildFishingHut",
          gx: coord.gx,
          gz: coord.gz,
        };
      }
    }

    if (kind === "fertile" && !snap.farmKeys.has(key)) {
      if (
        canAffordFarm({
          gold: snap.gold,
          iron: snap.iron,
          wood: snap.wood,
        })
      ) {
        return { type: "buildFarm", gx: coord.gx, gz: coord.gz };
      }
    }
  }

  return null;
}

function parseRoadCoords(
  roadKeys: ReadonlySet<string>,
): { gx: number; gz: number }[] {
  const coords: { gx: number; gz: number }[] = [];
  for (const key of roadKeys) {
    const coord = parseKey(key);
    if (coord) {
      coords.push(coord);
    }
  }
  return coords;
}

/** True when this tile is close enough that the tower can hit a dirt path. */
function tileIsInRangeOfRoad(
  gx: number,
  gz: number,
  typeId: TowerTypeId,
  hillKeys: ReadonlySet<string>,
  roads: readonly { gx: number; gz: number }[],
): boolean {
  const stats = getTowerStats(typeId);
  const onHill = hillKeys.has(`${gx}:${gz}`);
  const rangeTiles = getEffectiveAttackRangeTiles(stats, onHill);

  for (const road of roads) {
    if (Math.hypot(gx - road.gx, gz - road.gz) <= rangeTiles) {
      return true;
    }
  }
  return false;
}

function countInRangeTowerPlots(
  snap: AutoplaySnapshot,
  typeId: TowerTypeId = CHEAP_TOWER_ID,
): number {
  const roads = parseRoadCoords(snap.roadKeys);
  let count = 0;
  for (const tile of snap.buildableTowerKeys) {
    if (tileIsInRangeOfRoad(tile.gx, tile.gz, typeId, snap.hillKeys, roads)) {
      count += 1;
    }
  }
  return count;
}

function findPlaceTower(snap: AutoplaySnapshot): AutoplayAction | null {
  if (!wantsMoreTowers(snap) || snap.buildableTowerKeys.length === 0) {
    return null;
  }

  const saveFor = saveTargetTower(snap);
  let typeId: TowerTypeId | null;

  if (saveFor) {
    if (snap.gold < getTowerStats(saveFor).cost) {
      return null;
    }
    typeId = saveFor;
  } else {
    typeId = pickWeightedTower(snap.gold, snap.waveLevel);
  }

  if (!typeId) {
    return null;
  }

  const roads = parseRoadCoords(snap.roadKeys);
  const inRangeTiles = snap.buildableTowerKeys.filter((tile) =>
    tileIsInRangeOfRoad(tile.gx, tile.gz, typeId, snap.hillKeys, roads),
  );
  if (inRangeTiles.length === 0) {
    return null;
  }

  const pick = inRangeTiles[Math.floor(Math.random() * inRangeTiles.length)]!;
  return { type: "placeTower", typeId, gx: pick.gx, gz: pick.gz };
}

function findUpgrade(snap: AutoplaySnapshot): AutoplayAction | null {
  const saveFor = saveTargetTower(snap);
  const reserve = saveFor ? getTowerStats(saveFor).cost : 0;
  const sorted = [...snap.towers].sort((a, b) => {
    const costA = getTowerStats(a.typeId).cost;
    const costB = getTowerStats(b.typeId).cost;
    return snap.waveLevel >= 4 ? costB - costA : costA - costB;
  });

  for (const tower of sorted) {
    const cost = getTowerUpgradeCost(tower.typeId, tower.level);
    if (cost === null || snap.gold < cost) {
      continue;
    }

    const isPremium = PREMIUM_TOWER_IDS.includes(tower.typeId);
    if (saveFor && tower.typeId === CHEAP_TOWER_ID) {
      continue;
    }
    if (saveFor && !isPremium && snap.gold - cost < reserve) {
      continue;
    }

    return { type: "upgradeTower", towerId: tower.id };
  }
  return null;
}

/**
 * Choose a single autoplay action from the current game snapshot.
 * Returns null when nothing useful can be done this tick.
 */
export function chooseAutoplayAction(
  snap: AutoplaySnapshot,
): AutoplayAction | null {
  if (snap.waveClearOpen) {
    return { type: "acceptWaveClear" };
  }

  if (snap.isNight) {
    return null;
  }

  const needTowers = wantsMoreTowers(snap);

  if (!needTowers) {
    const build = findBuildAction(snap);
    if (build) {
      return build;
    }

    if (shouldUnlockGate(snap)) {
      const gate = findUnlockGate(snap);
      if (gate) {
        return gate;
      }
    }

    if (snap.towers.length >= 1 && wantsMapExpansion(snap)) {
      const expand = findCuttableTree(snap);
      if (expand) {
        return expand;
      }
    }

    const upgrade = findUpgrade(snap);
    if (upgrade) {
      return upgrade;
    }
  } else {
    if (countInRangeTowerPlots(snap) === 0) {
      const expand = findCuttableTree(snap, goldReservedForTowers(snap));
      if (expand) {
        return expand;
      }
    }

    const tower = findPlaceTower(snap);
    if (tower) {
      return tower;
    }

    const upgrade = findUpgrade(snap);
    if (upgrade) {
      return upgrade;
    }

    if (
      snap.gold < getTowerStats(CHEAP_TOWER_ID).cost &&
      countInRangeTowerPlots(snap) === 0
    ) {
      const expand = findCuttableTree(snap);
      if (expand) {
        return expand;
      }
    }
  }

  const recruit = pickRandomRecruit(snapshotResources(snap));
  if (recruit) {
    return { type: "recruit", unitId: recruit };
  }

  if (armyTotal(snap.army) >= 1) {
    return { type: "sendAttack" };
  }

  if (!needTowers) {
    const cut = findCuttableTree(snap);
    if (cut) {
      return cut;
    }

    if (snap.unusedGates.length > 0 && snap.gold >= snap.edgeGateCost) {
      const edge =
        snap.unusedGates[Math.floor(Math.random() * snap.unusedGates.length)]!;
      return { type: "unlockGate", edge };
    }
  }

  return null;
}

export { FARM_COST, FISHING_HUT_COST };
