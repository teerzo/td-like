"use client";

import {
  Apple,
  BrickWall,
  Coins,
  Pickaxe,
  TreePine,
  type LucideIcon,
} from "lucide-react";

export type ResourceId = "gold" | "iron" | "wood" | "stone" | "food";

const RESOURCE_META: Record<
  ResourceId,
  { label: string; Icon: LucideIcon; iconClass: string }
> = {
  gold: {
    label: "Gold",
    Icon: Coins,
    iconClass: "text-amber-300",
  },
  iron: {
    label: "Iron",
    Icon: Pickaxe,
    iconClass: "text-slate-300",
  },
  wood: {
    label: "Wood",
    Icon: TreePine,
    iconClass: "text-lime-400",
  },
  stone: {
    label: "Stone",
    Icon: BrickWall,
    iconClass: "text-stone-300",
  },
  food: {
    label: "Food",
    Icon: Apple,
    iconClass: "text-orange-300",
  },
};

export function getResourceLabel(id: ResourceId) {
  return RESOURCE_META[id].label;
}

type ResourceIconProps = {
  resource: ResourceId;
  className?: string;
  size?: number;
};

export function ResourceIcon({
  resource,
  className = "",
  size = 14,
}: ResourceIconProps) {
  const { Icon, iconClass, label } = RESOURCE_META[resource];
  return (
    <Icon
      aria-label={label}
      className={`shrink-0 ${iconClass} ${className}`}
      size={size}
      strokeWidth={2.25}
    />
  );
}

export type ResourceAmountProps = {
  resource: ResourceId;
  amount: number;
  /** When true, shows `+xN` (refunds / rewards). */
  gain?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Icon + amount as `x50` (or `+x50` for gains). */
export function ResourceAmount({
  resource,
  amount,
  gain = false,
  size = "sm",
  className = "",
}: ResourceAmountProps) {
  const iconSize = size === "md" ? 16 : 12;
  const textClass =
    size === "md" ? "text-sm font-semibold" : "text-[10px] font-semibold";
  const label = getResourceLabel(resource);
  const amountText = gain ? `+x${amount}` : `x${amount}`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-white tabular-nums ${textClass} ${className}`}
      title={`${gain ? "+" : ""}${amount} ${label}`}
      aria-label={`${gain ? "+" : ""}${amount} ${label}`}
    >
      <ResourceIcon resource={resource} size={iconSize} />
      <span>{amountText}</span>
    </span>
  );
}

export type ResourceCostLine = {
  resource: ResourceId;
  amount: number;
  gain?: boolean;
};

/** Row of resource amounts for menus / badges. */
export function ResourceCostRow({
  costs,
  className = "",
  size = "sm",
}: {
  costs: ResourceCostLine[];
  className?: string;
  size?: "sm" | "md";
}) {
  if (costs.length === 0) {
    return null;
  }

  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-1 ${className}`}>
      {costs.map((cost) => (
        <ResourceAmount
          key={`${cost.resource}-${cost.gain ? "g" : "s"}`}
          resource={cost.resource}
          amount={cost.amount}
          gain={cost.gain}
          size={size}
        />
      ))}
    </span>
  );
}
