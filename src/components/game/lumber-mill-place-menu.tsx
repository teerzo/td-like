"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { LumberMillModel } from "@/components/game/models";
import {
  canAffordLumberMill,
  LUMBER_MILL_COST,
} from "@/lib/lumber-mill";

export type LumberMillPlaceMenuState = {
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type LumberMillPlaceMenuProps = {
  menu: LumberMillPlaceMenuState;
  gold: number;
  onBuild: () => void;
  onClose: () => void;
};

export const LumberMillPlaceMenu = forwardRef<
  HTMLDivElement,
  LumberMillPlaceMenuProps
>(function LumberMillPlaceMenu({ menu, gold, onBuild, onClose }, ref) {
  const canAfford = canAffordLumberMill({ gold });

  return (
    <BuildActionMenu
      ref={ref}
      clientX={menu.clientX}
      clientY={menu.clientY}
      closeLabel="Close lumber mill menu"
      onClose={onClose}
      actions={[
        {
          id: "lumber-mill",
          label: "Build Lumber Mill",
          costs: [{ resource: "gold", amount: LUMBER_MILL_COST }],
          canAfford,
          preview: (
            <BuildIconPreview cameraPosition={[1.6, 1.45, 1.6]}>
              <LumberMillModel position={[0, -0.12, 0]} scale={0.9} />
            </BuildIconPreview>
          ),
          onSelect: onBuild,
        },
      ]}
    />
  );
});
