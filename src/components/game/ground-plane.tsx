"use client";

import { useMemo } from "react";
import * as THREE from "three";

import { DebugHitbox } from "@/components/game/debug-hitbox";
import {
  type ChunkOrigin,
  globalCoordKey,
  globalTileWorldPosition,
  type GlobalGridCoord,
} from "@/lib/global-grid";
import { useGrassSpriteMaps } from "@/lib/pixel-art/use-grass-sprite-maps";
import {
  grassTextureForTile,
  type GrassSpriteId,
} from "@/lib/pixel-art/textures";
import { generateTerrain, TILE_SIZE, TERRAIN_SIZE } from "@/lib/terrain";

const GROUND_Y = 0.005;
const SELECTED_OVERLAY_Y = 0.002;

export type GrassTilePointer = {
  clientX: number;
  clientY: number;
};

export type GrassSelectionProps = {
  selectedTileKey?: string | null;
  onSelectTile?: (coord: GlobalGridCoord, pointer: GrassTilePointer) => void;
  onSelectTreeTile?: (coord: GlobalGridCoord, pointer: GrassTilePointer) => void;
};

function useGrassMaterials(opacity = 1) {
  const grassMaps = useGrassSpriteMaps();

  return useMemo(() => {
    const make = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.95,
        metalness: 0,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
      });

    return {
      grass: make(grassMaps.grass),
      "grass-2": make(grassMaps["grass-2"]),
      "grass-3": make(grassMaps["grass-3"]),
      "grass-4": make(grassMaps["grass-4"]),
    } satisfies Record<GrassSpriteId, THREE.MeshStandardMaterial>;
  }, [grassMaps, opacity]);
}

function SelectableGrassTile({
  gx,
  gz,
  material,
  selectedTileKey,
  onSelectTile,
}: {
  gx: number;
  gz: number;
  material: THREE.MeshStandardMaterial;
  selectedTileKey?: string | null;
  onSelectTile?: (coord: GlobalGridCoord, pointer: GrassTilePointer) => void;
}) {
  const { x, z } = globalTileWorldPosition(gx, gz);
  const tileKey = globalCoordKey(gx, gz);
  const isSelected = selectedTileKey === tileKey;

  return (
    <group position={[x, GROUND_Y, z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        material={material}
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelectTile?.(
            { gx, gz },
            { clientX: event.clientX, clientY: event.clientY },
          );
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
      </mesh>
      {onSelectTile ? (
        <DebugHitbox
          size={[TILE_SIZE, 0.08, TILE_SIZE]}
          position={[0, 0.04, 0]}
          color="#86efac"
        />
      ) : null}
      {isSelected ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, SELECTED_OVERLAY_Y, 0]}
        >
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshStandardMaterial
            color="#7dd3fc"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function StaticGrassTile({
  gx,
  gz,
  material,
}: {
  gx: number;
  gz: number;
  material: THREE.MeshStandardMaterial;
}) {
  const { x, z } = globalTileWorldPosition(gx, gz);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[x, GROUND_Y, z]}
      material={material}
      receiveShadow
      raycast={() => {}}
    >
      <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
    </mesh>
  );
}

export function GrassTiles({
  tiles,
  opacity = 1,
  selectedTileKey,
  onSelectTile,
}: {
  tiles: GlobalGridCoord[];
  opacity?: number;
} & GrassSelectionProps) {
  const materials = useGrassMaterials(opacity);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <group>
      {tiles.map(({ gx, gz }) => {
        const textureId = grassTextureForTile(gx, gz);

        return (
          <SelectableGrassTile
            key={globalCoordKey(gx, gz)}
            gx={gx}
            gz={gz}
            material={materials[textureId]}
            selectedTileKey={selectedTileKey}
            onSelectTile={onSelectTile}
          />
        );
      })}
    </group>
  );
}

export function GrassGround({
  size = TERRAIN_SIZE,
  origin,
  opacity = 1,
  omitLocalKeys,
  passiveLocalKeys,
  selectedTileKey,
  onSelectTile,
  onSelectTreeTile,
}: {
  size?: number;
  origin: ChunkOrigin;
  opacity?: number;
  /** Local `x:z` keys where grass should not be rendered (e.g. dirt roads). */
  omitLocalKeys?: ReadonlySet<string>;
  /** Local `x:z` keys under standing trees; clicks use `onSelectTreeTile`. */
  passiveLocalKeys?: ReadonlySet<string>;
} & GrassSelectionProps) {
  const tiles = useMemo(() => {
    const all = generateTerrain(size);

    if (!omitLocalKeys || omitLocalKeys.size === 0) {
      return all;
    }

    return all.filter((tile) => !omitLocalKeys.has(tile.key));
  }, [size, omitLocalKeys]);
  const materials = useGrassMaterials(opacity);

  return (
    <group>
      {tiles.map((tile) => {
        const gx = origin.gx + tile.x;
        const gz = origin.gz + tile.z;
        const textureId = grassTextureForTile(tile.x, tile.z);
        const material = materials[textureId];

        if (passiveLocalKeys?.has(tile.key)) {
          if (!onSelectTreeTile) {
            return (
              <StaticGrassTile
                key={tile.key}
                gx={gx}
                gz={gz}
                material={material}
              />
            );
          }

          return (
            <SelectableGrassTile
              key={tile.key}
              gx={gx}
              gz={gz}
              material={material}
              selectedTileKey={selectedTileKey}
              onSelectTile={onSelectTreeTile}
            />
          );
        }

        return (
          <SelectableGrassTile
            key={tile.key}
            gx={gx}
            gz={gz}
            material={material}
            selectedTileKey={selectedTileKey}
            onSelectTile={onSelectTile}
          />
        );
      })}
    </group>
  );
}
