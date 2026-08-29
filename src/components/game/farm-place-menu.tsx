"use client";

import { Button } from "@/components/ui/button";
import { FARM_COST } from "@/lib/fertile-farm";

export type FarmPlaceMenuState = {
  gx: number;
  gz: number;
  clientX: number;
  clientY: number;
};

type FarmPlaceMenuProps = {
  menu: FarmPlaceMenuState;
  gold: number;
  onBuild: () => void;
  onClose: () => void;
};

export function FarmPlaceMenu({
  menu,
  gold,
  onBuild,
  onClose,
}: FarmPlaceMenuProps) {
  const canAfford = gold >= FARM_COST;

  return (
    <>
      <button
        type="button"
        aria-label="Close farm menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        className="pointer-events-auto absolute z-30 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-amber-400/45 bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ left: menu.clientX, top: menu.clientY - 12 }}
        role="dialog"
        aria-label="Build farm"
      >
        <p className="font-heading text-base font-semibold text-amber-100">
          Fertile Dirt
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
          Build a farm with a windmill to grow food.
        </p>
        <Button
          className="mt-3 w-full"
          disabled={!canAfford}
          onClick={onBuild}
        >
          Build Farm — {FARM_COST}G
        </Button>
        {!canAfford ? (
          <p className="mt-2 text-center text-[11px] text-amber-200/55">
            Need {FARM_COST - gold} more gold
          </p>
        ) : null}
      </div>
    </>
  );
}
