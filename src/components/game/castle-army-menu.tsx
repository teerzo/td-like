"use client";

import { Feather, Heart, Shield, SportShoe } from "lucide-react";
import type { ReactNode } from "react";

import {
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { EnemyModel } from "@/components/game/models";
import { ResourceIcon, type ResourceId } from "@/components/game/resource-icon";
import { getEnemyStats, type EnemyMovementType } from "@/lib/enemy-types";
import {
  ARMY_UNIT_IDS,
  armyTotal,
  canAffordUnit,
  getUnitCostLines,
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
  isDay: boolean;
  raidStatus: string | null;
  onRecruit: (unitId: ArmyUnitId) => void;
  onClear: () => void;
  onSendAttack: () => void;
  onClose: () => void;
};

function PortraitStatCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-1 items-center justify-center gap-0.5 py-1.5 text-xs font-bold tabular-nums ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

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

const RESOURCE_CELL_STYLE: Record<ResourceId, string> = {
  gold: "bg-amber-500/10 text-amber-300",
  iron: "bg-slate-500/10 text-slate-300",
  wood: "bg-lime-500/10 text-lime-400",
  stone: "bg-stone-500/10 text-stone-300",
  food: "bg-orange-500/10 text-orange-300",
};

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
  isDay,
  raidStatus,
  onRecruit,
  onClear,
  onSendAttack,
  onClose,
}: CastleArmyMenuProps) {
  const total = armyTotal(army);
  const canSend = isDay && total > 0;
  const canClear = isDay && total > 0;
  const resources = { gold, iron, wood, stone, food };

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
            const stats = getEnemyStats(unitId);
            const costLines = getUnitCostLines(unitId);
            const affordable = canAffordUnit(unitId, resources);
            const recruitDisabled = !isDay || !affordable;
            const needHint = missingUnitCostHint(unitId, resources);
            const foodCost = costLines[0];
            const extraCost = costLines[1];

            return (
              <div key={unitId} className="flex flex-col gap-1">
                <div className="flex flex-col overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-[#1a2332]/95 to-[#0e121a]/95 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
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

                  <button
                    type="button"
                    disabled={recruitDisabled}
                    title={
                      !isDay
                        ? "Recruit during the day"
                        : affordable
                          ? `Recruit ${stats.label}`
                          : needHint
                    }
                    aria-label={
                      affordable && isDay
                        ? `Recruit ${stats.label}`
                        : `Cannot recruit ${stats.label}`
                    }
                    className="group relative aspect-[4/5] w-full transition enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onRecruit(unitId)}
                  >
                    <div className="absolute inset-0 overflow-hidden bg-[#121820] transition group-enabled:group-hover:bg-[#182030]">
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
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 transition group-enabled:group-hover:ring-amber-400/30" />
                  </button>

                  <div className="flex border-t border-white/10">
                    <PortraitStatCell
                      className={`border-r border-white/10 ${
                        foodCost
                          ? RESOURCE_CELL_STYLE[foodCost.resource]
                          : "bg-white/5"
                      }`}
                    >
                      {foodCost ? (
                        <>
                          <ResourceIcon resource={foodCost.resource} size={11} />
                          {foodCost.amount}
                        </>
                      ) : null}
                    </PortraitStatCell>
                    <PortraitStatCell
                      className={
                        extraCost
                          ? RESOURCE_CELL_STYLE[extraCost.resource]
                          : RESOURCE_CELL_STYLE.food
                      }
                    >
                      {extraCost ? (
                        <>
                          <ResourceIcon resource={extraCost.resource} size={11} />
                          {extraCost.amount}
                        </>
                      ) : (
                        <span
                          className="invisible inline-flex items-center gap-0.5"
                          aria-hidden
                        >
                          <ResourceIcon resource="food" size={11} />
                          0
                        </span>
                      )}
                    </PortraitStatCell>
                  </div>
                </div>
                <div className="text-center text-xs font-bold tabular-nums text-emerald-400">
                  x{army[unitId]}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-2.5">
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
          {raidStatus ? (
            <p className="text-center text-sm text-emerald-300/90" aria-live="polite">
              {raidStatus}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
