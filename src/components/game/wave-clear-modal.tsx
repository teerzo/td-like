"use client";

import { BuildIconPreview } from "@/components/game/build-action-menu";
import { EnemyModel } from "@/components/game/models";
import { ResourceAmount } from "@/components/game/resource-icon";
import { ENEMY_TYPE_IDS, getEnemyStats, type EnemyTypeId } from "@/lib/enemy-types";

export type WaveClearModalState = {
  kills: Partial<Record<EnemyTypeId, number>>;
  leaks: Partial<Record<EnemyTypeId, number>>;
  foodReward: number;
  waveGold: number;
  armyGold: number;
  buildingGold: number;
  buildingIron: number;
  buildingFood: number;
  buildingWood: number;
};

function enemyCountEntries(counts: Partial<Record<EnemyTypeId, number>>) {
  return ENEMY_TYPE_IDS.filter((typeId) => (counts[typeId] ?? 0) > 0).map(
    (typeId) => ({
      typeId,
      count: counts[typeId]!,
      label: getEnemyStats(typeId).label,
    }),
  );
}

function enemyPreviewCamera(typeId: EnemyTypeId): [number, number, number] {
  return typeId === "dragon" || typeId === "catapult"
    ? [2.0, 1.6, 2.0]
    : [1.4, 1.35, 1.4];
}

type WaveClearModalProps = {
  result: WaveClearModalState;
  onAccept: () => void;
};

export function LeakedEnemiesPanel({
  leaks,
}: {
  leaks: Partial<Record<EnemyTypeId, number>>;
}) {
  const leakEntries = enemyCountEntries(leaks);

  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5">
      <div className="text-[10px] font-medium tracking-wide text-rose-200/70 uppercase">
        Leaked to castle
      </div>
      {leakEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {leakEntries.map(({ typeId, label, count }) => (
            <div
              key={typeId}
              className="flex min-w-[88px] flex-1 items-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-black/25"
            >
              <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-[#121820]">
                <BuildIconPreview cameraPosition={enemyPreviewCamera(typeId)}>
                  <EnemyModel typeId={typeId} />
                </BuildIconPreview>
              </div>
              <div className="pr-2">
                <div className="text-sm font-semibold text-rose-50">{label}</div>
                <div className="text-xs tabular-nums text-rose-200/75">×{count}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-rose-100/80">None reached the castle</p>
      )}
    </div>
  );
}

export function WaveClearModal({ result, onAccept }: WaveClearModalProps) {
  const killEntries = enemyCountEntries(result.kills);

  const totalFood = result.foodReward + result.buildingFood;
  const totalGold = result.waveGold + result.armyGold + result.buildingGold;
  const hasBuildingYield =
    result.buildingGold > 0 ||
    result.buildingIron > 0 ||
    result.buildingFood > 0 ||
    result.buildingWood > 0;

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-0 z-40 bg-black/50"
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-[#102818]/97 to-[#12151c]/97 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wave-clear-title"
      >
        <h2
          id="wave-clear-title"
          className="text-lg font-semibold tracking-wide text-emerald-100"
        >
          Wave cleared
        </h2>
        <div className="mt-3">
          <div className="text-[10px] font-medium tracking-wide text-emerald-200/55 uppercase">
            Killed
          </div>
          <p className="mt-1 text-sm text-emerald-200/75">
            {killEntries.length > 0
              ? killEntries.map(({ label, count }) => `${label} ×${count}`).join(" · ")
              : "No kills recorded"}
          </p>
        </div>
        <div className="mt-3">
          <LeakedEnemiesPanel leaks={result.leaks} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-emerald-100">
          {totalFood > 0 ? (
            <ResourceAmount
              resource="food"
              amount={totalFood}
              gain
              size="md"
            />
          ) : null}
          {totalGold > 0 ? (
            <ResourceAmount
              resource="gold"
              amount={totalGold}
              gain
              size="md"
            />
          ) : null}
          {result.buildingIron > 0 ? (
            <ResourceAmount
              resource="iron"
              amount={result.buildingIron}
              gain
              size="md"
            />
          ) : null}
          {result.buildingWood > 0 ? (
            <ResourceAmount
              resource="wood"
              amount={result.buildingWood}
              gain
              size="md"
            />
          ) : null}
        </div>
        {hasBuildingYield ? (
          <p className="mt-1.5 text-[11px] text-emerald-200/55">
            Includes building yields (+5 each)
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-emerald-300/50 bg-emerald-500/25 px-3 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/40"
          onClick={onAccept}
        >
          Accept
        </button>
      </div>
    </>
  );
}

/**
 * Wave-end food: `3 × waveLevel`, independent of kills.
 */
export function computeWaveFoodReward(waveLevel: number): number {
  return 3 * Math.max(1, waveLevel);
}

/** Wave-end gold: `10 × waveLevel`, independent of kills. */
export function computeWaveGoldReward(waveLevel: number): number {
  return 10 * Math.max(1, waveLevel);
}
