"use client";

import { Feather, Radius, SportShoe, Swords, Target } from "lucide-react";

import {
  PortraitCostRow,
  PortraitStatCell,
} from "@/components/game/portrait-card";
import type { ResourceCostLine } from "@/components/game/resource-icon";
import {
  formatTowerTargetCategory,
  type TowerPlaceResourceCost,
  type TowerStats,
} from "@/lib/tower-types";

const TARGET_CELL_STYLE: Record<TowerStats["targetMovement"], string> = {
  flying: "bg-sky-500/10 text-sky-200",
  ground: "bg-amber-500/10 text-amber-200",
  any: "bg-violet-500/10 text-violet-200",
};

function TowerTargetIcon({
  targetMovement,
}: {
  targetMovement: TowerStats["targetMovement"];
}) {
  const label = formatTowerTargetCategory(targetMovement);

  return (
    <span title={label} aria-hidden>
      {targetMovement === "flying" ? (
        <Feather className="text-sky-300" size={9} strokeWidth={2.25} />
      ) : targetMovement === "ground" ? (
        <SportShoe className="text-amber-200" size={9} strokeWidth={2.25} />
      ) : (
        <Target className="text-violet-300" size={9} strokeWidth={2.25} />
      )}
    </span>
  );
}

export function TowerCardHeader({
  stats,
  subtitle,
}: {
  stats: TowerStats;
  subtitle?: string;
}) {
  return (
    <>
      <div className="flex border-b border-white/10">
        <PortraitStatCell compact className="border-r border-white/10 bg-orange-500/10 text-orange-300">
          <Swords
            aria-hidden
            className="text-orange-300"
            size={9}
            strokeWidth={2.25}
          />
          {stats.damage}
        </PortraitStatCell>
        <PortraitStatCell compact className="bg-sky-500/10 text-sky-200">
          <Radius
            aria-hidden
            className="text-sky-300"
            size={9}
            strokeWidth={2.25}
          />
          {stats.attackRangeTiles}
        </PortraitStatCell>
      </div>
      <div className="flex border-b border-white/10">
        <PortraitStatCell
          compact
          className={`min-w-0 gap-0.5 ${TARGET_CELL_STYLE[stats.targetMovement]}`}
        >
          <TowerTargetIcon targetMovement={stats.targetMovement} />
          <span className="truncate">{subtitle ?? stats.label}</span>
        </PortraitStatCell>
      </div>
    </>
  );
}

export function TowerCardCostRow({
  costs,
}: {
  costs: readonly TowerPlaceResourceCost[] | readonly ResourceCostLine[];
}) {
  return (
    <PortraitCostRow
      compact
      costs={[
        costs.find((cost) => cost.resource === "gold"),
        costs.find((cost) => cost.resource === "iron"),
        costs.find((cost) => cost.resource === "wood"),
      ]}
    />
  );
}
