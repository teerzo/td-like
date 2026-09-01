"use client";

import { Billboard } from "@react-three/drei";

const BAR_WIDTH = 0.55;
const BAR_HEIGHT = 0.07;

type EnemyHealthBarProps = {
  hp: number;
  maxHp: number;
  /** Local Y above the enemy's feet. */
  y?: number;
};

function fillColor(ratio: number): string {
  if (ratio > 0.55) {
    return "#4ade80";
  }
  if (ratio > 0.25) {
    return "#fbbf24";
  }
  return "#f87171";
}

/** Camera-facing HP strip above an enemy. */
export function EnemyHealthBar({
  hp,
  maxHp,
  y = 1.05,
}: EnemyHealthBarProps) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const fillWidth = BAR_WIDTH * ratio;

  return (
    <Billboard position={[0, y, 0]} follow lockX={false} lockZ={false}>
      <group raycast={() => null}>
        <mesh position={[0, 0, 0]} renderOrder={10}>
          <planeGeometry args={[BAR_WIDTH + 0.04, BAR_HEIGHT + 0.04]} />
          <meshBasicMaterial color="#111827" depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0.001]} renderOrder={11}>
          <planeGeometry args={[BAR_WIDTH, BAR_HEIGHT]} />
          <meshBasicMaterial color="#374151" depthWrite={false} />
        </mesh>
        {fillWidth > 0.001 ? (
          <mesh
            position={[-(BAR_WIDTH - fillWidth) / 2, 0, 0.002]}
            renderOrder={12}
          >
            <planeGeometry args={[fillWidth, BAR_HEIGHT]} />
            <meshBasicMaterial
              color={fillColor(ratio)}
              depthWrite={false}
            />
          </mesh>
        ) : null}
      </group>
    </Billboard>
  );
}
