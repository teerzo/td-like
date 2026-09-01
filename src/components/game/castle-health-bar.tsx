"use client";

import { EnemyHealthBar } from "@/components/game/enemy-health-bar";

type CastleHealthBarProps = {
  hp: number;
  maxHp: number;
};

/** Camera-facing HP strip above the player castle. */
export function CastleHealthBar({ hp, maxHp }: CastleHealthBarProps) {
  return (
    <group position={[0, 3.4, 0]} scale={[2.2, 2.2, 2.2]}>
      <EnemyHealthBar hp={hp} maxHp={maxHp} y={0} />
    </group>
  );
}
