"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { TowerModel, TOWER_MENU_PREVIEW_CAMERA, TOWER_MENU_PREVIEW_POSITION } from "@/components/game/models";
import { TowerCardCostRow, TowerCardHeader } from "@/components/game/tower-portrait";
import {
  canAffordTowerPlace,
  getTowerPlaceCosts,
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
  iron: number;
  wood: number;
  onSelect: (typeId: TowerTypeId) => void;
  onClose: () => void;
  onHoverType?: (typeId: TowerTypeId | null) => void;
};

export const TowerPlaceMenu = forwardRef<HTMLDivElement, TowerPlaceMenuProps>(
  function TowerPlaceMenu(
    { menu, gold, iron, wood, onSelect, onClose, onHoverType },
    ref,
  ) {
    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close tower menu"
        portraitArc="topHalf"
        portraitStyle="card"
        onClose={onClose}
        onActionHover={(actionId) => {
          onHoverType?.(
            actionId ? (actionId as TowerTypeId) : null,
          );
        }}
        actions={TOWER_TYPE_IDS.map((typeId) => {
          const stats = getTowerStats(typeId);
          const costs = getTowerPlaceCosts(typeId);
          const canAfford = canAffordTowerPlace(typeId, gold, wood, iron);

          return {
            id: typeId,
            label: `Place ${stats.label}`,
            costs,
            canAfford,
            cardHeader: <TowerCardHeader stats={stats} />,
            cardFooter: <TowerCardCostRow costs={costs} />,
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
