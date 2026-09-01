"use client";

import { forwardRef } from "react";

import {
  BuildActionMenu,
  BuildIconPreview,
} from "@/components/game/build-action-menu";
import { FishingHutModel } from "@/components/game/models";
import {
  canAffordFishingHut,
  FISHING_HUT_COST,
} from "@/lib/fishing-hut";

export type FishingHutPlaceMenuState = {
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type FishingHutPlaceMenuProps = {
  menu: FishingHutPlaceMenuState;
  gold: number;
  wood: number;
  onBuild: () => void;
  onClose: () => void;
};

export const FishingHutPlaceMenu = forwardRef<
  HTMLDivElement,
  FishingHutPlaceMenuProps
>(function FishingHutPlaceMenu({ menu, gold, wood, onBuild, onClose }, ref) {
  const canAfford = canAffordFishingHut({ gold, wood });

  return (
    <BuildActionMenu
      ref={ref}
      clientX={menu.clientX}
      clientY={menu.clientY}
      closeLabel="Close fishing hut menu"
      onClose={onClose}
      actions={[
        {
          id: "fishing-hut",
          label: "Build Fishing Hut",
          costs: [
            { resource: "gold", amount: FISHING_HUT_COST.gold },
            { resource: "wood", amount: FISHING_HUT_COST.wood },
          ],
          canAfford,
          preview: (
            <BuildIconPreview cameraPosition={[1.55, 1.35, 1.55]}>
              <FishingHutModel position={[0, -0.08, 0]} scale={0.95} />
            </BuildIconPreview>
          ),
          onSelect: onBuild,
        },
      ]}
    />
  );
});
