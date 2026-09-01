"use client";

import { forwardRef } from "react";
import { Trash2 } from "lucide-react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel, TOWER_MENU_PREVIEW_CAMERA, TOWER_MENU_PREVIEW_POSITION } from "@/components/game/models";
import { PortraitCostRow } from "@/components/game/portrait-card";
import { TowerCardHeader } from "@/components/game/tower-portrait";
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
    const nextLevel = (menu.level ?? 1) + 1;

    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close tower menu"
        portraitArc="topHalf"
        portraitStyle="card"
        onClose={onClose}
        actions={[
          {
            id: "upgrade",
            label: atMax
              ? `${stats.label} max level`
              : `Upgrade ${stats.label} to Lv ${nextLevel}`,
            costs: atMax
              ? undefined
              : [{ resource: "gold", amount: upgradeCost! }],
            canAfford: atMax ? true : canAffordUpgrade,
            disabled: atMax,
            cardHeader: (
              <TowerCardHeader
                stats={stats}
                subtitle={atMax ? `${stats.label} · Max` : `${stats.label} · Lv ${nextLevel}`}
              />
            ),
            cardFooter: atMax ? (
              <div className="border-t border-white/10 py-0.5 text-center text-[10px] font-bold text-white/45">
                Max level
              </div>
            ) : (
              <PortraitCostRow
                compact
                costs={[{ resource: "gold", amount: upgradeCost! }, null, null]}
              />
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
            cardHeader: <TowerCardHeader stats={stats} subtitle="Destroy" />,
            cardFooter: (
              <PortraitCostRow
                compact
                costs={[
                  { resource: "gold", amount: sellRefund, gain: true },
                  null,
                  null,
                ]}
              />
            ),
            preview: (
              <div className="flex h-full w-full items-center justify-center bg-rose-950/50">
                <Trash2
                  className="text-rose-200"
                  size={20}
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
