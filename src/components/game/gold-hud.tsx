"use client";

type GoldHudProps = {
  gold: number;
};

export function GoldHud({ gold }: GoldHudProps) {
  return (
    <div
      className="pointer-events-none absolute right-6 bottom-6 z-10 flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-[#2a2110]/95 to-[#12151c]/95 px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-live="polite"
      aria-label={`${gold} gold`}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-600 text-lg font-bold text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_rgba(0,0,0,0.35)] ring-2 ring-amber-200/40"
        aria-hidden
      >
        G
      </span>
      <div className="flex min-w-16 flex-col leading-none">
        <span className="text-[10px] font-medium tracking-wide text-amber-200/70 uppercase">
          Gold
        </span>
        <span className="mt-1 text-xl font-semibold tabular-nums text-amber-100">
          {gold}
        </span>
      </div>
    </div>
  );
}
