import type { DamageType } from "@/lib/damage-types";
import type { EnemyRole } from "@/lib/enemy-types";
import type { TowerRole } from "@/lib/tower-types";

/** Double damage when a tower's role counters an enemy role. */
export const COUNTER_DAMAGE_MULTIPLIER = 2;

/** Enemy roles each starter tower is designed to counter. */
export const TOWER_COUNTERS: Record<TowerRole, readonly EnemyRole[]> = {
  bruiser: ["armored", "siege"],
  marksman: ["flying", "skirmisher"],
  arcanist: ["swarm"],
};

export const ENEMY_ROLE_LABELS: Record<EnemyRole, string> = {
  swarm: "swarms",
  skirmisher: "skirmishers",
  armored: "armored units",
  siege: "siege",
  flying: "flyers",
};

export function formatTowerCounterHint(role: TowerRole): string {
  const targets = TOWER_COUNTERS[role].map((entry) => ENEMY_ROLE_LABELS[entry]);
  return `Strong vs ${targets.join(" & ")}`;
}

export function isCounterMatch(
  towerRole: TowerRole,
  enemyRoles: readonly EnemyRole[],
): boolean {
  const counters = TOWER_COUNTERS[towerRole];
  return enemyRoles.some((role) => counters.includes(role));
}

type DamageTarget = {
  armor: number;
  immunities: DamageType[];
  roles: readonly EnemyRole[];
};

/** Tower damage after immunities, armor, and role counters. */
export function computeTowerDamage(
  enemy: DamageTarget,
  baseDamage: number,
  damageType: DamageType,
  towerRole: TowerRole,
  armorPierce = 0,
): number {
  if (enemy.immunities.includes(damageType)) {
    return 0;
  }

  const countered = isCounterMatch(towerRole, enemy.roles);
  const damage = countered
    ? baseDamage * COUNTER_DAMAGE_MULTIPLIER
    : baseDamage;

  if (towerRole === "bruiser" && enemy.roles.includes("armored")) {
    return damage;
  }

  const armor = Math.max(0, enemy.armor - Math.max(0, armorPierce));
  return Math.max(0, damage - armor);
}
