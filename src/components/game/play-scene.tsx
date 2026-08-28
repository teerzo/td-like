"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EnemyWalker } from "@/components/game/enemy-walker";
import { Projectile } from "@/components/game/projectile";
import { CastleModel, TowerModel } from "@/components/game/models";
import { GrassTiles, type GrassSelectionProps } from "@/components/game/ground-plane";
import { LevelDirectionArrow } from "@/components/game/level-direction-arrow";
import { Terrain, useWorldLayout } from "@/components/game/terrain";
import { TowerAttackRadiusPreview } from "@/components/game/tower-attack-radius-preview";
import {
  TowerDefenseSystem,
  type FiredProjectile,
  type PlacedTower,
} from "@/components/game/tower-defense-system";
import { Button } from "@/components/ui/button";
import {
  centeredChunkOrigin,
  computeChunkOrigin,
  globalCoordKey,
  GlobalTileRegistry,
  globalTileWorldPosition,
  getLayoutWorldPath,
  getSeamGrassTileGroups,
  localToGlobal,
  type ChunkOrigin,
  type GlobalGridCoord,
} from "@/lib/global-grid";
import { getEnemiesInAoe } from "@/lib/tower-combat";
import { getTowerStats } from "@/lib/tower-types";
import {
  generatePreviewWorldLayout,
  getEntranceEdgeForSpawnTurn,
  getLayoutSpawnTurn,
  getSpawnTurnBlocks,
  pickPreviewSpawnTurn,
  type SpawnTurn,
  type WorldLayout,
} from "@/lib/world-layout";

const MAX_SPAWN_ATTEMPTS = 64;

const PREVIEW_LEVEL_OPACITY = 0.5;

type PlacedLevel = {
  id: number;
  layout: WorldLayout;
  origin: ChunkOrigin;
  spawnTurn: SpawnTurn;
};

const DEFAULT_TOWER_TYPE = "rook" as const;
const DEFAULT_ENEMY_HP = 1;

type PlacedEnemy = {
  id: number;
  path: [number, number, number][];
  hp: number;
  maxHp: number;
};

function LevelChunk({
  layout,
  origin,
  opacity = 1,
  showCastlePad = false,
  selectedTileKey,
  onSelectTile,
}: {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  showCastlePad?: boolean;
} & GrassSelectionProps) {
  return (
    <Terrain
      layout={layout}
      origin={origin}
      opacity={opacity}
      showCastlePad={showCastlePad}
      showTrees={false}
      selectedTileKey={selectedTileKey}
      onSelectTile={onSelectTile}
    />
  );
}

export default function PlayScene() {
  const layout = useWorldLayout();
  const registryRef = useRef(new GlobalTileRegistry());
  const [spawnedLevels, setSpawnedLevels] = useState<PlacedLevel[]>([]);
  const [selectedGrassTile, setSelectedGrassTile] =
    useState<GlobalGridCoord | null>(null);
  const [towers, setTowers] = useState<PlacedTower[]>([]);
  const [enemies, setEnemies] = useState<PlacedEnemy[]>([]);
  const [projectiles, setProjectiles] = useState<FiredProjectile[]>([]);
  const nextChunkId = useRef(0);
  const nextTowerId = useRef(0);
  const nextEnemyId = useRef(0);
  const enemyPositionsRef = useRef(new Map<number, [number, number, number]>());
  const pendingTargetIdsRef = useRef(new Set<number>());

  const selectedTileKey = selectedGrassTile
    ? globalCoordKey(selectedGrassTile.gx, selectedGrassTile.gz)
    : null;

  const selectedTower = useMemo(() => {
    if (!selectedGrassTile) {
      return null;
    }

    return (
      towers.find(
        (tower) =>
          tower.gx === selectedGrassTile.gx && tower.gz === selectedGrassTile.gz,
      ) ?? null
    );
  }, [selectedGrassTile, towers]);

  const selectedTowerStats = useMemo(
    () => (selectedTower ? getTowerStats(selectedTower.typeId) : null),
    [selectedTower],
  );

  function handleSelectGrassTile(coord: GlobalGridCoord) {
    const isDeselect =
      selectedGrassTile?.gx === coord.gx && selectedGrassTile?.gz === coord.gz;
    const hasTower = towers.some(
      (tower) => tower.gx === coord.gx && tower.gz === coord.gz,
    );

    setSelectedGrassTile(isDeselect ? null : coord);

    if (!isDeselect && !hasTower) {
      setTowers((current) => {
        const id = nextTowerId.current;
        nextTowerId.current += 1;
        return [...current, { id, gx: coord.gx, gz: coord.gz, typeId: DEFAULT_TOWER_TYPE }];
      });
    }
  }

  const mainOrigin = useMemo(() => centeredChunkOrigin(layout), [layout]);

  const currentLevel = useMemo(() => {
    if (spawnedLevels.length === 0) {
      return { layout, origin: mainOrigin };
    }

    const latest = spawnedLevels[spawnedLevels.length - 1]!;
    return { layout: latest.layout, origin: latest.origin };
  }, [layout, mainOrigin, spawnedLevels]);

  const currentEnemyPath = useMemo(
    () => getLayoutWorldPath(currentLevel.layout, currentLevel.origin),
    [currentLevel],
  );

  function handleSpawnEnemy() {
    if (!currentEnemyPath || currentEnemyPath.length < 2) {
      return;
    }

    const id = nextEnemyId.current;
    nextEnemyId.current += 1;
    setEnemies((current) => [
      ...current,
      {
        id,
        path: currentEnemyPath,
        hp: DEFAULT_ENEMY_HP,
        maxHp: DEFAULT_ENEMY_HP,
      },
    ]);
  }

  function handleEnemyReachExit(enemyId: number) {
    pendingTargetIdsRef.current.delete(enemyId);
    enemyPositionsRef.current.delete(enemyId);
    setProjectiles((current) =>
      current.filter((projectile) => projectile.targetEnemyId !== enemyId),
    );
    setEnemies((current) => current.filter((enemy) => enemy.id !== enemyId));
  }

  const handleFireProjectile = useCallback((projectile: FiredProjectile) => {
    pendingTargetIdsRef.current.add(projectile.targetEnemyId);
    setProjectiles((current) => [...current, projectile]);
  }, []);

  function handleProjectileHit(projectile: FiredProjectile) {
    const hitEnemyIds = getEnemiesInAoe(
      projectile.to[0],
      projectile.to[2],
      projectile.aoeTiles,
      enemyPositionsRef.current,
      projectile.targetEnemyId,
    );

    pendingTargetIdsRef.current.delete(projectile.targetEnemyId);

    setProjectiles((current) =>
      current.filter((entry) => entry.id !== projectile.id),
    );

    setEnemies((current) => {
      const nextEnemies: PlacedEnemy[] = [];

      for (const enemy of current) {
        if (!hitEnemyIds.includes(enemy.id)) {
          nextEnemies.push(enemy);
          continue;
        }

        const nextHp = enemy.hp - projectile.damage;

        if (nextHp > 0) {
          nextEnemies.push({ ...enemy, hp: nextHp });
          continue;
        }

        pendingTargetIdsRef.current.delete(enemy.id);
        enemyPositionsRef.current.delete(enemy.id);
      }

      return nextEnemies;
    });
  }

  const seamGrassGroups = useMemo(() => {
    const levels = [
      { layout, origin: mainOrigin },
      ...spawnedLevels.map(({ layout: chunkLayout, origin }) => ({
        layout: chunkLayout,
        origin,
      })),
    ];
    const tileGroups = getSeamGrassTileGroups(levels);

    return tileGroups
      .map((tiles, pairIndex) => {
        const childLevelIndex = pairIndex + 1;
        const isLatestSpawned =
          childLevelIndex === levels.length - 1 && spawnedLevels.length > 0;

        return {
          tiles,
          opacity: isLatestSpawned ? PREVIEW_LEVEL_OPACITY : 1,
        };
      })
      .filter((group) => group.tiles.length > 0);
  }, [layout, mainOrigin, spawnedLevels]);

  useEffect(() => {
    registryRef.current.reset();
    registryRef.current.claimLayout(mainOrigin, layout, 0);
    setSpawnedLevels([]);
    setSelectedGrassTile(null);
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    enemyPositionsRef.current.clear();
    pendingTargetIdsRef.current.clear();
    nextChunkId.current = 0;
    nextTowerId.current = 0;
    nextEnemyId.current = 0;
  }, [layout, mainOrigin]);

  const castleWorld = globalTileWorldPosition(
    mainOrigin.gx + layout.castle.x,
    mainOrigin.gz + layout.castle.z,
  );

  function handleSpawn() {
    const parent =
      spawnedLevels.length === 0
        ? { layout, origin: mainOrigin }
        : spawnedLevels[spawnedLevels.length - 1]!;

    const connectionGlobal = localToGlobal(parent.layout.entrance, parent.origin);
    const sharedKey = globalCoordKey(connectionGlobal.gx, connectionGlobal.gz);

    const { blockLeft, blockRight } = getSpawnTurnBlocks(
      spawnedLevels.map((level) => level.spawnTurn),
    );
    const spawnTurn = pickPreviewSpawnTurn(parent.layout, {
      blockLeft,
      blockRight,
    });
    const entranceEdge = getEntranceEdgeForSpawnTurn(parent.layout, spawnTurn);

    for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt += 1) {
      const newLayout = generatePreviewWorldLayout(parent.layout, {
        entranceEdge,
      });
      const origin = computeChunkOrigin(connectionGlobal, newLayout.exit);

      if (
        !registryRef.current.canPlaceLayout(origin, newLayout, new Set([sharedKey]))
      ) {
        continue;
      }

      const id = nextChunkId.current;
      nextChunkId.current += 1;

      registryRef.current.claimLayout(
        origin,
        newLayout,
        id,
        new Set([sharedKey]),
      );

      const newLevel = {
        id,
        layout: newLayout,
        origin,
        spawnTurn: getLayoutSpawnTurn(newLayout),
      };

      setSpawnedLevels((current) => [...current, newLevel]);
      return;
    }
  }

  return (
    <div className="relative h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [13, 16, 13], fov: 45 }}>
        <color attach="background" args={["#0b1220"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 16, 8]} intensity={1.4} />
        {spawnedLevels.map((chunk, index) => (
          <group key={chunk.id}>
            <LevelChunk
              layout={chunk.layout}
              origin={chunk.origin}
              opacity={index === spawnedLevels.length - 1 ? PREVIEW_LEVEL_OPACITY : 1}
              selectedTileKey={selectedTileKey}
              onSelectTile={handleSelectGrassTile}
            />
            <LevelDirectionArrow layout={chunk.layout} origin={chunk.origin} />
          </group>
        ))}
        <LevelChunk
          layout={layout}
          origin={mainOrigin}
          showCastlePad
          selectedTileKey={selectedTileKey}
          onSelectTile={handleSelectGrassTile}
        />
        {seamGrassGroups.map((group, index) => (
          <GrassTiles
            key={`seam-${index}`}
            tiles={group.tiles}
            opacity={group.opacity}
            selectedTileKey={selectedTileKey}
            onSelectTile={handleSelectGrassTile}
          />
        ))}
        {enemies.map((enemy) => (
          <EnemyWalker
            key={enemy.id}
            path={enemy.path}
            onReachExit={() => handleEnemyReachExit(enemy.id)}
            onPositionUpdate={(position) => {
              enemyPositionsRef.current.set(enemy.id, position);
            }}
          />
        ))}
        <TowerDefenseSystem
          towers={towers}
          enemyPositionsRef={enemyPositionsRef}
          pendingTargetIdsRef={pendingTargetIdsRef}
          enemyIds={enemies.map((enemy) => enemy.id)}
          onFireProjectile={handleFireProjectile}
        />
        {projectiles.map((projectile) => (
          <Projectile
            key={projectile.id}
            from={projectile.from}
            to={projectile.to}
            speed={projectile.speed}
            onHit={() => handleProjectileHit(projectile)}
          />
        ))}
        {selectedTower && selectedTowerStats ? (
          <TowerAttackRadiusPreview
            gx={selectedTower.gx}
            gz={selectedTower.gz}
            attackRangeTiles={selectedTowerStats.attackRangeTiles}
          />
        ) : null}
        {towers.map((tower) => {
          const { x, z } = globalTileWorldPosition(tower.gx, tower.gz);

          return (
            <TowerModel key={tower.id} position={[x, 0, z]} />
          );
        })}
        <CastleModel position={[castleWorld.x, 0, castleWorld.z]} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
          target={[0, 0, 0]}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
          <Button size="lg" className="min-w-32" onClick={handleSpawn}>
            Spawn{spawnedLevels.length > 0 ? ` (${spawnedLevels.length})` : ""}
          </Button>
          <Button size="lg" variant="secondary" className="min-w-32" onClick={handleSpawnEnemy}>
            Spawn Enemy
          </Button>
        </div>
      </div>
    </div>
  );
}
