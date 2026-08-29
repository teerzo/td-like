"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { EdgeGateModel } from "@/components/game/edge-gate-model";
import type { LevelEdge } from "@/lib/world-layout";

export const EDGE_GATE_COST = 100;

export type EdgeGateMenuState = {
  edge: LevelEdge;
  clientX: number;
  clientY: number;
};

type EdgeGateMenuProps = {
  menu: EdgeGateMenuState;
  gold: number;
  onUnlock: (edge: LevelEdge) => void;
  onClose: () => void;
};

export const EdgeGateMenu = forwardRef<HTMLDivElement, EdgeGateMenuProps>(
  function EdgeGateMenu({ menu, gold, onUnlock, onClose }, ref) {
    const canAfford = gold >= EDGE_GATE_COST;

    return (
      <BuildActionMenu
        ref={ref}
        clientX={menu.clientX}
        clientY={menu.clientY}
        closeLabel="Close gate menu"
        onClose={onClose}
        actions={[
          {
            id: "unlock-land",
            label: `Unlock ${menu.edge} land`,
            costs: [{ resource: "gold", amount: EDGE_GATE_COST }],
            canAfford,
            preview: (
              <BuildIconPreview cameraPosition={[1.8, 1.4, 1.8]}>
                <EdgeGateModel
                  edge={menu.edge}
                  position={[0, -0.15, 0]}
                />
              </BuildIconPreview>
            ),
            onSelect: () => onUnlock(menu.edge),
          },
        ]}
      />
    );
  },
);
