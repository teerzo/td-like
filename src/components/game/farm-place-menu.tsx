"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { FarmWindmillModel } from "@/components/game/models";
import { canAffordFarm, FARM_COST } from "@/lib/fertile-farm";

export type FarmPlaceMenuState = {
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type FarmPlaceMenuProps = {
  menu: FarmPlaceMenuState;
  gold: number;
  iron: number;
  wood: number;
  onBuild: () => void;
  onClose: () => void;
};

export const FarmPlaceMenu = forwardRef<HTMLDivElement, FarmPlaceMenuProps>(
  function FarmPlaceMenu({ menu, gold, iron, wood, onBuild, onClose }, ref) {
    const canAfford = canAffordFarm({ gold, iron, wood });

    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close farm menu"
        onClose={onClose}
        actions={[
          {
            id: "farm",
            label: "Build Farm",
            costs: [
              { resource: "gold", amount: FARM_COST.gold },
              { resource: "iron", amount: FARM_COST.iron },
              { resource: "wood", amount: FARM_COST.wood },
            ],
            canAfford,
            preview: (
              <BuildIconPreview cameraPosition={[1.6, 1.5, 1.6]}>
                <FarmWindmillModel position={[0, -0.15, 0]} scale={0.85} />
              </BuildIconPreview>
            ),
            onSelect: onBuild,
          },
        ]}
      />
    );
  },
);
