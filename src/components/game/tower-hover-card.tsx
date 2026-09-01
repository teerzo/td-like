import type { ReactNode } from "react";

import { MenuHoverCard } from "@/components/game/build-action-menu";
import {
  formatTowerTargetCategory,
  formatTowerTargetPriority,
  type TowerStats,
} from "@/lib/tower-types";

type TowerMenuHoverDetailsProps = {
  name: string;
  targetMovement: TowerStats["targetMovement"];
  targetPriority?: TowerStats["targetPriority"];
  subtitle?: string;
  children?: ReactNode;
};

export function TowerMenuHoverDetails({
  name,
  targetMovement,
  targetPriority,
  subtitle,
  children,
}: TowerMenuHoverDetailsProps) {
  return (
    <MenuHoverCard>
      <p className="text-sm font-semibold text-white">{name}</p>
      <p className="mt-1 text-sky-200">
        Hits:{" "}
        <span className="font-semibold text-sky-100">
          {formatTowerTargetCategory(targetMovement)}
        </span>
      </p>
      {targetPriority ? (
        <p className="mt-1 text-violet-200">
          {formatTowerTargetPriority(targetPriority)}
        </p>
      ) : null}
      {subtitle ? <p className="mt-1 text-white/65">{subtitle}</p> : null}
      {children}
    </MenuHoverCard>
  );
}
