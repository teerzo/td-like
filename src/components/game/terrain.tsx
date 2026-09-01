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
  OreDepositModel,
  oreDepositVariant,
  MountainModel,
  mountainVariant,
  FishingHutModel,
  fishingHutVariant,
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
  localCoordInChunk,
  revealedKindToDecorKind,
  type BuiltMine,
  type RevealedTileKind,
} from "@/lib/forest-nothing";
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
  /** Whether a gold mine building has been constructed. */
  hasGoldMine?: boolean;
  /** Whether an iron mine building has been constructed. */
  hasIronMine?: boolean;
  /** Optional main-grid fertile dirt local tile. */
  fertileDirt?: GridCoord | null;
  /** Whether a farm has been built on the fertile tile. */
  hasFarm?: boolean;
  /** Global keys of ponds that already have a fishing hut. */
  fishingHutKeys?: ReadonlySet<string>;
  /** Forest Nothing: tiles still covered by standing trees. */
  standingForestKeys?: ReadonlySet<string>;
  /** Forest Nothing: tile type revealed after chopping a tree. */
  revealedTiles?: ReadonlyMap<string, RevealedTileKind>;
  /** Forest Nothing: constructed mines (multiple allowed). */
  builtMines?: readonly BuiltMine[];
  /** Global farms on revealed fertile tiles. */
  farms?: readonly { gx: number; gz: number }[];
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
  fishingHutKeys,
  selectedTileKey,
  onSelectTile,
  onSelectTreeTile,
}: {
  placements: TerrainDecorPlacement[];
  origin: ChunkOrigin;
  showMountains?: boolean;
  fishingHutKeys?: ReadonlySet<string>;
} & GrassSelectionProps) {
  return (
    <group>
      {placements.map((placement) => {
        const gx = origin.gx + placement.x;
        const gz = origin.gz + placement.z;
        const { x, z } = globalTileWorldPosition(gx, gz);
        const selectHandler = hillSelectHandler(gx, gz, onSelectTile);
        const treeSelectHandler = hillSelectHandler(gx, gz, onSelectTreeTile);

        if (placement.kind === "tree") {
          const variant = treeVariant(placement.x, placement.z);
          return (
            <TreeModel
              key={placement.key}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              onSelect={treeSelectHandler}
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
          const key = globalCoordKey(gx, gz);
          const hasHut = fishingHutKeys?.has(key) ?? false;
          const hutVariant = fishingHutVariant(placement.x, placement.z);
          const pondPosition: [number, number, number] = [
            x + variant.offsetX,
            0,
            z + variant.offsetZ,
          ];

          return (
            <group key={placement.key}>
              <PondModel
                position={pondPosition}
                rotation={variant.rotation}
                scale={variant.scale}
                seed={variant.seed}
                onSelect={selectHandler}
              />
              {hasHut ? (
                <FishingHutModel
                  position={pondPosition}
                  rotation={hutVariant.rotation}
                  scale={hutVariant.scale}
                  onSelect={selectHandler}
                />
              ) : null}
            </group>
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

function RevealedSpecialTiles({
  origin,
  layoutSize,
  revealedTiles,
  builtMines,
  farms,
  fishingHutKeys,
  selectedTileKey,
  onSelectTile,
}: {
  origin: ChunkOrigin;
  layoutSize: number;
  revealedTiles: ReadonlyMap<string, RevealedTileKind>;
  builtMines: readonly BuiltMine[];
  farms: readonly { gx: number; gz: number }[];
  fishingHutKeys?: ReadonlySet<string>;
} & GrassSelectionProps) {
  const builtMineKeys = useMemo(
    () => new Set(builtMines.map((mine) => globalCoordKey(mine.gx, mine.gz))),
    [builtMines],
  );
  const farmKeys = useMemo(
    () => new Set(farms.map((farm) => globalCoordKey(farm.gx, farm.gz))),
    [farms],
  );

  const entries = useMemo(() => {
    const list: {
      key: string;
      x: number;
      z: number;
      kind: RevealedTileKind;
    }[] = [];

    for (const [key, kind] of revealedTiles) {
      const [gxPart, gzPart] = key.split(":");
      const gx = Number(gxPart);
      const gz = Number(gzPart);
      const local = localCoordInChunk(gx, gz, origin, layoutSize);
      if (!local) {
        continue;
      }

      if (
        kind === "grass" ||
        kind === "rock" ||
        kind === "hill" ||
        kind === "mountain" ||
        kind === "pond"
      ) {
        continue;
      }

      list.push({ key, x: local.x, z: local.z, kind });
    }

    return list;
  }, [revealedTiles, origin, layoutSize]);

  return (
    <group>
      {entries.map(({ key, x, z, kind }) => {
        const gx = origin.gx + x;
        const gz = origin.gz + z;
        const { x: worldX, z: worldZ } = globalTileWorldPosition(gx, gz);
        const selectHandler = hillSelectHandler(gx, gz, onSelectTile);

        if (kind === "goldDeposit") {
          const depositVariant = oreDepositVariant(x, z);
          const mineVariant = goldMineVariant(x, z);
          const built = builtMineKeys.has(key);

          return (
            <group key={`revealed-gold-${key}`}>
              {!built ? (
                <OreDepositModel
                  kind="gold"
                  position={[worldX, 0, worldZ]}
                  rotation={depositVariant.rotation}
                  scale={depositVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <GoldMineModel
                  position={[worldX, 0, worldZ]}
                  rotation={mineVariant.rotation}
                  scale={mineVariant.scale}
                />
              )}
            </group>
          );
        }

        if (kind === "ironDeposit") {
          const depositVariant = oreDepositVariant(x, z);
          const mineVariant = ironMineVariant(x, z);
          const built = builtMineKeys.has(key);

          return (
            <group key={`revealed-iron-${key}`}>
              {!built ? (
                <OreDepositModel
                  kind="iron"
                  position={[worldX, 0, worldZ]}
                  rotation={depositVariant.rotation}
                  scale={depositVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <IronMineModel
                  position={[worldX, 0, worldZ]}
                  rotation={mineVariant.rotation}
                  scale={mineVariant.scale}
                />
              )}
            </group>
          );
        }

        if (kind === "fertile") {
          const dirtVariant = fertileDirtVariant(x, z);
          const farmVariant = farmWindmillVariant(x, z);
          const hasFarm = farmKeys.has(key);

          return (
            <group key={`revealed-fertile-${key}`}>
              {!hasFarm ? (
                <FertileDirtModel
                  position={[worldX, 0, worldZ]}
                  rotation={dirtVariant.rotation}
                  scale={dirtVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <FarmWindmillModel
                  position={[worldX, 0, worldZ]}
                  rotation={farmVariant.rotation}
                  scale={farmVariant.scale}
                  onSelect={selectHandler}
                />
              )}
            </group>
          );
        }

        return null;
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
  hasGoldMine = false,
  hasIronMine = false,
  fertileDirt = null,
  hasFarm = false,
  fishingHutKeys,
  standingForestKeys,
  revealedTiles,
  builtMines = [],
  farms = [],
  clearedObstacleKeys,
  selectedTileKey,
  onSelectTile,
  onSelectTreeTile,
}: TerrainProps) {
  const forestMode = !!standingForestKeys && !!revealedTiles;
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
    if (forestMode) {
      return [];
    }

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
  }, [forestMode, goldMine, ironMine, fertileDirt]);

  const forestTreePlacements = useMemo(() => {
    if (!forestMode || !standingForestKeys) {
      return [];
    }

    const trees: TerrainDecorPlacement[] = [];

    for (let x = 0; x < layout.size; x += 1) {
      for (let z = 0; z < layout.size; z += 1) {
        const key = globalCoordKey(origin.gx + x, origin.gz + z);
        if (!standingForestKeys.has(key)) {
          continue;
        }

        trees.push({
          key: `tree:${x}:${z}`,
          x,
          z,
          kind: "tree",
        });
      }
    }

    return trees;
  }, [forestMode, standingForestKeys, layout.size, origin]);

  const forestRevealedDecor = useMemo(() => {
    if (!forestMode || !revealedTiles) {
      return [];
    }

    const placements: TerrainDecorPlacement[] = [];

    for (const [key, kind] of revealedTiles) {
      const [gxPart, gzPart] = key.split(":");
      const local = localCoordInChunk(
        Number(gxPart),
        Number(gzPart),
        origin,
        layout.size,
      );
      if (!local) {
        continue;
      }

      const decorKind = revealedKindToDecorKind(kind);
      if (!decorKind) {
        continue;
      }

      if (decorKind === "rock" && clearedObstacleKeys?.has(key)) {
        continue;
      }

      placements.push({
        key: `${decorKind}:${local.x}:${local.z}`,
        x: local.x,
        z: local.z,
        kind: decorKind,
      });
    }

    return placements;
  }, [forestMode, revealedTiles, origin, layout.size, clearedObstacleKeys]);

  const decor = useMemo(() => {
    if (!showDecor) {
      return [];
    }

    if (forestMode) {
      return [...forestTreePlacements, ...forestRevealedDecor];
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
  }, [
    layout,
    showDecor,
    blockedSpecialTiles,
    clearedObstacleKeys,
    origin,
    forestMode,
    forestTreePlacements,
    forestRevealedDecor,
  ]);

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

    if (!forestMode) {
      if (fertileDirt) {
        keys.add(`${fertileDirt.x}:${fertileDirt.z}`);
      }
      if (goldMine) {
        keys.add(`${goldMine.x}:${goldMine.z}`);
      }
      if (ironMine) {
        keys.add(`${ironMine.x}:${ironMine.z}`);
      }
    } else if (revealedTiles) {
      for (const [key, kind] of revealedTiles) {
        const [gxPart, gzPart] = key.split(":");
        const local = localCoordInChunk(
          Number(gxPart),
          Number(gzPart),
          origin,
          layout.size,
        );
        if (!local) {
          continue;
        }

        const decorKind = revealedKindToDecorKind(kind);
        if (decorKind && decorOmitsGrass(decorKind)) {
          keys.add(`${local.x}:${local.z}`);
        }
      }
    }

    return keys;
  }, [
    layout,
    decor,
    fertileDirt,
    goldMine,
    ironMine,
    forestMode,
    revealedTiles,
    origin,
  ]);

  const forestPassiveGrassKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!standingForestKeys) {
      return keys;
    }

    for (let x = 0; x < layout.size; x += 1) {
      for (let z = 0; z < layout.size; z += 1) {
        const key = globalCoordKey(origin.gx + x, origin.gz + z);
        if (standingForestKeys.has(key)) {
          keys.add(`${x}:${z}`);
        }
      }
    }

    return keys;
  }, [standingForestKeys, layout.size, origin]);

  const goldMineWorld = useMemo(() => {
    if (!goldMine) {
      return null;
    }

    const gx = origin.gx + goldMine.x;
    const gz = origin.gz + goldMine.z;
    const { x, z } = globalTileWorldPosition(gx, gz);
    const depositVariant = oreDepositVariant(goldMine.x, goldMine.z);
    const mineVariant = goldMineVariant(goldMine.x, goldMine.z);

    return {
      gx,
      gz,
      position: [x, 0, z] as [number, number, number],
      depositRotation: depositVariant.rotation,
      depositScale: depositVariant.scale,
      mineRotation: mineVariant.rotation,
      mineScale: mineVariant.scale,
      selected: selectedTileKey === globalCoordKey(gx, gz),
    };
  }, [goldMine, origin, selectedTileKey]);

  const ironMineWorld = useMemo(() => {
    if (!ironMine) {
      return null;
    }

    const gx = origin.gx + ironMine.x;
    const gz = origin.gz + ironMine.z;
    const { x, z } = globalTileWorldPosition(gx, gz);
    const depositVariant = oreDepositVariant(ironMine.x, ironMine.z);
    const mineVariant = ironMineVariant(ironMine.x, ironMine.z);

    return {
      gx,
      gz,
      position: [x, 0, z] as [number, number, number],
      depositRotation: depositVariant.rotation,
      depositScale: depositVariant.scale,
      mineRotation: mineVariant.rotation,
      mineScale: mineVariant.scale,
      selected: selectedTileKey === globalCoordKey(gx, gz),
    };
  }, [ironMine, origin, selectedTileKey]);

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
          passiveLocalKeys={forestPassiveGrassKeys}
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
          fishingHutKeys={fishingHutKeys}
          selectedTileKey={selectedTileKey}
          onSelectTile={onSelectTile}
          onSelectTreeTile={onSelectTreeTile}
        />
      ) : null}
      {forestMode && revealedTiles ? (
        <RevealedSpecialTiles
          origin={origin}
          layoutSize={layout.size}
          revealedTiles={revealedTiles}
          builtMines={builtMines}
          farms={farms}
          fishingHutKeys={fishingHutKeys}
          selectedTileKey={selectedTileKey}
          onSelectTile={onSelectTile}
        />
      ) : null}
      {!forestMode && goldMineWorld ? (
        <OreDepositModel
          kind="gold"
          position={goldMineWorld.position}
          rotation={goldMineWorld.depositRotation}
          scale={goldMineWorld.depositScale}
          selected={goldMineWorld.selected && !hasGoldMine}
          onSelect={hillSelectHandler(
            goldMineWorld.gx,
            goldMineWorld.gz,
            onSelectTile,
          )}
        />
      ) : null}
      {!forestMode && goldMineWorld && hasGoldMine ? (
        <GoldMineModel
          position={goldMineWorld.position}
          rotation={goldMineWorld.mineRotation}
          scale={goldMineWorld.mineScale}
        />
      ) : null}
      {!forestMode && ironMineWorld ? (
        <OreDepositModel
          kind="iron"
          position={ironMineWorld.position}
          rotation={ironMineWorld.depositRotation}
          scale={ironMineWorld.depositScale}
          selected={ironMineWorld.selected && !hasIronMine}
          onSelect={hillSelectHandler(
            ironMineWorld.gx,
            ironMineWorld.gz,
            onSelectTile,
          )}
        />
      ) : null}
      {!forestMode && ironMineWorld && hasIronMine ? (
        <IronMineModel
          position={ironMineWorld.position}
          rotation={ironMineWorld.mineRotation}
          scale={ironMineWorld.mineScale}
        />
      ) : null}
      {!forestMode && fertileWorld ? (
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
      {!forestMode && fertileWorld && hasFarm ? (
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
