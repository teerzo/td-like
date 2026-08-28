"use client";

import { useMemo } from "react";

import { GrassGround, type GrassSelectionProps } from "@/components/game/ground-plane";
import { DirtTileFlowMarkers } from "@/components/game/dirt-tile-flow-markers";
import {
  DIRT_ROAD_Y,
  DirtRoadTile,
} from "@/components/game/models/dirt-road-tile";
import { TreeModel, treeVariant } from "@/components/game/models/tree";
import {
  type ChunkOrigin,
  globalTileWorldPosition,
} from "@/lib/global-grid";
import { getDirtRoadAppearance } from "@/lib/road-tile-appearance";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";
import { useDirtRoadSpriteMaps } from "@/lib/pixel-art/use-dirt-road-sprite-maps";
import {
  DIRT_TILE_SIZE,
  generateTerrain,
  SHOW_DIRT_TILES,
  SHOW_TREES,
  TILE_SIZE,
} from "@/lib/terrain";
import {
  generateWorldLayout,
  getExitBlendSprite,
  isEntranceTile,
  isExitTile,
  isRoadTile,
  shouldPlaceDirtTile,
  type WorldLayout,
} from "@/lib/world-layout";

/** Stone courtyard sits above grass, below dirt roads. */
const CASTLE_STONE_Y = 0.008;

type TerrainProps = {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  showCastlePad?: boolean;
  showTrees?: boolean;
} & GrassSelectionProps;

function RoadMarkerTile({
  dirtMaps,
  layout,
  x,
  z,
  position,
  markerColor,
  opacity = 1,
}: {
  dirtMaps: ReturnType<typeof useDirtRoadSpriteMaps>;
  layout: WorldLayout;
  x: number;
  z: number;
  position: [number, number, number];
  markerColor: string;
  opacity?: number;
}) {
  const { sprite } = getDirtRoadAppearance(layout, x, z);

  return (
    <group position={position}>
      {SHOW_DIRT_TILES ? (
        <DirtRoadTile
          map={dirtMaps[sprite]}
          position={[0, 0, 0]}
          opacity={opacity}
        />
      ) : null}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE * 0.7, TILE_SIZE * 0.7]} />
        <meshStandardMaterial
          color={markerColor}
          roughness={0.9}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 1}
        />
      </mesh>
    </group>
  );
}

function ExitBlendTile({
  dirtMaps,
  layout,
  position,
  opacity = 1,
}: {
  dirtMaps: ReturnType<typeof useDirtRoadSpriteMaps>;
  layout: WorldLayout;
  position: [number, number, number];
  opacity?: number;
}) {
  const blendSprite = useMemo(() => getExitBlendSprite(layout), [layout]);

  return (
    <group position={position}>
      {SHOW_DIRT_TILES ? (
        <DirtRoadTile
          map={dirtMaps[blendSprite]}
          position={[0, 0, 0]}
          opacity={opacity}
        />
      ) : null}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE * 0.7, TILE_SIZE * 0.7]} />
        <meshStandardMaterial
          color="#6eb5ff"
          roughness={0.9}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 1}
        />
      </mesh>
    </group>
  );
}

function CastleStonePad({
  layout,
  origin,
  stoneMap,
  opacity = 1,
}: {
  layout: WorldLayout;
  origin: ChunkOrigin;
  stoneMap: ReturnType<typeof useCastleSpriteMap>;
  opacity?: number;
}) {
  const position = useMemo(
    () =>
      roadPosition(layout.castle.x, layout.castle.z, origin).map(
        (value, index) => (index === 1 ? CASTLE_STONE_Y : value),
      ) as [number, number, number],
    [layout, origin],
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
    >
      <planeGeometry args={[DIRT_TILE_SIZE, DIRT_TILE_SIZE]} />
      <meshStandardMaterial
        map={stoneMap}
        roughness={0.95}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
      />
    </mesh>
  );
}

function roadPosition(x: number, z: number, origin: ChunkOrigin) {
  const { x: worldX, z: worldZ } = globalTileWorldPosition(
    origin.gx + x,
    origin.gz + z,
  );

  return [worldX, DIRT_ROAD_Y, worldZ] as [number, number, number];
}

function shouldPlaceTree(layout: WorldLayout, x: number, z: number) {
  if (isRoadTile(layout, x, z)) {
    return false;
  }

  if (layout.castle.x === x && layout.castle.z === z) {
    return false;
  }

  if (isExitTile(layout, x, z)) {
    return false;
  }

  return true;
}

export function Terrain({
  layout,
  origin,
  opacity = 1,
  showCastlePad = true,
  showTrees = SHOW_TREES,
  selectedTileKey,
  onSelectTile,
}: TerrainProps) {
  const dirtMaps = useDirtRoadSpriteMaps();
  const stoneMap = useCastleSpriteMap("stone");
  const tiles = useMemo(() => generateTerrain(layout.size), [layout.size]);

  const dirtRoadTiles = useMemo(() => {
    return [...layout.roadKeys]
      .map((key) => {
        const [x, z] = key.split(":").map(Number);
        return { key, x, z, ...getDirtRoadAppearance(layout, x, z) };
      })
      .filter(
        ({ x, z }) =>
          shouldPlaceDirtTile(layout, x, z) &&
          !isEntranceTile(layout, x, z) &&
          !isExitTile(layout, x, z),
      );
  }, [layout]);

  const trees = useMemo(
    () =>
      tiles.filter((tile) => shouldPlaceTree(layout, tile.x, tile.z)),
    [layout, tiles],
  );

  return (
    <group>
      <GrassGround
        size={layout.size}
        origin={origin}
        opacity={opacity}
        selectedTileKey={selectedTileKey}
        onSelectTile={onSelectTile}
      />
      {showCastlePad ? (
        <CastleStonePad
          layout={layout}
          origin={origin}
          stoneMap={stoneMap}
          opacity={opacity}
        />
      ) : null}
      {SHOW_DIRT_TILES
        ? dirtRoadTiles.map(({ key, x, z, sprite }) => (
            <DirtRoadTile
              key={key}
              map={dirtMaps[sprite]}
              position={roadPosition(x, z, origin)}
              opacity={opacity}
            />
          ))
        : null}
      {SHOW_DIRT_TILES ? (
        <DirtTileFlowMarkers layout={layout} origin={origin} opacity={opacity} />
      ) : null}
      <RoadMarkerTile
        dirtMaps={dirtMaps}
        layout={layout}
        markerColor="#d4b848"
        x={layout.entrance.x}
        z={layout.entrance.z}
        position={roadPosition(
          layout.entrance.x,
          layout.entrance.z,
          origin,
        )}
        opacity={opacity}
      />
      <ExitBlendTile
        dirtMaps={dirtMaps}
        layout={layout}
        position={roadPosition(layout.exit.x, layout.exit.z, origin)}
        opacity={opacity}
      />
      {showTrees
        ? trees.map((tile) => {
            const { x, z } = globalTileWorldPosition(
              origin.gx + tile.x,
              origin.gz + tile.z,
            );
            const variant = treeVariant(tile.x, tile.z);

            return (
              <TreeModel
                key={`tree-${tile.key}`}
                position={[x + variant.offsetX, 0, z + variant.offsetZ]}
                rotation={variant.rotation}
                scale={variant.scale}
              />
            );
          })
        : null}
    </group>
  );
}

export function useWorldLayout() {
  return useMemo(() => generateWorldLayout(), []);
}
