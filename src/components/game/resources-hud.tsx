"use client";

import {
  ResourceAmount,
  type ResourceId,
} from "@/components/game/resource-icon";

type ResourcesHudProps = {
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
};

const HUD_STYLE: Record<
  ResourceId,
  { border: string; panel: string }
> = {
  gold: {
    border: "border-amber-400/50",
    panel: "bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95",
  },
  iron: {
    border: "border-slate-400/50",
    panel: "bg-gradient-to-br from-[#1c222c]/95 to-[#12151c]/95",
  },
  wood: {
    border: "border-lime-700/45",
    panel: "bg-gradient-to-br from-[#1f2a18]/95 to-[#12151c]/95",
  },
  stone: {
    border: "border-stone-400/45",
    panel: "bg-gradient-to-br from-[#2a2622]/95 to-[#12151c]/95",
  },
  food: {
    border: "border-orange-400/45",
    panel: "bg-gradient-to-br from-[#2a1c12]/95 to-[#12151c]/95",
  },
};

export function ResourcesHud({
  gold,
  iron,
  wood,
  stone,
  food,
}: ResourcesHudProps) {
  const entries: { id: ResourceId; value: number }[] = [
    { id: "gold", value: gold },
    { id: "iron", value: iron },
    { id: "wood", value: wood },
    { id: "stone", value: stone },
    { id: "food", value: food },
  ];

  return (
    <div
      className="pointer-events-none absolute right-6 bottom-6 z-10 flex flex-wrap items-end justify-end gap-2"
      aria-live="polite"
    >
      {entries.map((entry) => {
        const style = HUD_STYLE[entry.id];
        return (
          <div
            key={entry.id}
            className={`flex items-center rounded-2xl border px-3 py-2 ${style.border} ${style.panel}`}
          >
            <ResourceAmount
              resource={entry.id}
              amount={entry.value}
              size="md"
              className="text-white"
            />
          </div>
        );
      })}
    </div>
  );
}
