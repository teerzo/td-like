"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { RockModel, TreeModel } from "@/components/game/models";
import type { ResourceCostLine } from "@/components/game/resource-icon";

export type ObstacleClearKind = "tree" | "rock";

export type ObstacleClearMenuState = {
  kind: ObstacleClearKind;
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type ObstacleClearMenuProps = {
  menu: ObstacleClearMenuState;
  gold: number;
  cost: number;
  /** Resource gained when cleared. */
  yieldResource: "wood" | "stone";
  yieldAmount: number;
  onClear: () => void;
  onClose: () => void;
};

export const ObstacleClearMenu = forwardRef<
  HTMLDivElement,
  ObstacleClearMenuProps
>(function ObstacleClearMenu(
  { menu, gold, cost, yieldResource, yieldAmount, onClear, onClose },
  ref,
) {
  const canAfford = gold >= cost;
  const label = menu.kind === "tree" ? "Cut Tree" : "Clear Rocks";
  const costs: ResourceCostLine[] = [
    { resource: "gold", amount: cost },
    { resource: yieldResource, amount: yieldAmount, gain: true },
  ];

  return (
    <BuildActionMenu
      ref={ref}
      clientX={menu.clientX}
      clientY={menu.clientY}
      closeLabel="Close clear menu"
      onClose={onClose}
      actions={[
        {
          id: menu.kind,
          label,
          costs,
          canAfford,
          preview: (
            <BuildIconPreview>
              {menu.kind === "tree" ? (
                <TreeModel position={[0, -0.2, 0]} scale={0.85} />
              ) : (
                <RockModel position={[0, -0.05, 0]} scale={0.95} />
              )}
            </BuildIconPreview>
          ),
          onSelect: onClear,
        },
      ]}
    />
  );
});
