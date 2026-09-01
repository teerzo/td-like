"use client";

import { forwardRef } from "react";
import { Trash2 } from "lucide-react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel, TOWER_MENU_PREVIEW_CAMERA, TOWER_MENU_PREVIEW_POSITION } from "@/components/game/models";
import { TowerMenuHoverDetails } from "@/components/game/tower-hover-card";
import { TowerCombatStats } from "@/components/game/combat-stats-display";
import { ResourceCostRow } from "@/components/game/resource-icon";
import { formatTowerCounterHint } from "@/lib/combat-counters";
import {
  getTowerSellRefund,
  getTowerStatsAtLevel,
  getTowerUpgradeCost,
  type TowerTypeId,
} from "@/lib/tower-types";

export type TowerManageMenuState = {
  towerId: number;
  typeId: TowerTypeId;
  level: number;
  clientX: number;
  clientY: number;
};

type TowerManageMenuProps = {
  menu: TowerManageMenuState;
  gold: number;
  onUpgrade: (towerId: number) => void;
  onDestroy: (towerId: number) => void;
  onClose: () => void;
};

export const TowerManageMenu = forwardRef<HTMLDivElement, TowerManageMenuProps>(
  function TowerManageMenu(
    { menu, gold, onUpgrade, onDestroy, onClose },
    ref,
  ) {
    const stats = getTowerStatsAtLevel(menu.typeId, menu.level);
    const upgradeCost = getTowerUpgradeCost(menu.typeId, menu.level);
    const sellRefund = getTowerSellRefund(menu.typeId, menu.level);
    const atMax = upgradeCost === null;
    const canAffordUpgrade = upgradeCost !== null && gold >= upgradeCost;

    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close tower menu"
        portraitArc="topHalf"
        onClose={onClose}
        actions={[
          {
            id: "upgrade",
            label: atMax
              ? `${stats.label} max level`
              : `Upgrade ${stats.label} to Lv ${(menu.level ?? 1) + 1}`,
            costs: atMax
              ? undefined
              : [{ resource: "gold", amount: upgradeCost! }],
            canAfford: atMax ? true : canAffordUpgrade,
            disabled: atMax,
            showCostBadge: false,
            hoverContent: (
              <TowerMenuHoverDetails
                name={stats.label}
                targetMovement={stats.targetMovement}
                targetPriority={stats.targetPriority}
                subtitle={
                  atMax
                    ? `Max level (Lv ${menu.level})`
                    : `Upgrade to Lv ${(menu.level ?? 1) + 1}`
                }
              >
                {!atMax ? (
                  <div className="mt-2">
                    <ResourceCostRow
                      costs={[{ resource: "gold", amount: upgradeCost! }]}
                    />
                  </div>
                ) : null}
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
                  typeId={menu.typeId}
                  position={TOWER_MENU_PREVIEW_POSITION}
                />
              </BuildIconPreview>
            ),
            onSelect: () => onUpgrade(menu.towerId),
          },
          {
            id: "destroy",
            label: `Destroy ${stats.label}`,
            costs: [{ resource: "gold", amount: sellRefund, gain: true }],
            costTone: "refund",
            canAfford: true,
            showCostBadge: false,
            hoverContent: (
              <TowerMenuHoverDetails
                name={stats.label}
                targetMovement={stats.targetMovement}
                targetPriority={stats.targetPriority}
                subtitle="Destroy tower"
              >
                <div className="mt-2">
                  <ResourceCostRow
                    costs={[
                      { resource: "gold", amount: sellRefund, gain: true },
                    ]}
                  />
                </div>
              </TowerMenuHoverDetails>
            ),
            preview: (
              <div className="flex h-full w-full items-center justify-center bg-rose-950/50">
                <Trash2
                  className="text-rose-200"
                  size={28}
                  strokeWidth={2.25}
                  aria-hidden
                />
              </div>
            ),
            onSelect: () => onDestroy(menu.towerId),
          },
        ]}
      />
    );
  },
);
