"use client";

import { Button } from "@/components/ui/button";

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
  yieldLabel: string;
  onClear: () => void;
  onClose: () => void;
};

const COPY: Record<
  ObstacleClearKind,
  { title: string; action: string; description: string }
> = {
  tree: {
    title: "Tree",
    action: "Cut Down",
    description: "Clear this tree so the grass can be built on.",
  },
  rock: {
    title: "Rocks",
    action: "Clear Rocks",
    description: "Remove these rocks so the grass can be built on.",
  },
};

export function ObstacleClearMenu({
  menu,
  gold,
  cost,
  yieldLabel,
  onClear,
  onClose,
}: ObstacleClearMenuProps) {
  const copy = COPY[menu.kind];
  const canAfford = gold >= cost;

  return (
    <>
      <button
        type="button"
        aria-label="Close clear menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        className="pointer-events-auto absolute z-30 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-amber-400/45 bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ left: menu.clientX, top: menu.clientY - 12 }}
        role="dialog"
        aria-label={`${copy.action} ${copy.title.toLowerCase()}`}
      >
        <p className="font-heading text-base font-semibold text-amber-100">
          {copy.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
          {copy.description} Yields {yieldLabel}.
        </p>
        <Button
          className="mt-3 w-full"
          disabled={!canAfford}
          onClick={onClear}
        >
          {copy.action} — {cost}G
        </Button>
        {!canAfford ? (
          <p className="mt-2 text-center text-[11px] text-amber-200/55">
            Need {cost - gold} more gold
          </p>
        ) : null}
      </div>
    </>
  );
}
