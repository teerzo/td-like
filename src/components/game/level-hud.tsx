"use client";

type LevelHudProps = {
  level: number;
};

export function LevelHud({ level }: LevelHudProps) {
  return (
    <div
      className="pointer-events-none absolute bottom-6 left-6 z-10 flex items-center gap-3 rounded-2xl border border-sky-400/45 bg-gradient-to-br from-[#102030]/95 to-[#12151c]/95 px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-live="polite"
      aria-label={`Level ${level}`}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-sky-300 to-sky-600 text-sm font-bold text-sky-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_rgba(0,0,0,0.35)] ring-2 ring-sky-200/35"
        aria-hidden
      >
        Lv
      </span>
      <div className="flex min-w-16 flex-col leading-none">
        <span className="text-[10px] font-medium tracking-wide text-sky-200/70 uppercase">
          Level
        </span>
        <span className="mt-1 text-xl font-semibold tabular-nums text-sky-100">
          {level}
        </span>
      </div>
    </div>
  );
}
