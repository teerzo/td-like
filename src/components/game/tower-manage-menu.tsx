"use client";

import { forwardRef } from "react";
import { Trash2 } from "lucide-react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel } from "@/components/game/models";
import {
  getTowerSellRefund,
  getTowerStatsAtLevel,
  getTowerUpgradeCost,
  MAX_TOWER_LEVEL,
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
        onClose={onClose}
        actions={[
          {
            id: "upgrade",
            label: atMax
              ? `${stats.label} max level`
              : `Upgrade ${stats.label} to Lv ${(menu.level ?? 1) + 1}`,
            costNote: atMax ? `Lv ${MAX_TOWER_LEVEL}` : undefined,
            costs: atMax
              ? undefined
              : [{ resource: "gold", amount: upgradeCost! }],
            canAfford: atMax ? true : canAffordUpgrade,
            disabled: atMax,
            preview: (
              <BuildIconPreview>
                <TowerModel
                  typeId={menu.typeId}
                  position={[0, -0.05, 0]}
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
