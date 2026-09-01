import type { EnemyTypeId } from "@/lib/enemy-types";

export const CASTLE_MAX_HEALTH = 10;

/** HP lost when an enemy reaches the castle. */
export const CASTLE_LEAK_DAMAGE: Partial<Record<EnemyTypeId, number>> = {
  peon: 1,
  archer: 1,
  knight: 2,
  catapult: 2,
  dragon: 3,
};

export function getCastleLeakDamage(typeId: EnemyTypeId): number {
  return CASTLE_LEAK_DAMAGE[typeId] ?? 1;
}
