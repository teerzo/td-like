"use client";

import { getRelicDef, type RelicId } from "@/lib/run-relics";

type WaveRelicModalProps = {
  offer: readonly RelicId[];
  onPick: (relicId: RelicId) => void;
};

export function WaveRelicModal({ offer, onPick }: WaveRelicModalProps) {
  return (
    <>
      <div
        className="pointer-events-auto absolute inset-0 z-40 bg-black/50"
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-50 w-[min(94vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#152033]/97 to-[#0e121a]/97 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wave-relic-title"
      >
        <h2
          id="wave-relic-title"
          className="text-lg font-semibold tracking-wide text-amber-100"
        >
          Choose a relic
        </h2>
        <p className="mt-1 text-sm text-amber-200/70">
          Lasts until this run ends. Pick one.
        </p>
        <div
          className="mt-4 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(offer.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {offer.map((relicId) => {
            const def = getRelicDef(relicId);

            return (
              <button
                key={relicId}
                type="button"
                className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-3 text-left transition hover:border-amber-200/70 hover:bg-amber-500/20"
                onClick={() => onPick(relicId)}
              >
                <div className="text-base font-semibold text-amber-50">
                  {def.title}
                </div>
                <p className="mt-1.5 text-sm leading-snug text-amber-100/75">
                  {def.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
