"use client";

import { globalTileWorldPosition } from "@/lib/global-grid";
import { getAttackRangeWorldFromTiles } from "@/lib/tower-types";

const OUTLINE_PREVIEW_Y = 0.014;
const OUTLINE_WIDTH = 0.04;

type TowerAttackRadiusPreviewProps = {
  gx: number;
  gz: number;
  attackRangeTiles: number;
};

export function TowerAttackRadiusPreview({
  gx,
  gz,
  attackRangeTiles,
}: TowerAttackRadiusPreviewProps) {
  const { x, z } = globalTileWorldPosition(gx, gz);
  const rangeWorld = getAttackRangeWorldFromTiles(attackRangeTiles);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[x, OUTLINE_PREVIEW_Y, z]}
      renderOrder={2}
    >
      <ringGeometry
        args={[
          Math.max(0, rangeWorld - OUTLINE_WIDTH / 2),
          rangeWorld + OUTLINE_WIDTH / 2,
          72,
        ]}
      />
      <meshBasicMaterial
        color="#ef4444"
        transparent
        opacity={0.92}
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
}
