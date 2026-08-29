"use client";

import { useMemo } from "react";

import { globalTileWorldPosition } from "@/lib/global-grid";
import { TILE_SIZE } from "@/lib/terrain";
import { getAttackRangeWorldFromTiles } from "@/lib/tower-types";

const PREVIEW_Y = 0.012;

type TowerAttackRadiusPreviewProps = {
  gx: number;
  gz: number;
  attackRangeTiles: number;
};

type ReachableTile = {
  key: string;
  x: number;
  z: number;
};

export function TowerAttackRadiusPreview({
  gx,
  gz,
  attackRangeTiles,
}: TowerAttackRadiusPreviewProps) {
  const tiles = useMemo(() => {
    const { x: towerX, z: towerZ } = globalTileWorldPosition(gx, gz);
    const rangeWorld = getAttackRangeWorldFromTiles(attackRangeTiles);
    const maxOffset = Math.ceil(attackRangeTiles) + 1;
    const reachable: ReachableTile[] = [];

    for (let dx = -maxOffset; dx <= maxOffset; dx += 1) {
      for (let dz = -maxOffset; dz <= maxOffset; dz += 1) {
        const tileGx = gx + dx;
        const tileGz = gz + dz;
        const { x, z } = globalTileWorldPosition(tileGx, tileGz);
        if (Math.hypot(x - towerX, z - towerZ) <= rangeWorld + 1e-6) {
          reachable.push({ key: `${tileGx}:${tileGz}`, x, z });
        }
      }
    }

    return reachable;
  }, [gx, gz, attackRangeTiles]);

  return (
    <group>
      {tiles.map((tile) => (
        <mesh
          key={tile.key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[tile.x, PREVIEW_Y, tile.z]}
        >
          <planeGeometry args={[TILE_SIZE * 0.96, TILE_SIZE * 0.96]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
