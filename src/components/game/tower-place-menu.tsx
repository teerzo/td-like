"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel, TOWER_MENU_PREVIEW_CAMERA, TOWER_MENU_PREVIEW_POSITION } from "@/components/game/models";
import { TowerMenuHoverDetails } from "@/components/game/tower-hover-card";
import { TowerCombatStats } from "@/components/game/combat-stats-display";
import { ResourceCostRow } from "@/components/game/resource-icon";
import {
  formatTowerCounterHint,
} from "@/lib/combat-counters";
import {
  getTowerStats,
  TOWER_TYPE_IDS,
  type TowerTypeId,
} from "@/lib/tower-types";

export type TowerPlaceMenuState = {
  gx: number;
  gz: number;
  /** Position relative to the play container. */
  clientX: number;
  clientY: number;
};

type TowerPlaceMenuProps = {
  menu: TowerPlaceMenuState;
  gold: number;
  onSelect: (typeId: TowerTypeId) => void;
  onClose: () => void;
  onHoverType?: (typeId: TowerTypeId | null) => void;
};

export const TowerPlaceMenu = forwardRef<HTMLDivElement, TowerPlaceMenuProps>(
  function TowerPlaceMenu({ menu, gold, onSelect, onClose, onHoverType }, ref) {
    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close tower menu"
        portraitArc="topHalf"
        onClose={onClose}
        onActionHover={(actionId) => {
          onHoverType?.(
            actionId ? (actionId as TowerTypeId) : null,
          );
        }}
        actions={TOWER_TYPE_IDS.map((typeId) => {
          const stats = getTowerStats(typeId);
          const canAfford = gold >= stats.cost;

          return {
            id: typeId,
            label: `Place ${stats.label}`,
            costs: [{ resource: "gold" as const, amount: stats.cost }],
            canAfford,
            showCostBadge: false,
            hoverContent: (
              <TowerMenuHoverDetails
                name={stats.label}
                targetMovement={stats.targetMovement}
                targetPriority={stats.targetPriority}
              >
                <div className="mt-2">
                  <ResourceCostRow
                    costs={[{ resource: "gold", amount: stats.cost }]}
                  />
                </div>
                <p className="mt-2 text-white/70">
                  {formatTowerCounterHint(stats.role)}
                </p>
                <TowerCombatStats stats={stats} />
                <p className="mt-2 text-white/55">
                  {stats.attackRangeTiles} range · {stats.attackCooldown}s
                </p>
              </TowerMenuHoverDetails>
            ),
            preview: (
              <BuildIconPreview cameraPosition={TOWER_MENU_PREVIEW_CAMERA}>
                <TowerModel
                  typeId={typeId}
                  position={TOWER_MENU_PREVIEW_POSITION}
                />
              </BuildIconPreview>
            ),
            onSelect: () => onSelect(typeId),
          };
        })}
      />
    );
  },
);
