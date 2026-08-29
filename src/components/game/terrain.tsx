"use client";

import { useMemo } from "react";

import { GrassGround, type GrassSelectionProps } from "@/components/game/ground-plane";
import { DirtTileFlowMarkers } from "@/components/game/dirt-tile-flow-markers";
import {
  DIRT_ROAD_Y,
  DirtRoadTile,
} from "@/components/game/models/dirt-road-tile";
import {
  HillTile,
  hillSelectHandler,
  hillVariant,
  FarmWindmillModel,
  farmWindmillVariant,
  FertileDirtModel,
  fertileDirtVariant,
  GoldMineModel,
  goldMineVariant,
  IronMineModel,
  ironMineVariant,
  MountainModel,
  mountainVariant,
  PondModel,
  pondVariant,
  RockModel,
  rockVariant,
  TreeModel,
  treeVariant,
} from "@/components/game/models";
import {
  type ChunkOrigin,
  globalCoordKey,
  globalTileWorldPosition,
} from "@/lib/global-grid";
import { getDirtRoadAppearance } from "@/lib/road-tile-appearance";
import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";
import { useDirtRoadSpriteMaps } from "@/lib/pixel-art/use-dirt-road-sprite-maps";
import {
  decorOmitsGrass,
  generateTerrainDecor,
  type TerrainDecorPlacement,
} from "@/lib/terrain-decor";
import {
  DIRT_TILE_SIZE,
  SHOW_DIRT_TILES,
  SHOW_TERRAIN_DECOR,
  TILE_SIZE,
} from "@/lib/terrain";
import {
  generateWorldLayout,
  getExitBlendSprite,
  getPathAtExit,
  getPathIndexAtTile,
  isEntranceTile,
  isExitTile,
  layoutForPath,
  shouldPlaceDirtTile,
  type GridCoord,
  type WorldLayout,
} from "@/lib/world-layout";

/** Stone courtyard sits above grass, below dirt roads. */
const CASTLE_STONE_Y = 0.008;
const PATH_PREVIEW_OPACITY = 0.5;
/** Base mountain AABB is 5×MOUNTAIN_VOXEL (0.6); scale to fill TILE_SIZE. */
const MOUNTAIN_TILE_SCALE = TILE_SIZE / 0.6;

type TerrainProps = {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  /** Paths with index < this count render at full opacity; others at 50%. */
  revealedPathCount?: number;
  showCastlePad?: boolean;
  showDecor?: boolean;
  showMountains?: boolean;
  showGrass?: boolean;
  /** Optional main-grid gold mine local tile. */
  goldMine?: GridCoord | null;
  /** Optional main-grid iron mine local tile. */
  ironMine?: GridCoord | null;
  /** Optional main-grid fertile dirt local tile. */
  fertileDirt?: GridCoord | null;
  /** Whether a farm has been built on the fertile tile. */
  hasFarm?: boolean;
  /** Global tile keys where tree/rock decor was cleared. */
  clearedObstacleKeys?: ReadonlySet<string>;
} & GrassSelectionProps;

function pathOpacityForIndex(
  pathIndex: number,
  revealedPathCount: number | undefined,
  fallbackOpacity: number,
) {
  if (revealedPathCount === undefined) {
    return fallbackOpacity;
  }

  if (pathIndex < 0) {
    return fallbackOpacity;
  }

  return pathIndex < revealedPathCount ? 1 : PATH_PREVIEW_OPACITY;
}

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
  exit,
  position,
  opacity = 1,
}: {
  dirtMaps: ReturnType<typeof useDirtRoadSpriteMaps>;
  layout: WorldLayout;
  exit: GridCoord;
  position: [number, number, number];
  opacity?: number;
}) {
  const blendSprite = useMemo(() => {
    const path = getPathAtExit(layout, exit);
    const pathLayout = path ? layoutForPath(layout, path) : layout;

    return getExitBlendSprite(pathLayout);
  }, [layout, exit]);

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

function TerrainDecorModels({
  placements,
  origin,
  showMountains = true,
  selectedTileKey,
  onSelectTile,
}: {
  placements: TerrainDecorPlacement[];
  origin: ChunkOrigin;
  showMountains?: boolean;
} & GrassSelectionProps) {
  return (
    <group>
      {placements.map((placement) => {
        const gx = origin.gx + placement.x;
        const gz = origin.gz + placement.z;
        const { x, z } = globalTileWorldPosition(gx, gz);
        const selectHandler = hillSelectHandler(gx, gz, onSelectTile);

        if (placement.kind === "tree") {
          const variant = treeVariant(placement.x, placement.z);
          return (
            <TreeModel
              key={placement.key}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              onSelect={selectHandler}
            />
          );
        }

        if (placement.kind === "rock") {
          const variant = rockVariant(placement.x, placement.z);
          return (
            <RockModel
              key={placement.key}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              onSelect={selectHandler}
            />
          );
        }

        if (placement.kind === "pond") {
          const variant = pondVariant(placement.x, placement.z);
          return (
            <PondModel
              key={placement.key}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
            />
          );
        }

        if (placement.kind === "hill") {
          const variant = hillVariant(placement.x, placement.z);
          return (
            <HillTile
              key={placement.key}
              tileX={placement.x}
              tileZ={placement.z}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              height={variant.height}
              selected={selectedTileKey === globalCoordKey(gx, gz)}
              onSelect={selectHandler}
            />
          );
        }

        if (!showMountains) {
          return null;
        }

        const variant = mountainVariant(placement.x, placement.z);
        return (
          <MountainModel
            key={placement.key}
            position={[x + variant.offsetX, 0, z + variant.offsetZ]}
            rotation={variant.rotation}
            scale={variant.scale * MOUNTAIN_TILE_SCALE}
          />
        );
      })}
    </group>
  );
}

export function Terrain({
  layout,
  origin,
  opacity = 1,
  revealedPathCount,
  showCastlePad = true,
  showDecor = SHOW_TERRAIN_DECOR,
  showMountains = true,
  showGrass = true,
  goldMine = null,
  ironMine = null,
  fertileDirt = null,
  hasFarm = false,
  clearedObstacleKeys,
  selectedTileKey,
  onSelectTile,
}: TerrainProps) {
  const dirtMaps = useDirtRoadSpriteMaps();
  const stoneMap = useCastleSpriteMap("stone");

  const dirtRoadTiles = useMemo(() => {
    return [...layout.roadKeys]
      .map((key) => {
        const [x, z] = key.split(":").map(Number);
        const pathIndex = getPathIndexAtTile(layout, x, z);
        return {
          key,
          x,
          z,
          pathIndex,
          ...getDirtRoadAppearance(layout, x, z),
        };
      })
      .filter(
        ({ x, z }) =>
          shouldPlaceDirtTile(layout, x, z) &&
          !isEntranceTile(layout, x, z) &&
          !isExitTile(layout, x, z),
      );
  }, [layout]);

  const blockedSpecialTiles = useMemo(() => {
    const tiles: GridCoord[] = [];
    if (goldMine) {
      tiles.push(goldMine);
    }
    if (ironMine) {
      tiles.push(ironMine);
    }
    if (fertileDirt) {
      tiles.push(fertileDirt);
    }
    return tiles;
  }, [goldMine, ironMine, fertileDirt]);

  const decor = useMemo(() => {
    if (!showDecor) {
      return [];
    }

    const placements = generateTerrainDecor(layout, {
      blockedTiles:
        blockedSpecialTiles.length > 0 ? blockedSpecialTiles : undefined,
    });

    if (!clearedObstacleKeys || clearedObstacleKeys.size === 0) {
      return placements;
    }

    return placements.filter((placement) => {
      if (placement.kind !== "tree" && placement.kind !== "rock") {
        return true;
      }

      const key = globalCoordKey(origin.gx + placement.x, origin.gz + placement.z);
      return !clearedObstacleKeys.has(key);
    });
  }, [layout, showDecor, blockedSpecialTiles, clearedObstacleKeys, origin]);

  const omitGrassKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const key of layout.roadKeys) {
      const [x, z] = key.split(":").map(Number);

      if (shouldPlaceDirtTile(layout, x, z)) {
        keys.add(key);
      }
    }

    for (const placement of decor) {
      if (decorOmitsGrass(placement.kind)) {
        keys.add(`${placement.x}:${placement.z}`);
      }
    }

    if (fertileDirt) {
      keys.add(`${fertileDirt.x}:${fertileDirt.z}`);
    }

    return keys;
  }, [layout, decor, fertileDirt]);

  const goldMineWorld = useMemo(() => {
    if (!goldMine) {
      return null;
    }

    const { x, z } = globalTileWorldPosition(
      origin.gx + goldMine.x,
      origin.gz + goldMine.z,
    );
    const variant = goldMineVariant(goldMine.x, goldMine.z);

    return {
      position: [x, 0, z] as [number, number, number],
      rotation: variant.rotation,
      scale: variant.scale,
    };
  }, [goldMine, origin]);

  const ironMineWorld = useMemo(() => {
    if (!ironMine) {
      return null;
    }

    const { x, z } = globalTileWorldPosition(
      origin.gx + ironMine.x,
      origin.gz + ironMine.z,
    );
    const variant = ironMineVariant(ironMine.x, ironMine.z);

    return {
      position: [x, 0, z] as [number, number, number],
      rotation: variant.rotation,
      scale: variant.scale,
    };
  }, [ironMine, origin]);

  const fertileWorld = useMemo(() => {
    if (!fertileDirt) {
      return null;
    }

    const gx = origin.gx + fertileDirt.x;
    const gz = origin.gz + fertileDirt.z;
    const { x, z } = globalTileWorldPosition(gx, gz);
    const dirtVariant = fertileDirtVariant(fertileDirt.x, fertileDirt.z);
    const farmVariant = farmWindmillVariant(fertileDirt.x, fertileDirt.z);

    return {
      gx,
      gz,
      position: [x, 0, z] as [number, number, number],
      dirtRotation: dirtVariant.rotation,
      dirtScale: dirtVariant.scale,
      farmRotation: farmVariant.rotation,
      farmScale: farmVariant.scale,
      selected: selectedTileKey === globalCoordKey(gx, gz),
    };
  }, [fertileDirt, origin, selectedTileKey]);

  return (
    <group>
      {showGrass ? (
        <GrassGround
          size={layout.size}
          origin={origin}
          opacity={opacity}
          omitLocalKeys={omitGrassKeys}
          selectedTileKey={selectedTileKey}
          onSelectTile={onSelectTile}
        />
      ) : null}
      {showCastlePad ? (
        <CastleStonePad
          layout={layout}
          origin={origin}
          stoneMap={stoneMap}
          opacity={opacity}
        />
      ) : null}
      {SHOW_DIRT_TILES
        ? dirtRoadTiles.map(({ key, x, z, sprite, pathIndex }) => (
            <DirtRoadTile
              key={key}
              map={dirtMaps[sprite]}
              position={roadPosition(x, z, origin)}
              opacity={pathOpacityForIndex(pathIndex, revealedPathCount, opacity)}
            />
          ))
        : null}
      {SHOW_DIRT_TILES ? (
        <DirtTileFlowMarkers
          layout={layout}
          origin={origin}
          opacity={opacity}
          revealedPathCount={revealedPathCount}
        />
      ) : null}
      {layout.paths.map((path, pathIndex) => (
        <RoadMarkerTile
          key={`entrance-${path.entrance.x}:${path.entrance.z}`}
          dirtMaps={dirtMaps}
          layout={layout}
          markerColor="#d4b848"
          x={path.entrance.x}
          z={path.entrance.z}
          position={roadPosition(
            path.entrance.x,
            path.entrance.z,
            origin,
          )}
          opacity={pathOpacityForIndex(pathIndex, revealedPathCount, opacity)}
        />
      ))}
      {layout.paths.map((path, pathIndex) => (
        <ExitBlendTile
          key={`exit-${path.exit.x}:${path.exit.z}`}
          dirtMaps={dirtMaps}
          layout={layout}
          exit={path.exit}
          position={roadPosition(path.exit.x, path.exit.z, origin)}
          opacity={pathOpacityForIndex(pathIndex, revealedPathCount, opacity)}
        />
      ))}
      {showDecor ? (
        <TerrainDecorModels
          placements={decor}
          origin={origin}
          showMountains={showMountains}
          selectedTileKey={selectedTileKey}
          onSelectTile={onSelectTile}
        />
      ) : null}
      {goldMineWorld ? (
        <GoldMineModel
          position={goldMineWorld.position}
          rotation={goldMineWorld.rotation}
          scale={goldMineWorld.scale}
        />
      ) : null}
      {ironMineWorld ? (
        <IronMineModel
          position={ironMineWorld.position}
          rotation={ironMineWorld.rotation}
          scale={ironMineWorld.scale}
        />
      ) : null}
      {fertileWorld ? (
        <FertileDirtModel
          position={fertileWorld.position}
          rotation={fertileWorld.dirtRotation}
          scale={fertileWorld.dirtScale}
          selected={fertileWorld.selected && !hasFarm}
          onSelect={hillSelectHandler(
            fertileWorld.gx,
            fertileWorld.gz,
            onSelectTile,
          )}
        />
      ) : null}
      {fertileWorld && hasFarm ? (
        <FarmWindmillModel
          position={fertileWorld.position}
          rotation={fertileWorld.farmRotation}
          scale={fertileWorld.farmScale}
          onSelect={hillSelectHandler(
            fertileWorld.gx,
            fertileWorld.gz,
            onSelectTile,
          )}
        />
      ) : null}
    </group>
  );
}

export function useWorldLayout() {
  return useMemo(() => generateWorldLayout(), []);
}
