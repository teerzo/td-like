"use client";

type IronHudProps = {
  iron: number;
};

export function IronHud({ iron }: IronHudProps) {
  return (
    <div
      className="pointer-events-none absolute right-6 bottom-24 z-10 flex items-center gap-3 rounded-2xl border border-slate-400/50 bg-gradient-to-br from-[#1c222c]/95 to-[#12151c]/95 px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-live="polite"
      aria-label={`${iron} iron`}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-300 to-slate-600 text-lg font-bold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_rgba(0,0,0,0.35)] ring-2 ring-slate-200/35"
        aria-hidden
      >
        Fe
      </span>
      <div className="flex min-w-16 flex-col leading-none">
        <span className="text-[10px] font-medium tracking-wide text-slate-300/70 uppercase">
          Iron
        </span>
        <span className="mt-1 text-xl font-semibold tabular-nums text-slate-100">
          {iron}
        </span>
      </div>
    </div>
  );
}
