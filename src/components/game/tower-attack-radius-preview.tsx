"use client";

import { useMemo } from "react";
import { RingGeometry } from "three";

import { globalTileWorldPosition } from "@/lib/global-grid";
import { getAttackRangeWorldFromTiles } from "@/lib/tower-types";

const PREVIEW_Y = 0.008;

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
  const radius = getAttackRangeWorldFromTiles(attackRangeTiles);

  const ringGeometry = useMemo(
    () => new RingGeometry(radius * 0.92, radius, 64),
    [radius],
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[x, PREVIEW_Y, z]}
      geometry={ringGeometry}
    >
      <meshStandardMaterial
        color="#f87171"
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </mesh>
  );
}
