"use client";

import { useMemo } from "react";

import {
  GrassGround,
  type GrassSelectionProps,
} from "@/components/game/ground-plane";
import {
  FarmWindmillModel,
  farmWindmillVariant,
  FertileDirtModel,
  fertileDirtVariant,
  FishingHutModel,
  fishingHutVariant,
  GoldMineModel,
  goldMineVariant,
  HillTile,
  hillSelectHandler,
  hillVariant,
  IronMineModel,
  ironMineVariant,
  MountainModel,
  mountainVariant,
  OreDepositModel,
  oreDepositVariant,
  PondModel,
  pondVariant,
  RockModel,
  rockVariant,
  TreeModel,
  treeVariant,
} from "@/components/game/models";
import {
  globalCoordKey,
  globalTileWorldPosition,
  type ChunkOrigin,
} from "@/lib/global-grid";
import type { BuildPlot } from "@/lib/fertile-farm";
import {
  isGlobalRoadClearanceTile,
  revealedKindToDecorKind,
  type BuiltMine,
  type RevealedTileKind,
} from "@/lib/forest-nothing";
import { decorOmitsGrass } from "@/lib/terrain-decor";
import { TILE_SIZE } from "@/lib/terrain";
import { generateTerrain } from "@/lib/terrain";

const MOUNTAIN_TILE_SCALE = TILE_SIZE / 0.6;

type ForestGroundProps = {
  plot: BuildPlot;
  standingForestKeys: ReadonlySet<string>;
  revealedTiles: ReadonlyMap<string, RevealedTileKind>;
  builtMines: readonly BuiltMine[];
  farms: readonly { gx: number; gz: number }[];
  fishingHutKeys: ReadonlySet<string>;
  clearedObstacleKeys: ReadonlySet<string>;
  isGlobalRoad: (gx: number, gz: number) => boolean;
  showMountains?: boolean;
  opacity?: number;
} & GrassSelectionProps;

export function ForestGround({
  plot,
  standingForestKeys,
  revealedTiles,
  builtMines,
  farms,
  fishingHutKeys,
  clearedObstacleKeys,
  isGlobalRoad,
  showMountains = true,
  opacity = 1,
  selectedTileKey,
  onSelectTile,
  onSelectTreeTile,
}: ForestGroundProps) {
  const builtMineKeys = useMemo(
    () => new Set(builtMines.map((mine) => globalCoordKey(mine.gx, mine.gz))),
    [builtMines],
  );

  const farmKeys = useMemo(
    () => new Set(farms.map((farm) => globalCoordKey(farm.gx, farm.gz))),
    [farms],
  );

  const omitGrassKeys = useMemo(() => {
    const keys = new Set<string>();
    const passiveKeys = new Set<string>();

    for (let x = 0; x < plot.size; x += 1) {
      for (let z = 0; z < plot.size; z += 1) {
        const gx = plot.origin.gx + x;
        const gz = plot.origin.gz + z;
        const key = globalCoordKey(gx, gz);

        if (standingForestKeys.has(key)) {
          passiveKeys.add(`${x}:${z}`);
          continue;
        }

        const revealed = revealedTiles.get(key);
        if (revealed) {
          const decorKind = revealedKindToDecorKind(revealed);
          if (decorKind && decorOmitsGrass(decorKind)) {
            keys.add(`${x}:${z}`);
          }
        }
      }
    }

    return { omit: keys, passive: passiveKeys };
  }, [plot, standingForestKeys, revealedTiles]);

  const tiles = useMemo(() => generateTerrain(plot.size), [plot.size]);

  return (
    <group>
      <GrassGround
        size={plot.size}
        origin={plot.origin}
        opacity={opacity}
        omitLocalKeys={omitGrassKeys.omit}
        passiveLocalKeys={omitGrassKeys.passive}
        selectedTileKey={selectedTileKey}
        onSelectTile={onSelectTile}
      />
      {tiles.map((tile) => {
        const gx = plot.origin.gx + tile.x;
        const gz = plot.origin.gz + tile.z;
        const key = globalCoordKey(gx, gz);
        const { x, z } = globalTileWorldPosition(gx, gz);
        const selectHandler = hillSelectHandler(gx, gz, onSelectTile);
        const treeSelectHandler = hillSelectHandler(gx, gz, onSelectTreeTile);

        if (standingForestKeys.has(key)) {
          const variant = treeVariant(tile.x, tile.z);
          return (
            <TreeModel
              key={`forest-tree-${key}`}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              onSelect={treeSelectHandler}
            />
          );
        }

        if (isGlobalRoadClearanceTile(gx, gz, isGlobalRoad)) {
          return null;
        }

        const revealed = revealedTiles.get(key);
        if (!revealed) {
          return null;
        }

        const decorKind = revealedKindToDecorKind(revealed);

        if (decorKind === "rock" && !clearedObstacleKeys.has(key)) {
          const variant = rockVariant(tile.x, tile.z);
          return (
            <RockModel
              key={`forest-rock-${key}`}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              onSelect={selectHandler}
            />
          );
        }

        if (decorKind === "pond") {
          const variant = pondVariant(tile.x, tile.z);
          const pondPosition: [number, number, number] = [
            x + variant.offsetX,
            0,
            z + variant.offsetZ,
          ];
          const hasHut = fishingHutKeys.has(key);
          const hutVariant = fishingHutVariant(tile.x, tile.z);

          return (
            <group key={`forest-pond-${key}`}>
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

        if (decorKind === "hill") {
          const variant = hillVariant(tile.x, tile.z);
          return (
            <HillTile
              key={`forest-hill-${key}`}
              tileX={tile.x}
              tileZ={tile.z}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale}
              height={variant.height}
              selected={selectedTileKey === key}
              onSelect={selectHandler}
            />
          );
        }

        if (decorKind === "mountain" && showMountains) {
          const variant = mountainVariant(tile.x, tile.z);
          return (
            <MountainModel
              key={`forest-mountain-${key}`}
              position={[x + variant.offsetX, 0, z + variant.offsetZ]}
              rotation={variant.rotation}
              scale={variant.scale * MOUNTAIN_TILE_SCALE}
            />
          );
        }

        if (revealed === "goldDeposit") {
          const depositVariant = oreDepositVariant(tile.x, tile.z);
          const mineVariant = goldMineVariant(tile.x, tile.z);
          const built = builtMineKeys.has(key);

          return (
            <group key={`forest-gold-${key}`}>
              {!built ? (
                <OreDepositModel
                  kind="gold"
                  position={[x, 0, z]}
                  rotation={depositVariant.rotation}
                  scale={depositVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <GoldMineModel
                  position={[x, 0, z]}
                  rotation={mineVariant.rotation}
                  scale={mineVariant.scale}
                />
              )}
            </group>
          );
        }

        if (revealed === "ironDeposit") {
          const depositVariant = oreDepositVariant(tile.x, tile.z);
          const mineVariant = ironMineVariant(tile.x, tile.z);
          const built = builtMineKeys.has(key);

          return (
            <group key={`forest-iron-${key}`}>
              {!built ? (
                <OreDepositModel
                  kind="iron"
                  position={[x, 0, z]}
                  rotation={depositVariant.rotation}
                  scale={depositVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <IronMineModel
                  position={[x, 0, z]}
                  rotation={mineVariant.rotation}
                  scale={mineVariant.scale}
                />
              )}
            </group>
          );
        }

        if (revealed === "fertile") {
          const dirtVariant = fertileDirtVariant(tile.x, tile.z);
          const farmVariant = farmWindmillVariant(tile.x, tile.z);
          const hasFarm = farmKeys.has(key);

          return (
            <group key={`forest-fertile-${key}`}>
              {!hasFarm ? (
                <FertileDirtModel
                  position={[x, 0, z]}
                  rotation={dirtVariant.rotation}
                  scale={dirtVariant.scale}
                  selected={selectedTileKey === key}
                  onSelect={selectHandler}
                />
              ) : (
                <FarmWindmillModel
                  position={[x, 0, z]}
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
