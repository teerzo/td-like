"use client";

import { Button } from "@/components/ui/button";
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

export function EdgeGateMenu({
  menu,
  gold,
  onUnlock,
  onClose,
}: EdgeGateMenuProps) {
  const canAfford = gold >= EDGE_GATE_COST;

  return (
    <>
      <button
        type="button"
        aria-label="Close gate menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        className="pointer-events-auto absolute z-30 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-amber-400/45 bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ left: menu.clientX, top: menu.clientY - 12 }}
        role="dialog"
        aria-label="Unlock edge gate"
      >
        <p className="font-heading text-base font-semibold text-amber-100">
          Locked Gate
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
          Open build land on the {menu.edge} edge for houses and farms.
        </p>
        <Button
          className="mt-3 w-full"
          disabled={!canAfford}
          onClick={() => onUnlock(menu.edge)}
        >
          Unlock Land — {EDGE_GATE_COST}G
        </Button>
        {!canAfford ? (
          <p className="mt-2 text-center text-[11px] text-amber-200/55">
            Need {EDGE_GATE_COST - gold} more gold
          </p>
        ) : null}
      </div>
    </>
  );
}
