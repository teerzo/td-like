"use client";

import { Layers } from "lucide-react";

type LevelHudProps = {
  level: number;
};

export function LevelHud({ level }: LevelHudProps) {
  return (
    <div
      className="flex shrink-0 items-center rounded-xl border border-sky-400/45 bg-gradient-to-br from-[#102030]/95 to-[#12151c]/95 px-2 py-1.5"
      aria-live="polite"
      aria-label={`Level ${level}`}
    >
      <span
        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white tabular-nums"
        title={`Level ${level}`}
      >
        <Layers
          aria-hidden
          className="shrink-0 fill-sky-300 text-sky-300"
          size={12}
          strokeWidth={1.75}
        />
        <span>x{level}</span>
      </span>
    </div>
  );
}
