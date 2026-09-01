import {
  getTowerIronCost,
  getTowerPlaceCosts,
  getTowerStats,
  getTowerWoodCost,
  type TowerPlaceResourceCost,
  type TowerStats,
  type TowerTypeId,
} from "@/lib/tower-types";

export type RelicId =
  | "freeArcher"
  | "towerDamage"
  | "cheapTowers"
  | "towerRange"
  | "rapidFire"
  | "thickWalls"
  | "warChest"
  | "bountiful"
  | "slowMarch"
  | "cheapDrafts"
  | "deepVeins"
  | "armorPierce"
  | "sawmillBoom";

export type RelicDef = {
  id: RelicId;
  title: string;
  description: string;
};

export const RELICS: readonly RelicDef[] = [
  {
    id: "freeArcher",
    title: "Free archer",
    description: "Your next archer tower is free (gold and wood).",
  },
  {
    id: "towerDamage",
    title: "Sharpened tips",
    description: "All towers deal +1 damage.",
  },
  {
    id: "cheapTowers",
    title: "Bulk timber",
    description: "Towers cost 5 less gold (min 0).",
  },
  {
    id: "towerRange",
    title: "Longer bows",
    description: "All towers gain +1 attack range.",
  },
  {
    id: "rapidFire",
    title: "Rapid fire",
    description: "Towers attack 15% faster.",
  },
  {
    id: "thickWalls",
    title: "Thick walls",
    description: "Castle max HP +3. Heal 3 now.",
  },
  {
    id: "warChest",
    title: "War chest",
    description: "Wave-level gold income is 50% higher.",
  },
  {
    id: "bountiful",
    title: "Bountiful harvest",
    description: "Farms and fishing huts produce double food.",
  },
  {
    id: "slowMarch",
    title: "Slow the march",
    description: "Enemies move 10% slower.",
  },
  {
    id: "cheapDrafts",
    title: "Cheap drafts",
    description: "Recruits cost 1 less food (min 1).",
  },
  {
    id: "deepVeins",
    title: "Deep veins",
    description: "Each gold and iron mine pays +5 extra at wave end.",
  },
  {
    id: "armorPierce",
    title: "Armor pierce",
    description: "Tower hits ignore 1 armor.",
  },
  {
    id: "sawmillBoom",
    title: "Sawmill boom",
    description: "Lumber mills produce double wood.",
  },
];

export const RELIC_IDS: RelicId[] = RELICS.map((relic) => relic.id);

const RELIC_BY_ID: Record<RelicId, RelicDef> = Object.fromEntries(
  RELICS.map((relic) => [relic.id, relic]),
) as Record<RelicId, RelicDef>;

export function getRelicDef(id: RelicId): RelicDef {
  return RELIC_BY_ID[id];
}

export const THICK_WALLS_HP_BONUS = 3;

export const COMBAT_RELIC_PRIORITY: RelicId[] = [
  "towerDamage",
  "rapidFire",
  "towerRange",
];

export const ECONOMY_RELIC_PRIORITY: RelicId[] = [
  "warChest",
  "cheapTowers",
  "deepVeins",
  "bountiful",
  "sawmillBoom",
  "cheapDrafts",
];

export type RunModifiers = {
  towerDamageBonus: number;
  towerRangeBonus: number;
  towerCooldownMultiplier: number;
  towerGoldDiscount: number;
  freeArcherCharges: number;
  castleMaxHpBonus: number;
  waveGoldMultiplier: number;
  farmFoodMultiplier: number;
  mineIncomeBonus: number;
  lumberIncomeMultiplier: number;
  enemySpeedMultiplier: number;
  recruitFoodDiscount: number;
  armorPierce: number;
};

export function createEmptyRunModifiers(): RunModifiers {
  return {
    towerDamageBonus: 0,
    towerRangeBonus: 0,
    towerCooldownMultiplier: 1,
    towerGoldDiscount: 0,
    freeArcherCharges: 0,
    castleMaxHpBonus: 0,
    waveGoldMultiplier: 1,
    farmFoodMultiplier: 1,
    mineIncomeBonus: 0,
    lumberIncomeMultiplier: 1,
    enemySpeedMultiplier: 1,
    recruitFoodDiscount: 0,
    armorPierce: 0,
  };
}

export function getRunModifiers(
  ownedIds: readonly RelicId[],
  freeArcherCharges: number,
): RunModifiers {
  const modifiers = createEmptyRunModifiers();
  modifiers.freeArcherCharges = Math.max(0, freeArcherCharges);

  for (const id of ownedIds) {
    switch (id) {
      case "freeArcher":
        break;
      case "towerDamage":
        modifiers.towerDamageBonus += 1;
        break;
      case "cheapTowers":
        modifiers.towerGoldDiscount += 5;
        break;
      case "towerRange":
        modifiers.towerRangeBonus += 1;
        break;
      case "rapidFire":
        modifiers.towerCooldownMultiplier *= 0.85;
        break;
      case "thickWalls":
        modifiers.castleMaxHpBonus += THICK_WALLS_HP_BONUS;
        break;
      case "warChest":
        modifiers.waveGoldMultiplier *= 1.5;
        break;
      case "bountiful":
        modifiers.farmFoodMultiplier *= 2;
        break;
      case "slowMarch":
        modifiers.enemySpeedMultiplier *= 0.9;
        break;
      case "cheapDrafts":
        modifiers.recruitFoodDiscount += 1;
        break;
      case "deepVeins":
        modifiers.mineIncomeBonus += 5;
        break;
      case "armorPierce":
        modifiers.armorPierce += 1;
        break;
      case "sawmillBoom":
        modifiers.lumberIncomeMultiplier *= 2;
        break;
    }
  }

  return modifiers;
}

/** Shuffle unused relics and return up to 3. */
export function pickRelicOffer(ownedIds: readonly RelicId[]): RelicId[] {
  const owned = new Set(ownedIds);
  const pool = RELIC_IDS.filter((id) => !owned.has(id));

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }

  return pool.slice(0, 3);
}

export function chooseAutoplayRelic(offer: readonly RelicId[]): RelicId | null {
  if (offer.length === 0) {
    return null;
  }

  for (const id of COMBAT_RELIC_PRIORITY) {
    if (offer.includes(id)) {
      return id;
    }
  }
  for (const id of ECONOMY_RELIC_PRIORITY) {
    if (offer.includes(id)) {
      return id;
    }
  }

  return offer[0] ?? null;
}

export function applyTowerCombatStats(
  stats: TowerStats,
  modifiers: RunModifiers,
): TowerStats {
  return {
    ...stats,
    damage: stats.damage + modifiers.towerDamageBonus,
    attackRangeTiles: stats.attackRangeTiles + modifiers.towerRangeBonus,
    attackCooldown: Math.max(
      0.2,
      stats.attackCooldown * modifiers.towerCooldownMultiplier,
    ),
  };
}

function waivesArcherPlaceCost(
  typeId: TowerTypeId,
  modifiers: RunModifiers,
): boolean {
  return typeId === "archer" && modifiers.freeArcherCharges > 0;
}

export function applyTowerPlaceGoldCost(
  baseGold: number,
  modifiers: RunModifiers,
  typeId: TowerTypeId,
): number {
  if (waivesArcherPlaceCost(typeId, modifiers)) {
    return 0;
  }

  return Math.max(0, baseGold - modifiers.towerGoldDiscount);
}

export function applyTowerPlaceWoodCost(
  baseWood: number,
  modifiers: RunModifiers,
  typeId: TowerTypeId,
): number {
  if (waivesArcherPlaceCost(typeId, modifiers)) {
    return 0;
  }

  return baseWood;
}

export function getModifiedTowerPlaceCosts(
  typeId: TowerTypeId,
  modifiers: RunModifiers,
): TowerPlaceResourceCost[] {
  const gold = applyTowerPlaceGoldCost(
    getTowerStats(typeId).cost,
    modifiers,
    typeId,
  );
  const iron = getTowerIronCost(typeId);
  const wood = applyTowerPlaceWoodCost(
    getTowerWoodCost(typeId),
    modifiers,
    typeId,
  );
  const costs: TowerPlaceResourceCost[] = [{ resource: "gold", amount: gold }];
  if (iron > 0) {
    costs.push({ resource: "iron", amount: iron });
  }
  if (wood > 0) {
    costs.push({ resource: "wood", amount: wood });
  }
  return costs;
}

export function canAffordModifiedTowerPlace(
  typeId: TowerTypeId,
  gold: number,
  wood: number,
  iron: number,
  modifiers: RunModifiers,
): boolean {
  const costs = getModifiedTowerPlaceCosts(typeId, modifiers);
  return costs.every((line) => {
    if (line.resource === "gold") {
      return gold >= line.amount;
    }
    if (line.resource === "wood") {
      return wood >= line.amount;
    }
    return iron >= line.amount;
  });
}

/** Keep a gold line even when the place is free so the card can show 0. */
export function getModifiedTowerPlaceCostsForDisplay(
  typeId: TowerTypeId,
  modifiers: RunModifiers,
): TowerPlaceResourceCost[] {
  const base = getTowerPlaceCosts(typeId);
  return base.map((line) => {
    if (line.resource === "gold") {
      return {
        ...line,
        amount: applyTowerPlaceGoldCost(line.amount, modifiers, typeId),
      };
    }
    if (line.resource === "wood") {
      return {
        ...line,
        amount: applyTowerPlaceWoodCost(line.amount, modifiers, typeId),
      };
    }
    return line;
  });
}

export function applyRecruitFoodCost(
  food: number,
  modifiers: RunModifiers,
): number {
  return Math.max(1, food - modifiers.recruitFoodDiscount);
}

export function applyWaveGoldReward(
  base: number,
  modifiers: RunModifiers,
): number {
  return Math.round(base * modifiers.waveGoldMultiplier);
}

export function applyFarmFoodIncome(
  base: number,
  modifiers: RunModifiers,
): number {
  return Math.round(base * modifiers.farmFoodMultiplier);
}

export function applyMineIncome(
  base: number,
  modifiers: RunModifiers,
): number {
  return base + modifiers.mineIncomeBonus;
}

export function applyLumberIncome(
  base: number,
  modifiers: RunModifiers,
): number {
  return Math.round(base * modifiers.lumberIncomeMultiplier);
}

export function applyEnemyMoveSpeed(
  base: number,
  modifiers: RunModifiers,
): number {
  return base * modifiers.enemySpeedMultiplier;
}

export function applyCastleMaxHp(
  base: number,
  modifiers: RunModifiers,
): number {
  return base + modifiers.castleMaxHpBonus;
}
