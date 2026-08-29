"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { GoldMineModel, IronMineModel } from "@/components/game/models";
import { GOLD_MINE_COST, IRON_MINE_COST } from "@/lib/gold-mine";

export type MinePlaceKind = "gold" | "iron";

export type MinePlaceMenuState = {
  kind: MinePlaceKind;
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type MinePlaceMenuProps = {
  menu: MinePlaceMenuState;
  gold: number;
  onBuild: () => void;
  onClose: () => void;
};

export const MinePlaceMenu = forwardRef<HTMLDivElement, MinePlaceMenuProps>(
  function MinePlaceMenu({ menu, gold, onBuild, onClose }, ref) {
    const cost = menu.kind === "gold" ? GOLD_MINE_COST : IRON_MINE_COST;
    const canAfford = gold >= cost;
    const label =
      menu.kind === "gold" ? "Build Gold Mine" : "Build Iron Mine";

    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close mine menu"
        onClose={onClose}
        actions={[
          {
            id: menu.kind,
            label,
            costs: [{ resource: "gold", amount: cost }],
            canAfford,
            preview: (
              <BuildIconPreview cameraPosition={[1.5, 1.35, 1.5]}>
                {menu.kind === "gold" ? (
                  <GoldMineModel position={[0, -0.12, 0]} scale={0.9} />
                ) : (
                  <IronMineModel position={[0, -0.12, 0]} scale={0.9} />
                )}
              </BuildIconPreview>
            ),
            onSelect: onBuild,
          },
        ]}
      />
    );
  },
);
