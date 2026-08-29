"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel } from "@/components/game/models";
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
};

export const TowerPlaceMenu = forwardRef<HTMLDivElement, TowerPlaceMenuProps>(
  function TowerPlaceMenu({ menu, gold, onSelect, onClose }, ref) {
    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close tower menu"
        onClose={onClose}
        actions={TOWER_TYPE_IDS.map((typeId) => {
          const stats = getTowerStats(typeId);
          const canAfford = gold >= stats.cost;

          return {
            id: typeId,
            label: `Place ${stats.label}`,
            costs: [{ resource: "gold" as const, amount: stats.cost }],
            canAfford,
            preview: (
              <BuildIconPreview>
                <TowerModel typeId={typeId} position={[0, -0.05, 0]} />
              </BuildIconPreview>
            ),
            onSelect: () => onSelect(typeId),
          };
        })}
      />
    );
  },
);
