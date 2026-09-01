"use client";

import { Feather, Heart, Shield, SportShoe } from "lucide-react";

import {
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { EnemyModel } from "@/components/game/models";
import {
  PortraitCard,
  PortraitCostRow,
  PortraitStatCell,
} from "@/components/game/portrait-card";
import { ResourceAmount, ResourceCostRow, ResourceIcon } from "@/components/game/resource-icon";
import { computeWaveFoodReward, computeWaveGoldReward } from "@/components/game/wave-clear-modal";
import { FARM_INCOME } from "@/lib/fertile-farm";
import { FISHING_HUT_INCOME } from "@/lib/fishing-hut";
import { GOLD_MINE_INCOME, IRON_MINE_INCOME } from "@/lib/gold-mine";
import { LUMBER_MILL_INCOME } from "@/lib/lumber-mill";
import {
  applyFarmFoodIncome,
  applyLumberIncome,
  applyMineIncome,
  applyWaveGoldReward,
  createEmptyRunModifiers,
  type RunModifiers,
} from "@/lib/run-relics";
import { getEnemyStatsAtLevel, type EnemyMovementType } from "@/lib/enemy-types";
import {
  ARMY_UNIT_GOLD_INCOME,
  ARMY_UNIT_IDS,
  armyGoldIncome,
  armyTotal,
  canAffordArmyUpgrade,
  canAffordUnit,
  getArmyUpgradeCostLines,
  getUnitCostLines,
  MAX_ARMY_LEVEL,
  missingArmyUpgradeHint,
  missingUnitCostHint,
  type ArmyRoster,
  type ArmyUnitId,
} from "@/lib/army-types";

export type CastleArmyMenuState = {
  clientX: number;
  clientY: number;
};

type CastleArmyMenuProps = {
  menu: CastleArmyMenuState;
  army: ArmyRoster;
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
  waveLevel: number;
  farmCount: number;
  lumberMillCount: number;
  fishingHutCount: number;
  goldMineCount: number;
  ironMineCount: number;
  isDay: boolean;
  armyLevel: number;
  runModifiers?: RunModifiers;
  onRecruit: (unitId: ArmyUnitId) => void;
  onUpgradeArmy: () => void;
  onClear: () => void;
  onSendAttack: () => void;
  onClose: () => void;
};

function EnemyMovementIcon({
  movementType,
}: {
  movementType: EnemyMovementType;
}) {
  const isFlying = movementType === "flying";

  return (
    <span title={isFlying ? "Flying" : "Ground"} aria-hidden>
      {isFlying ? (
        <Feather className="text-sky-300" size={12} strokeWidth={2.25} />
      ) : (
        <SportShoe className="text-amber-200" size={12} strokeWidth={2.25} />
      )}
    </span>
  );
}

const MOVEMENT_CELL_STYLE: Record<EnemyMovementType, string> = {
  flying: "bg-sky-500/10 text-sky-200",
  ground: "bg-amber-500/10 text-amber-200",
};

export function CastleArmyMenu({
  menu: _menu,
  army,
  gold,
  iron,
  wood,
  stone,
  food,
  waveLevel,
  farmCount,
  lumberMillCount,
  fishingHutCount,
  goldMineCount,
  ironMineCount,
  isDay,
  armyLevel,
  runModifiers,
  onRecruit,
  onUpgradeArmy,
  onClear,
  onSendAttack,
  onClose,
}: CastleArmyMenuProps) {
  const modifiers = runModifiers ?? createEmptyRunModifiers();
  const foodDiscount = modifiers.recruitFoodDiscount;
  const total = armyTotal(army);
  const armyGold = armyGoldIncome(army);
  const waveFood = computeWaveFoodReward(waveLevel);
  const waveGold = applyWaveGoldReward(
    computeWaveGoldReward(waveLevel),
    modifiers,
  );
  const buildingFood = applyFarmFoodIncome(
    FARM_INCOME * farmCount + FISHING_HUT_INCOME * fishingHutCount,
    modifiers,
  );
  const buildingGold = applyMineIncome(GOLD_MINE_INCOME, modifiers) * goldMineCount;
  const buildingIron = applyMineIncome(IRON_MINE_INCOME, modifiers) * ironMineCount;
  const buildingWood = applyLumberIncome(
    LUMBER_MILL_INCOME * lumberMillCount,
    modifiers,
  );
  const buildingYields = [
    buildingFood > 0 ? { resource: "food" as const, amount: buildingFood, gain: true } : null,
    buildingGold > 0 ? { resource: "gold" as const, amount: buildingGold, gain: true } : null,
    buildingIron > 0 ? { resource: "iron" as const, amount: buildingIron, gain: true } : null,
    buildingWood > 0 ? { resource: "wood" as const, amount: buildingWood, gain: true } : null,
  ].filter((line): line is NonNullable<typeof line> => line !== null);
  const totalFood = waveFood + buildingFood;
  const totalGold = waveGold + armyGold + buildingGold;
  const canSend = isDay && total > 0;
  const canClear = isDay && total > 0;
  const resources = { gold, iron, wood, stone, food };
  const atMaxArmyLevel = armyLevel >= MAX_ARMY_LEVEL;
  const upgradeCostLines = getArmyUpgradeCostLines(armyLevel);
  const canAffordUpgrade = canAffordArmyUpgrade(armyLevel, resources);
  const canUpgrade = isDay && !atMaxArmyLevel && canAffordUpgrade;
  const upgradeHint = !isDay
    ? "Upgrade during the day"
    : atMaxArmyLevel
      ? "Army is max level"
      : canAffordUpgrade
        ? `Upgrade army to Lv ${armyLevel + 1}`
        : missingArmyUpgradeHint(armyLevel, resources);

  return (
    <>
      <button
        type="button"
        aria-label="Close army menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-black/35"
        onClick={onClose}
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-30 flex w-max max-w-[94vw] max-h-[min(90dvh,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-[#152033]/97 to-[#0e121a]/97 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        role="dialog"
        aria-label="Castle army"
      >
        <div className="relative mb-4 shrink-0 pr-10">
          <h2 className="text-2xl font-semibold tracking-wide text-amber-100">
            Army
          </h2>
          <p className="mt-1 text-sm text-amber-200/70">
            {isDay
              ? "Recruit by day, send a raid when ready."
              : "Night raids are inbound — manage your army during the day."}
          </p>
          <button
            type="button"
            aria-label="Close army menu"
            className="absolute top-0 right-0 rounded-md px-2 py-1 text-base text-amber-200/60 transition hover:bg-white/10 hover:text-amber-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${ARMY_UNIT_IDS.length}, minmax(8.5rem, 1fr))`,
            }}
          >
          {ARMY_UNIT_IDS.map((unitId) => {
            const stats = getEnemyStatsAtLevel(unitId, armyLevel);
            const costLines = getUnitCostLines(unitId, foodDiscount);
            const affordable = canAffordUnit(unitId, resources, foodDiscount);
            const recruitDisabled = !isDay || !affordable;
            const needHint = missingUnitCostHint(unitId, resources, foodDiscount);
            const foodCost = costLines[0];
            const extraCost = costLines[1];

            return (
              <div key={unitId} className="flex flex-col gap-1">
                <PortraitCard
                  disabled={recruitDisabled}
                  title={
                    !isDay
                      ? "Recruit during the day"
                      : affordable
                        ? `Recruit ${stats.label}`
                        : needHint
                  }
                  ariaLabel={
                    affordable && isDay
                      ? `Recruit ${stats.label}`
                      : `Cannot recruit ${stats.label}`
                  }
                  header={
                    <>
                      <div className="flex border-b border-white/10">
                        <PortraitStatCell className="border-r border-white/10 bg-rose-500/10 text-rose-300">
                          <Heart
                            aria-hidden
                            className="fill-rose-400 text-rose-400"
                            size={11}
                            strokeWidth={1.75}
                          />
                          {stats.health}
                        </PortraitStatCell>
                        <PortraitStatCell className="bg-sky-500/10 text-sky-200">
                          <Shield
                            aria-hidden
                            className="fill-sky-300 text-sky-300"
                            size={11}
                            strokeWidth={1.75}
                          />
                          {stats.armor}
                        </PortraitStatCell>
                      </div>
                      <div className="flex border-b border-white/10">
                        <PortraitStatCell
                          className={`gap-1 ${MOVEMENT_CELL_STYLE[stats.movementType]}`}
                        >
                          <EnemyMovementIcon movementType={stats.movementType} />
                          {stats.label}
                        </PortraitStatCell>
                      </div>
                    </>
                  }
                  footer={
                    <PortraitCostRow
                      costs={[
                        foodCost,
                        extraCost,
                        {
                          resource: "gold",
                          amount: ARMY_UNIT_GOLD_INCOME[unitId],
                          gain: true,
                        },
                      ]}
                    />
                  }
                  onSelect={() => onRecruit(unitId)}
                >
                  <BuildIconPreview
                    cameraPosition={
                      unitId === "dragon" || unitId === "catapult"
                        ? [2.0, 1.6, 2.0]
                        : [1.4, 1.35, 1.4]
                    }
                  >
                    <EnemyModel typeId={unitId} />
                  </BuildIconPreview>
                </PortraitCard>
                <div className="text-center text-xs font-bold tabular-nums text-emerald-400">
                  x{army[unitId]}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="mt-3 flex shrink-0 items-center justify-center gap-4 text-xs font-bold tabular-nums">
          <span className="text-emerald-400">x{total}</span>
          <span className="inline-flex items-center gap-0.5 text-amber-300">
            <ResourceIcon resource="gold" size={11} />
            {armyGold}
          </span>
        </div>

        <div className="mt-3 shrink-0 rounded-xl border border-amber-400/20 bg-black/20 px-3 py-2">
          <div className="text-center text-[10px] font-medium tracking-wide text-amber-200/55 uppercase">
            Wave end income
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] text-amber-200/50">Level</span>
              <ResourceAmount resource="food" amount={waveFood} gain />
              <ResourceAmount resource="gold" amount={waveGold} gain />
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] text-amber-200/50">Builds</span>
              {buildingYields.length > 0 ? (
                <ResourceCostRow costs={buildingYields} />
              ) : (
                <span className="text-[10px] text-amber-200/40">—</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] text-amber-200/50">Army</span>
              <ResourceAmount resource="gold" amount={armyGold} gain />
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3">
            {totalFood > 0 ? (
              <ResourceAmount resource="food" amount={totalFood} gain size="md" />
            ) : null}
            {totalGold > 0 ? (
              <ResourceAmount resource="gold" amount={totalGold} gain size="md" />
            ) : null}
            {buildingIron > 0 ? (
              <ResourceAmount
                resource="iron"
                amount={buildingIron}
                gain
                size="md"
              />
            ) : null}
            {buildingWood > 0 ? (
              <ResourceAmount
                resource="wood"
                amount={buildingWood}
                gain
                size="md"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-2.5">
          <button
            type="button"
            disabled={!canUpgrade}
            title={upgradeHint}
            aria-label={upgradeHint}
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2.5 text-base font-semibold text-amber-50 transition enabled:hover:border-amber-300/60 enabled:hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onUpgradeArmy}
          >
            <span>
              {atMaxArmyLevel
                ? `Army Lv ${armyLevel} · Max`
                : `Upgrade army · Lv ${armyLevel}`}
            </span>
            {!atMaxArmyLevel ? (
              <ResourceCostRow costs={upgradeCostLines} />
            ) : null}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!canClear}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-base font-semibold text-white/85 transition enabled:hover:border-rose-300/50 enabled:hover:bg-rose-500/15 enabled:hover:text-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={onClear}
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!canSend}
              className="rounded-xl border border-amber-300/50 bg-amber-500/20 px-3 py-2.5 text-base font-semibold text-amber-50 transition enabled:hover:bg-amber-500/35 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={onSendAttack}
            >
              Send Attack
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
