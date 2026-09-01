import { Heart, Shield } from "lucide-react";
import type { ReactNode } from "react";

import { getCastleLeakDamage } from "@/lib/castle";
import { getEnemyStats, type EnemyTypeId } from "@/lib/enemy-types";
import type { TowerStats } from "@/lib/tower-types";

function StatCell({
  label,
  icon,
  value,
  compact = false,
}: {
  label?: string;
  icon?: ReactNode;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-md bg-white/5 text-center ${compact ? "px-1 py-0.5" : "px-2 py-1"}`}
    >
      <div
        className={`flex items-center justify-center ${
          compact ? "h-3" : "h-3.5"
        }`}
      >
        {icon ?? (
          <span
            className={`font-medium tracking-wide text-white/45 uppercase ${
              compact ? "text-[8px]" : "text-[10px]"
            }`}
          >
            {label}
          </span>
        )}
      </div>
      <div
        className={`font-semibold text-white tabular-nums ${
          compact ? "text-[10px]" : "mt-0.5 text-sm"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

const HP_ICON_CLASS = "fill-rose-400 text-rose-400";
const ARMOR_ICON_CLASS = "fill-sky-300 text-sky-300";

function HpIcon({ compact = false }: { compact?: boolean }) {
  return (
    <Heart
      aria-hidden
      className={HP_ICON_CLASS}
      size={compact ? 10 : 12}
      strokeWidth={1.75}
    />
  );
}

function ArmorIcon({ compact = false }: { compact?: boolean }) {
  return (
    <Shield
      aria-hidden
      className={ARMOR_ICON_CLASS}
      size={compact ? 10 : 12}
      strokeWidth={1.75}
    />
  );
}

export function TowerCombatStats({ stats }: { stats: TowerStats }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      <StatCell icon={<HpIcon />} value="—" />
      <StatCell icon={<ArmorIcon />} value="—" />
      <StatCell label="Damage" value={stats.damage} />
    </div>
  );
}

export function EnemyCombatStats({
  typeId,
  compact = false,
  showDamage = true,
}: {
  typeId: EnemyTypeId;
  compact?: boolean;
  showDamage?: boolean;
}) {
  const stats = getEnemyStats(typeId);
  const leakDamage = getCastleLeakDamage(typeId);

  return (
    <div
      className={
        compact
          ? `grid w-full gap-0.5 ${showDamage ? "grid-cols-3" : "grid-cols-2"}`
          : `mt-2 gap-1.5 ${showDamage ? "grid-cols-3" : "grid-cols-2"}`
      }
    >
      <StatCell icon={<HpIcon compact={compact} />} value={stats.health} compact={compact} />
      <StatCell icon={<ArmorIcon compact={compact} />} value={stats.armor} compact={compact} />
      {showDamage ? (
        <StatCell label="Damage" value={leakDamage} compact={compact} />
      ) : null}
    </div>
  );
}
