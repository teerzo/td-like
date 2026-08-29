"use client";

import { ResourceAmount } from "@/components/game/resource-icon";
import { ARMY_UNIT_COSTS, isArmyUnitId } from "@/lib/army-types";
import { getEnemyStats, type EnemyTypeId } from "@/lib/enemy-types";

export type WaveClearModalState = {
  kills: Partial<Record<EnemyTypeId, number>>;
  foodReward: number;
};

type WaveClearModalProps = {
  result: WaveClearModalState;
  onAccept: () => void;
};

export function WaveClearModal({ result, onAccept }: WaveClearModalProps) {
  const lines = Object.entries(result.kills)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([typeId, count]) => {
      const stats = getEnemyStats(typeId as EnemyTypeId);
      return `${stats.label} ×${count}`;
    });

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-0 z-40 bg-black/50"
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-[#102818]/97 to-[#12151c]/97 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
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
        <p className="mt-2 text-sm text-emerald-200/75">
          {lines.length > 0 ? lines.join(" · ") : "No kills recorded"}
        </p>
        <div className="mt-3 text-emerald-100">
          <ResourceAmount
            resource="food"
            amount={result.foodReward}
            gain
            size="md"
          />
        </div>
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
 * Wave food reward: sum of killed units' recruit food costs, plus `1 × waveLevel`.
 * Non-army types (debug spawns) contribute 0 to the cost sum.
 */
export function computeWaveFoodReward(
  kills: Partial<Record<EnemyTypeId, number>>,
  waveLevel: number,
): number {
  let costTotal = 0;
  for (const [typeId, count] of Object.entries(kills)) {
    if (!count || count <= 0) {
      continue;
    }
    const id = typeId as EnemyTypeId;
    const cost = isArmyUnitId(id) ? ARMY_UNIT_COSTS[id].food : 0;
    costTotal += count * cost;
  }
  return costTotal + Math.max(1, waveLevel);
}
