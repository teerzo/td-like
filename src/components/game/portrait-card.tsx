"use client";

import type { ReactNode } from "react";

import {
  ResourceIcon,
  type ResourceCostLine,
  type ResourceId,
} from "@/components/game/resource-icon";

export const PORTRAIT_CARD_WIDTH = 136;
export const TOWER_POPUP_CARD_WIDTH = 88;

export const RESOURCE_CELL_STYLE: Record<ResourceId, string> = {
  gold: "bg-amber-500/10 text-amber-300",
  iron: "bg-slate-500/10 text-slate-300",
  wood: "bg-lime-500/10 text-lime-400",
  stone: "bg-stone-500/10 text-stone-300",
  food: "bg-orange-500/10 text-orange-300",
};

export function PortraitStatCell({
  className,
  compact = false,
  children,
}: {
  className?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-1 items-center justify-center gap-0.5 font-bold tabular-nums ${
        compact ? "px-0.5 py-0.5 text-[10px] leading-none" : "py-1.5 text-xs"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function PlaceholderCost({ compact = false }: { compact?: boolean }) {
  return (
    <span className="invisible inline-flex items-center gap-0.5" aria-hidden>
      <ResourceIcon resource="gold" size={compact ? 9 : 11} />
      0
    </span>
  );
}

export function PortraitCostRow({
  costs,
  compact = false,
}: {
  costs: ReadonlyArray<ResourceCostLine | null | undefined>;
  compact?: boolean;
}) {
  const cells = [costs[0] ?? null, costs[1] ?? null, costs[2] ?? null];
  const iconSize = compact ? 9 : 11;

  return (
    <div className="flex border-t border-white/10">
      {cells.map((cost, index) => (
        <PortraitStatCell
          key={`${cost?.resource ?? "empty"}-${index}`}
          compact={compact}
          className={`${index < cells.length - 1 ? "border-r border-white/10" : ""} ${
            cost ? RESOURCE_CELL_STYLE[cost.resource] : "bg-white/5"
          }`}
        >
          {cost ? (
            <>
              <ResourceIcon resource={cost.resource} size={iconSize} />
              {cost.gain ? "+" : ""}
              {cost.amount}
            </>
          ) : (
            <PlaceholderCost compact={compact} />
          )}
        </PortraitStatCell>
      ))}
    </div>
  );
}

type PortraitCardProps = {
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onSelect?: () => void;
  role?: "menuitem";
  compact?: boolean;
};

export function PortraitCard({
  disabled = false,
  title,
  ariaLabel,
  header,
  footer,
  children,
  onSelect,
  role,
  compact = false,
}: PortraitCardProps) {
  const ready = !disabled;

  return (
    <div
      className={`group/card flex w-full flex-col overflow-hidden bg-gradient-to-b from-[#1a2332]/95 to-[#0e121a]/95 shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition duration-150 ${
        compact ? "rounded-lg" : "rounded-xl"
      } ${
        compact && ready
          ? "border-2 border-amber-300/85 shadow-[0_0_14px_rgba(251,191,36,0.4)] hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_0_22px_rgba(251,191,36,0.6)]"
          : compact && disabled
            ? "border border-white/15 hover:-translate-y-0.5 hover:border-sky-300/55 hover:shadow-[0_0_12px_rgba(125,211,252,0.28)]"
            : "border border-white/15"
      }`}
    >
      {header}
      <button
        type="button"
        role={role}
        aria-disabled={disabled || undefined}
        title={title}
        aria-label={ariaLabel}
        className={`relative aspect-[4/5] w-full transition ${
          disabled
            ? compact
              ? "cursor-default"
              : "cursor-not-allowed opacity-40"
            : "cursor-pointer"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) {
            return;
          }
          onSelect?.();
        }}
      >
        <div
          className={`absolute inset-0 overflow-hidden bg-[#121820] transition ${
            compact && disabled
              ? "opacity-50 group-hover/card:opacity-95"
              : "group-hover/card:bg-[#182030]"
          }`}
        >
          {children}
        </div>
        <div
          className={`pointer-events-none absolute inset-0 ring-1 ring-inset transition ${
            compact && ready
              ? "ring-amber-300/25 group-hover/card:ring-amber-200/70"
              : compact && disabled
                ? "ring-white/5 group-hover/card:ring-sky-300/45"
                : "ring-white/5 group-hover/card:ring-amber-400/30"
          }`}
        />
      </button>
      {footer}
    </div>
  );
}
