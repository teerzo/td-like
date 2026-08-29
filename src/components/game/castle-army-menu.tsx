"use client";

import {
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { EnemyModel } from "@/components/game/models";
import { ResourceAmount } from "@/components/game/resource-icon";
import { getEnemyStats } from "@/lib/enemy-types";
import {
  ARMY_UNIT_COSTS,
  ARMY_UNIT_IDS,
  armyTotal,
  canAffordUnit,
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
  food: number;
  isDay: boolean;
  raidStatus: string | null;
  onRecruit: (unitId: ArmyUnitId) => void;
  onSendAttack: () => void;
  onClose: () => void;
};

export function CastleArmyMenu({
  menu: _menu,
  army,
  food,
  isDay,
  raidStatus,
  onRecruit,
  onSendAttack,
  onClose,
}: CastleArmyMenuProps) {
  const total = armyTotal(army);
  const canSend = isDay && total > 0;

  return (
    <>
      <button
        type="button"
        aria-label="Close army menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-black/35"
        onClick={onClose}
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-400/35 bg-gradient-to-br from-[#152033]/97 to-[#0e121a]/97 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        role="dialog"
        aria-label="Castle army"
      >
        <div className="relative mb-3 pr-8">
          <h2 className="text-lg font-semibold tracking-wide text-amber-100">
            Army
          </h2>
          <p className="mt-0.5 text-[11px] text-amber-200/60">
            {isDay
              ? "Recruit by day, send a raid when ready."
              : "Night raids are inbound — manage your army during the day."}
          </p>
          <button
            type="button"
            aria-label="Close army menu"
            className="absolute top-0 right-0 rounded-md px-1.5 py-0.5 text-sm text-amber-200/60 transition hover:bg-white/10 hover:text-amber-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ARMY_UNIT_IDS.map((unitId) => {
            const stats = getEnemyStats(unitId);
            const foodCost = ARMY_UNIT_COSTS[unitId].food;
            const affordable = canAffordUnit(unitId, { food });
            const recruitDisabled = !isDay || !affordable;

            return (
              <div
                key={unitId}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-black/25 p-2"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full border border-white/25 bg-[#1a2332]">
                  <BuildIconPreview
                    cameraPosition={
                      unitId === "dragon" || unitId === "catapult"
                        ? [2.0, 1.6, 2.0]
                        : [1.4, 1.35, 1.4]
                    }
                  >
                    <EnemyModel typeId={unitId} />
                  </BuildIconPreview>
                </div>
                <span className="text-xs font-medium text-stone-100">
                  {stats.label}
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] tabular-nums text-stone-300">
                    x{army[unitId]}
                  </span>
                  <ResourceAmount
                    resource="food"
                    amount={foodCost}
                    className="text-white"
                  />
                </span>
                <button
                  type="button"
                  disabled={recruitDisabled}
                  title={
                    !isDay
                      ? "Recruit during the day"
                      : affordable
                        ? `Recruit ${stats.label}`
                        : `Need x${foodCost} food`
                  }
                  className="w-full rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white transition enabled:hover:border-amber-300/60 enabled:hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => onRecruit(unitId)}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            disabled={!canSend}
            className="w-full rounded-xl border border-amber-300/50 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-50 transition enabled:hover:bg-amber-500/35 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onSendAttack}
          >
            Send Attack
          </button>
          {raidStatus ? (
            <p className="text-center text-[11px] text-emerald-300/90" aria-live="polite">
              {raidStatus}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
