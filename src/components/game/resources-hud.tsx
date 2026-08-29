"use client";

type ResourceEntry = {
  id: string;
  label: string;
  value: number;
  abbr: string;
  border: string;
  panel: string;
  badge: string;
  badgeText: string;
  ring: string;
  labelColor: string;
  valueColor: string;
};

type ResourcesHudProps = {
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
};

function ResourceChip({ entry }: { entry: ResourceEntry }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 ${entry.border} ${entry.panel}`}
      aria-label={`${entry.value} ${entry.label.toLowerCase()}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_rgba(0,0,0,0.35)] ring-2 ${entry.badge} ${entry.badgeText} ${entry.ring}`}
        aria-hidden
      >
        {entry.abbr}
      </span>
      <div className="flex min-w-12 flex-col leading-none">
        <span
          className={`text-[10px] font-medium tracking-wide uppercase ${entry.labelColor}`}
        >
          {entry.label}
        </span>
        <span
          className={`mt-1 text-lg font-semibold tabular-nums ${entry.valueColor}`}
        >
          {entry.value}
        </span>
      </div>
    </div>
  );
}

export function ResourcesHud({
  gold,
  iron,
  wood,
  stone,
  food,
}: ResourcesHudProps) {
  const entries: ResourceEntry[] = [
    {
      id: "gold",
      label: "Gold",
      value: gold,
      abbr: "G",
      border: "border-amber-400/50",
      panel: "bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95",
      badge: "bg-gradient-to-b from-amber-300 to-amber-600",
      badgeText: "text-amber-950",
      ring: "ring-amber-200/40",
      labelColor: "text-amber-200/70",
      valueColor: "text-amber-100",
    },
    {
      id: "iron",
      label: "Iron",
      value: iron,
      abbr: "Fe",
      border: "border-slate-400/50",
      panel: "bg-gradient-to-br from-[#1c222c]/95 to-[#12151c]/95",
      badge: "bg-gradient-to-b from-slate-300 to-slate-600",
      badgeText: "text-slate-950",
      ring: "ring-slate-200/35",
      labelColor: "text-slate-300/70",
      valueColor: "text-slate-100",
    },
    {
      id: "wood",
      label: "Wood",
      value: wood,
      abbr: "W",
      border: "border-lime-700/45",
      panel: "bg-gradient-to-br from-[#1f2a18]/95 to-[#12151c]/95",
      badge: "bg-gradient-to-b from-lime-600 to-lime-900",
      badgeText: "text-lime-50",
      ring: "ring-lime-300/30",
      labelColor: "text-lime-200/65",
      valueColor: "text-lime-100",
    },
    {
      id: "stone",
      label: "Stone",
      value: stone,
      abbr: "S",
      border: "border-stone-400/45",
      panel: "bg-gradient-to-br from-[#2a2622]/95 to-[#12151c]/95",
      badge: "bg-gradient-to-b from-stone-300 to-stone-600",
      badgeText: "text-stone-950",
      ring: "ring-stone-200/35",
      labelColor: "text-stone-300/70",
      valueColor: "text-stone-100",
    },
    {
      id: "food",
      label: "Food",
      value: food,
      abbr: "F",
      border: "border-orange-400/45",
      panel: "bg-gradient-to-br from-[#2a1c12]/95 to-[#12151c]/95",
      badge: "bg-gradient-to-b from-orange-300 to-orange-700",
      badgeText: "text-orange-950",
      ring: "ring-orange-200/35",
      labelColor: "text-orange-200/70",
      valueColor: "text-orange-100",
    },
  ];

  return (
    <div
      className="pointer-events-none absolute right-6 bottom-6 z-10 flex flex-wrap items-end justify-end gap-2"
      aria-live="polite"
    >
      {entries.map((entry) => (
        <ResourceChip key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
