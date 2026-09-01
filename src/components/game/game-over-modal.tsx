"use client";

import { LeakedEnemiesPanel } from "@/components/game/wave-clear-modal";
import { ResourceAmount } from "@/components/game/resource-icon";
import { getEnemyStats, type EnemyTypeId } from "@/lib/enemy-types";
import { totalKills, type GameRunStats } from "@/lib/game-stats";

export type GameOverModalState = GameRunStats;

type GameOverModalProps = {
  stats: GameOverModalState;
  onPlayAgain: () => void;
};

export function GameOverModal({ stats, onPlayAgain }: GameOverModalProps) {
  const killLines = Object.entries(stats.kills)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([typeId, count]) => {
      const label = getEnemyStats(typeId as EnemyTypeId).label;
      return `${label} ×${count}`;
    });

  const killsTotal = totalKills(stats.kills);

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-0 z-50 bg-black/60"
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute top-1/2 left-1/2 z-[60] w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rose-400/40 bg-gradient-to-br from-[#281018]/97 to-[#12151c]/97 px-5 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <h2
          id="game-over-title"
          className="text-xl font-semibold tracking-wide text-rose-100"
        >
          Game over
        </h2>
        <p className="mt-1 text-sm text-rose-200/70">
          Your castle has fallen.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
              Waves cleared
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-white">
              {stats.wavesCleared}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
              Wave reached
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-white">
              {stats.waveReached}
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
              Enemies slain
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-white">
              {killsTotal}
            </div>
            {killLines.length > 0 ? (
              <p className="mt-1 text-xs text-white/55">{killLines.join(" · ")}</p>
            ) : null}
          </div>
          <div className="col-span-2">
            <LeakedEnemiesPanel leaks={stats.leaks} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
            Resources earned
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <ResourceAmount resource="gold" amount={stats.goldEarned} size="md" />
            <ResourceAmount resource="iron" amount={stats.ironEarned} size="md" />
            <ResourceAmount resource="wood" amount={stats.woodEarned} size="md" />
            <ResourceAmount resource="stone" amount={stats.stoneEarned} size="md" />
            <ResourceAmount resource="food" amount={stats.foodEarned} size="md" />
          </div>
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-rose-300/50 bg-rose-500/25 px-3 py-2.5 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/40"
          onClick={onPlayAgain}
        >
          Play again
        </button>
      </div>
    </>
  );
}
