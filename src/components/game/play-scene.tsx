"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { EnemyWalker } from "@/components/game/enemy-walker";
import { EdgeGateMenu, EDGE_GATE_COST, type EdgeGateMenuState } from "@/components/game/edge-gate-menu";
import { EdgeGateModel } from "@/components/game/edge-gate-model";
import {
  FarmPlaceMenu,
  type FarmPlaceMenuState,
} from "@/components/game/farm-place-menu";
import { FogOfWarClouds } from "@/components/game/fog-of-war-clouds";
import { Projectile } from "@/components/game/projectile";
import { CastleModel, TowerModel } from "@/components/game/models";
import {
  GrassGround,
  GrassTiles,
  type GrassSelectionProps,
  type GrassTilePointer,
} from "@/components/game/ground-plane";
import { LevelDirectionArrow } from "@/components/game/level-direction-arrow";
import {
  ObstacleClearMenu,
  type ObstacleClearMenuState,
} from "@/components/game/obstacle-clear-menu";
import { ResourcesHud } from "@/components/game/resources-hud";
import { Terrain } from "@/components/game/terrain";
import { TowerAttackRadiusPreview } from "@/components/game/tower-attack-radius-preview";
import { TowerPlaceMenu, type TowerPlaceMenuState } from "@/components/game/tower-place-menu";
import { LevelHud } from "@/components/game/level-hud";
import { useRegisterPlayDebugToolbar } from "@/components/game/play-debug-toolbar";
import { usePlayPerfFlags } from "@/components/game/play-perf-toggles";
import {
  TowerDefenseSystem,
  type FiredProjectile,
  type PlacedTower,
} from "@/components/game/tower-defense-system";
import {
  centeredChunkOrigin,
  computeChunkOrigin,
  globalCoordKey,
  GlobalTileRegistry,
  globalTileWorldPosition,
  getChainedWorldPath,
  getSeamGrassTileGroups,
  localToGlobal,
  type ChunkOrigin,
  type GlobalGridCoord,
} from "@/lib/global-grid";
import { getEnemiesInAoe, getEffectiveAttackRangeTiles } from "@/lib/tower-combat";
import {
  computeDamageTaken,
  ENEMY_TYPE_IDS,
  getEnemyStats,
  type EnemyTypeId,
} from "@/lib/enemy-types";
import {
  BUILD_PLOT_SIZE,
  collectBuildPlotTiles,
  computeBuildPlotOrigin,
  FARM_COST,
  FARM_INCOME,
  FARM_INTERVAL_MS,
  hasFarmAt,
  pickFertileDirtTile,
  type BuildPlot,
} from "@/lib/fertile-farm";
import {
  GOLD_MINE_INCOME,
  GOLD_MINE_INTERVAL_MS,
  IRON_MINE_INCOME,
  IRON_MINE_INTERVAL_MS,
  pickGoldMineTile,
  pickIronMineTile,
  STARTING_IRON,
} from "@/lib/gold-mine";
import { hillVariant } from "@/components/game/models";
import {
  ROCK_CLEAR_COST,
  ROCK_CLEAR_STONE,
  STARTING_FOOD,
  STARTING_STONE,
  STARTING_WOOD,
  TREE_CLEAR_COST,
  TREE_CLEAR_WOOD,
} from "@/lib/resources";
import { collectHillTiles, generateTerrainDecor } from "@/lib/terrain-decor";
import { getTowerStats, STARTING_GOLD, type TowerTypeId } from "@/lib/tower-types";
import {
  ENABLE_MAIN_MULTI_PATH,
  generateForkPreviewWorldLayout,
  generatePreviewWorldLayout,
  generateWorldLayout,
  getEdgeGateTile,
  getEntranceEdgeForSpawnTurn,
  getLayoutSpawnTurn,
  getSpawnTurnBlocks,
  getUnusedEntranceEdges,
  isForkSpawnLevel,
  pickPreviewSpawnTurn,
  type GridCoord,
  type LevelEdge,
  type SpawnTurn,
  type WorldLayout,
} from "@/lib/world-layout";

const MAX_SPAWN_ATTEMPTS = 64;

const PREVIEW_LEVEL_OPACITY = 0.5;
const AUTO_SPAWN_INTERVAL_MS = 1200;

type PlacedLevel = {
  id: number;
  layout: WorldLayout;
  origin: ChunkOrigin;
  spawnTurn: SpawnTurn;
};

type PlacedEnemy = {
  id: number;
  typeId: EnemyTypeId;
  path: [number, number, number][];
  hp: number;
  maxHp: number;
  dying?: boolean;
};

type ObstacleKind = "tree" | "rock";

function LevelChunk({
  layout,
  origin,
  opacity = 1,
  revealedPathCount,
  showCastlePad = false,
  showDecor = true,
  showMountains = true,
  showGrass = true,
  goldMine = null,
  ironMine = null,
  fertileDirt = null,
  hasFarm = false,
  clearedObstacleKeys,
  selectedTileKey,
  onSelectTile,
}: {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  revealedPathCount?: number;
  showCastlePad?: boolean;
  showDecor?: boolean;
  showMountains?: boolean;
  showGrass?: boolean;
  goldMine?: GridCoord | null;
  ironMine?: GridCoord | null;
  fertileDirt?: GridCoord | null;
  hasFarm?: boolean;
  clearedObstacleKeys?: ReadonlySet<string>;
} & GrassSelectionProps) {
  return (
    <Terrain
      layout={layout}
      origin={origin}
      opacity={opacity}
      revealedPathCount={revealedPathCount}
      showCastlePad={showCastlePad}
      showDecor={showDecor}
      showMountains={showMountains}
      showGrass={showGrass}
      goldMine={goldMine}
      ironMine={ironMine}
      fertileDirt={fertileDirt}
      hasFarm={hasFarm}
      clearedObstacleKeys={clearedObstacleKeys}
      selectedTileKey={selectedTileKey}
      onSelectTile={onSelectTile}
    />
  );
}

function menuPointer(
  pointer: GrassTilePointer,
  container: HTMLDivElement | null,
) {
  const rect = container?.getBoundingClientRect();
  return {
    clientX: pointer.clientX - (rect?.left ?? 0),
    clientY: pointer.clientY - (rect?.top ?? 0),
  };
}

/** When disabled, mouse picks hit nothing (OrbitControls still work). */
function SceneRaycastGate({ enabled }: { enabled: boolean }) {
  const raycaster = useThree((state) => state.raycaster);

  useLayoutEffect(() => {
    if (enabled) {
      raycaster.layers.enableAll();
    } else {
      // Unused layer — meshes stay on default layer 0, so picks are empty.
      raycaster.layers.set(31);
    }
  }, [enabled, raycaster]);

  return null;
}

/** Orbit target stays on the ground plane (y = 0). */
function GroundOrbitControls({
  maxPolarAngle,
  minPolarAngle,
}: {
  maxPolarAngle?: number;
  minPolarAngle?: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && controls.target.y !== 0) {
      controls.target.y = 0;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={maxPolarAngle}
      minPolarAngle={minPolarAngle}
      target={[0, 0, 0]}
      screenSpacePanning={false}
    />
  );
}

export default function PlayScene() {
  const perf = usePlayPerfFlags();
  const [mainLayout, setMainLayout] = useState(() => generateWorldLayout());
  const [revealedPathCount, setRevealedPathCount] = useState(
    ENABLE_MAIN_MULTI_PATH ? 0 : 1,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const registryRef = useRef(new GlobalTileRegistry());
  const [spawnedLevels, setSpawnedLevels] = useState<PlacedLevel[]>([]);
  /** 0 = main grid; N = enemies spawn from spawnedLevels[N - 1] entrance. */
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [selectedGrassTile, setSelectedGrassTile] =
    useState<GlobalGridCoord | null>(null);
  const [towers, setTowers] = useState<PlacedTower[]>([]);
  const [towerPlaceMenu, setTowerPlaceMenu] =
    useState<TowerPlaceMenuState | null>(null);
  const [edgeGateMenu, setEdgeGateMenu] = useState<EdgeGateMenuState | null>(
    null,
  );
  const [farmPlaceMenu, setFarmPlaceMenu] = useState<FarmPlaceMenuState | null>(
    null,
  );
  const [obstacleClearMenu, setObstacleClearMenu] =
    useState<ObstacleClearMenuState | null>(null);
  const [farms, setFarms] = useState<{ gx: number; gz: number }[]>([]);
  const [unlockedBuildEdges, setUnlockedBuildEdges] = useState<LevelEdge[]>([]);
  const [buildPlots, setBuildPlots] = useState<BuildPlot[]>([]);
  const [clearedObstacleKeys, setClearedObstacleKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [enemies, setEnemies] = useState<PlacedEnemy[]>([]);
  const [projectiles, setProjectiles] = useState<FiredProjectile[]>([]);
  const [autoSpawnEnemies, setAutoSpawnEnemies] = useState(true);
  const [gold, setGold] = useState(STARTING_GOLD);
  const [iron, setIron] = useState(STARTING_IRON);
  const [wood, setWood] = useState(STARTING_WOOD);
  const [stone, setStone] = useState(STARTING_STONE);
  const [food, setFood] = useState(STARTING_FOOD);
  const nextChunkId = useRef(0);
  const nextTowerId = useRef(0);
  const nextEnemyId = useRef(0);
  const nextBuildPlotId = useRef(0);
  const enemyPositionsRef = useRef(new Map<number, [number, number, number]>());
  const pendingTargetIdsRef = useRef(new Set<number>());

  const selectedTileKey = selectedGrassTile
    ? globalCoordKey(selectedGrassTile.gx, selectedGrassTile.gz)
    : null;

  const mainOrigin = useMemo(() => centeredChunkOrigin(mainLayout), [mainLayout]);

  const goldMineTile = useMemo(
    () => pickGoldMineTile(mainLayout),
    [mainLayout],
  );

  const ironMineTile = useMemo(
    () => pickIronMineTile(mainLayout, goldMineTile),
    [mainLayout, goldMineTile],
  );

  const fertileDirtTile = useMemo(() => {
    const blocked: GridCoord[] = [];
    if (goldMineTile) {
      blocked.push(goldMineTile);
    }
    if (ironMineTile) {
      blocked.push(ironMineTile);
    }
    return pickFertileDirtTile(mainLayout, blocked);
  }, [mainLayout, goldMineTile, ironMineTile]);

  const hasMainFarm = useMemo(() => {
    if (!fertileDirtTile) {
      return false;
    }

    return hasFarmAt(
      farms,
      mainOrigin.gx + fertileDirtTile.x,
      mainOrigin.gz + fertileDirtTile.z,
    );
  }, [farms, fertileDirtTile, mainOrigin]);

  const obstacleByKey = useMemo(() => {
    const map = new Map<string, ObstacleKind>();
    const blocked: GridCoord[] = [];
    if (goldMineTile) {
      blocked.push(goldMineTile);
    }
    if (ironMineTile) {
      blocked.push(ironMineTile);
    }
    if (fertileDirtTile) {
      blocked.push(fertileDirtTile);
    }

    const addDecor = (
      layout: WorldLayout,
      origin: ChunkOrigin,
      blockedTiles?: GridCoord[],
    ) => {
      for (const placement of generateTerrainDecor(layout, {
        blockedTiles,
      })) {
        if (placement.kind !== "tree" && placement.kind !== "rock") {
          continue;
        }

        const key = globalCoordKey(
          origin.gx + placement.x,
          origin.gz + placement.z,
        );
        if (clearedObstacleKeys.has(key)) {
          continue;
        }

        map.set(key, placement.kind);
      }
    };

    addDecor(
      mainLayout,
      mainOrigin,
      blocked.length > 0 ? blocked : undefined,
    );
    for (const level of spawnedLevels) {
      addDecor(level.layout, level.origin);
    }

    return map;
  }, [
    mainLayout,
    mainOrigin,
    goldMineTile,
    ironMineTile,
    fertileDirtTile,
    spawnedLevels,
    clearedObstacleKeys,
  ]);

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

  const selectedTowerAttackRangeTiles = useMemo(() => {
    if (!selectedTower || !selectedTowerStats) {
      return null;
    }

    return getEffectiveAttackRangeTiles(
      selectedTowerStats,
      !!selectedTower.onHill,
    );
  }, [selectedTower, selectedTowerStats]);

  function closeAllMenus() {
    setTowerPlaceMenu(null);
    setEdgeGateMenu(null);
    setFarmPlaceMenu(null);
    setObstacleClearMenu(null);
  }

  function handleSelectGrassTile(
    coord: GlobalGridCoord,
    pointer: GrassTilePointer,
  ) {
    const onGoldMine =
      goldMineTile &&
      coord.gx === mainOrigin.gx + goldMineTile.x &&
      coord.gz === mainOrigin.gz + goldMineTile.z;
    const onIronMine =
      ironMineTile &&
      coord.gx === mainOrigin.gx + ironMineTile.x &&
      coord.gz === mainOrigin.gz + ironMineTile.z;
    const onFertile =
      fertileDirtTile &&
      coord.gx === mainOrigin.gx + fertileDirtTile.x &&
      coord.gz === mainOrigin.gz + fertileDirtTile.z;

    if (onGoldMine || onIronMine) {
      closeAllMenus();
      setSelectedGrassTile(null);
      return;
    }

    if (onFertile) {
      closeAllMenus();
      setSelectedGrassTile(coord);

      if (hasFarmAt(farms, coord.gx, coord.gz)) {
        return;
      }

      const pos = menuPointer(pointer, containerRef.current);
      setFarmPlaceMenu({
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    const obstacle = obstacleByKey.get(globalCoordKey(coord.gx, coord.gz));
    if (obstacle) {
      closeAllMenus();
      setSelectedGrassTile(coord);
      const pos = menuPointer(pointer, containerRef.current);
      setObstacleClearMenu({
        kind: obstacle,
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    const hasTower = towers.some(
      (tower) => tower.gx === coord.gx && tower.gz === coord.gz,
    );

    if (hasTower) {
      closeAllMenus();
      const isDeselect =
        selectedGrassTile?.gx === coord.gx && selectedGrassTile?.gz === coord.gz;
      setSelectedGrassTile(isDeselect ? null : coord);
      return;
    }

    setSelectedGrassTile(coord);
    closeAllMenus();
    const pos = menuPointer(pointer, containerRef.current);
    setTowerPlaceMenu({
      gx: coord.gx,
      gz: coord.gz,
      clientX: pos.clientX,
      clientY: pos.clientY,
    });
  }

  function handlePlaceTowerFromMenu(typeId: TowerTypeId) {
    if (!towerPlaceMenu) {
      return;
    }

    const { gx, gz } = towerPlaceMenu;
    const alreadyOccupied = towers.some(
      (tower) => tower.gx === gx && tower.gz === gz,
    );
    const cost = getTowerStats(typeId).cost;

    if (!alreadyOccupied) {
      if (gold < cost) {
        return;
      }

      if (obstacleByKey.has(globalCoordKey(gx, gz))) {
        return;
      }

      const onFertile =
        fertileDirtTile &&
        gx === mainOrigin.gx + fertileDirtTile.x &&
        gz === mainOrigin.gz + fertileDirtTile.z;
      if (onFertile) {
        return;
      }

      const id = nextTowerId.current;
      nextTowerId.current += 1;
      const hill = hillTilesByKey.get(globalCoordKey(gx, gz));
      setGold((current) => current - cost);
      setTowers((current) => [
        ...current,
        {
          id,
          gx,
          gz,
          typeId,
          onHill: !!hill,
          groundY: hill?.height ?? 0,
        },
      ]);
    }

    setSelectedGrassTile({ gx, gz });
    setTowerPlaceMenu(null);
  }

  function handleBuildFarm() {
    if (!farmPlaceMenu || !fertileDirtTile) {
      return;
    }

    if (gold < FARM_COST) {
      return;
    }

    const { gx, gz } = farmPlaceMenu;
    if (hasFarmAt(farms, gx, gz)) {
      return;
    }

    setGold((current) => current - FARM_COST);
    setFarms((current) => [...current, { gx, gz }]);
    setFarmPlaceMenu(null);
    setSelectedGrassTile({ gx, gz });
  }

  function handleClearObstacle() {
    if (!obstacleClearMenu) {
      return;
    }

    const { kind, gx, gz } = obstacleClearMenu;
    const cost = kind === "tree" ? TREE_CLEAR_COST : ROCK_CLEAR_COST;

    if (gold < cost) {
      return;
    }

    const key = globalCoordKey(gx, gz);
    setGold((current) => current - cost);
    if (kind === "tree") {
      setWood((current) => current + TREE_CLEAR_WOOD);
    } else {
      setStone((current) => current + ROCK_CLEAR_STONE);
    }
    setClearedObstacleKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    setObstacleClearMenu(null);
    setSelectedGrassTile({ gx, gz });
  }

  const hillTilesByKey = useMemo(() => {
    const map = new Map<string, { height: number }>();
    const blockedSpecialTiles: GridCoord[] = [];
    if (goldMineTile) {
      blockedSpecialTiles.push(goldMineTile);
    }
    if (ironMineTile) {
      blockedSpecialTiles.push(ironMineTile);
    }
    if (fertileDirtTile) {
      blockedSpecialTiles.push(fertileDirtTile);
    }

    const addHills = (
      layout: WorldLayout,
      origin: ChunkOrigin,
      blockedTiles?: GridCoord[],
    ) => {
      for (const tile of collectHillTiles(layout, { blockedTiles })) {
        const key = globalCoordKey(origin.gx + tile.x, origin.gz + tile.z);
        map.set(key, { height: hillVariant(tile.x, tile.z).height });
      }
    };

    addHills(
      mainLayout,
      mainOrigin,
      blockedSpecialTiles.length > 0 ? blockedSpecialTiles : undefined,
    );
    for (const level of spawnedLevels) {
      addHills(level.layout, level.origin);
    }

    return map;
  }, [
    mainLayout,
    mainOrigin,
    goldMineTile,
    ironMineTile,
    fertileDirtTile,
    spawnedLevels,
  ]);

  const unusedEdgeGates = useMemo(() => {
    const unlocked = new Set(unlockedBuildEdges);
    return getUnusedEntranceEdges(mainLayout)
      .filter((edge) => !unlocked.has(edge))
      .map((edge) => {
        const tile = getEdgeGateTile(edge, mainLayout.size);
        const { x, z } = globalTileWorldPosition(
          mainOrigin.gx + tile.x,
          mainOrigin.gz + tile.z,
        );

        return { edge, tile, position: [x, 0, z] as [number, number, number] };
      });
  }, [mainLayout, mainOrigin, unlockedBuildEdges]);

  const buildPlotFogTiles = useMemo(
    () => buildPlots.flatMap((plot) => collectBuildPlotTiles(plot)),
    [buildPlots],
  );

  /** Full chain: main first, then spawned levels in order. */
  const levelChain = useMemo(
    () => [
      { layout: mainLayout, origin: mainOrigin },
      ...spawnedLevels.map(({ layout, origin }) => ({ layout, origin })),
    ],
    [mainLayout, mainOrigin, spawnedLevels],
  );

  /** Active combat level index into `levelChain` (clamped). */
  const combatLevelIndex = Math.min(
    activeLevelIndex,
    Math.max(0, levelChain.length - 1),
  );

  function handleSpawnEnemy(typeId: EnemyTypeId) {
    const combatLevel = levelChain[combatLevelIndex];
    if (!combatLevel) {
      return;
    }

    const pathCount =
      combatLevelIndex === 0 && ENABLE_MAIN_MULTI_PATH
        ? revealedPathCount
        : combatLevel.layout.paths.length;

    if (pathCount < 1) {
      return;
    }

    const pathIndex = Math.floor(Math.random() * pathCount);
    const path = getChainedWorldPath(
      levelChain,
      combatLevelIndex,
      0.12,
      pathIndex,
    );

    if (!path || path.length < 2) {
      return;
    }

    const stats = getEnemyStats(typeId);
    const id = nextEnemyId.current;
    nextEnemyId.current += 1;
    setEnemies((current) => [
      ...current,
      {
        id,
        typeId: stats.id,
        path,
        hp: stats.health,
        maxHp: stats.health,
      },
    ]);
  }

  const handleSpawnEnemyRef = useRef(handleSpawnEnemy);
  handleSpawnEnemyRef.current = handleSpawnEnemy;

  useEffect(() => {
    if (!goldMineTile) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setGold((current) => current + GOLD_MINE_INCOME);
    }, GOLD_MINE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [goldMineTile]);

  useEffect(() => {
    if (!ironMineTile) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIron((current) => current + IRON_MINE_INCOME);
    }, IRON_MINE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [ironMineTile]);

  useEffect(() => {
    if (farms.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFood((current) => current + FARM_INCOME * farms.length);
    }, FARM_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [farms]);

  useEffect(() => {
    if (!autoSpawnEnemies) {
      return;
    }

    const spawnRandomEnemy = () => {
      const typeId =
        ENEMY_TYPE_IDS[Math.floor(Math.random() * ENEMY_TYPE_IDS.length)]!;
      handleSpawnEnemyRef.current(typeId);
    };

    spawnRandomEnemy();
    const intervalId = window.setInterval(
      spawnRandomEnemy,
      AUTO_SPAWN_INTERVAL_MS,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoSpawnEnemies]);

  function handleEnemyReachExit(enemyId: number) {
    pendingTargetIdsRef.current.delete(enemyId);
    enemyPositionsRef.current.delete(enemyId);
    setProjectiles((current) =>
      current.filter((projectile) => projectile.targetEnemyId !== enemyId),
    );
    setEnemies((current) => current.filter((enemy) => enemy.id !== enemyId));
  }

  function handleEnemyDeathComplete(enemyId: number) {
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
      let goldEarned = 0;

      for (const enemy of current) {
        if (enemy.dying) {
          nextEnemies.push(enemy);
          continue;
        }

        if (!hitEnemyIds.includes(enemy.id)) {
          nextEnemies.push(enemy);
          continue;
        }

        const stats = getEnemyStats(enemy.typeId);
        const finalDamage = computeDamageTaken(
          stats,
          projectile.damage,
          projectile.damageType,
        );
        const nextHp = enemy.hp - finalDamage;

        if (nextHp > 0) {
          nextEnemies.push({ ...enemy, hp: nextHp });
          continue;
        }

        goldEarned += stats.goldReward;
        pendingTargetIdsRef.current.delete(enemy.id);
        enemyPositionsRef.current.delete(enemy.id);
        nextEnemies.push({ ...enemy, hp: 0, dying: true });
      }

      if (goldEarned > 0) {
        queueMicrotask(() => {
          setGold((current) => current + goldEarned);
        });
      }

      return nextEnemies;
    });
  }

  const seamGrassGroups = useMemo(() => {
    const levels = [
      { layout: mainLayout, origin: mainOrigin },
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
  }, [mainLayout, mainOrigin, spawnedLevels]);

  const fogLevels = useMemo(
    () => [
      { layout: mainLayout, origin: mainOrigin },
      ...spawnedLevels.map(({ layout, origin }) => ({ layout, origin })),
    ],
    [mainLayout, mainOrigin, spawnedLevels],
  );

  const fogSeamTiles = useMemo(
    () => seamGrassGroups.flatMap((group) => group.tiles),
    [seamGrassGroups],
  );

  function tryCreateNextLevel(
    existingLevels: PlacedLevel[],
  ): PlacedLevel | null {
    const parent =
      existingLevels.length === 0
        ? { layout: mainLayout, origin: mainOrigin }
        : existingLevels[existingLevels.length - 1]!;

    const connectionGlobal = localToGlobal(parent.layout.entrance, parent.origin);
    const sharedKey = globalCoordKey(connectionGlobal.gx, connectionGlobal.gz);

    const { blockLeft, blockRight } = getSpawnTurnBlocks(
      existingLevels.map((level) => level.spawnTurn),
    );
    const spawnTurn = pickPreviewSpawnTurn(parent.layout, {
      blockLeft,
      blockRight,
    });
    const entranceEdge = getEntranceEdgeForSpawnTurn(parent.layout, spawnTurn);
    const nextLevelNumber = existingLevels.length + 2;
    const useForkLayout = isForkSpawnLevel(nextLevelNumber);

    for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt += 1) {
      const newLayout = useForkLayout
        ? generateForkPreviewWorldLayout(parent.layout, { entranceEdge })
        : generatePreviewWorldLayout(parent.layout, { entranceEdge });
      const origin = computeChunkOrigin(connectionGlobal, newLayout.exit);

      if (
        !registryRef.current.canPlaceLayout(
          origin,
          newLayout,
          new Set([sharedKey]),
        )
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

      return {
        id,
        layout: newLayout,
        origin,
        spawnTurn: getLayoutSpawnTurn(newLayout),
      };
    }

    return null;
  }

  useEffect(() => {
    registryRef.current.reset();
    registryRef.current.claimLayout(mainOrigin, mainLayout, 0);
    setSpawnedLevels([]);
    setActiveLevelIndex(0);
    setRevealedPathCount(ENABLE_MAIN_MULTI_PATH ? 0 : 1);
    setSelectedGrassTile(null);
    closeAllMenus();
    setTowers([]);
    setFarms([]);
    setUnlockedBuildEdges([]);
    setBuildPlots([]);
    setClearedObstacleKeys(new Set());
    setEnemies([]);
    setProjectiles([]);
    setAutoSpawnEnemies(true);
    setGold(STARTING_GOLD);
    setIron(STARTING_IRON);
    setWood(STARTING_WOOD);
    setStone(STARTING_STONE);
    setFood(STARTING_FOOD);
    enemyPositionsRef.current.clear();
    pendingTargetIdsRef.current.clear();
    nextChunkId.current = 0;
    nextTowerId.current = 0;
    nextEnemyId.current = 0;
    nextBuildPlotId.current = 0;

    const preview = tryCreateNextLevel([]);
    setSpawnedLevels(preview ? [preview] : []);
    // Mount-only: start on main with the next level already previewing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    registryRef.current.claimLayout(mainOrigin, mainLayout, 0);
  }, [mainLayout, mainOrigin]);

  const castleWorld = globalTileWorldPosition(
    mainOrigin.gx + mainLayout.castle.x,
    mainOrigin.gz + mainLayout.castle.z,
  );

  function handleAddPath() {
    setRevealedPathCount((current) =>
      Math.min(current + 1, mainLayout.paths.length),
    );
  }

  function handleEdgeGateClick(
    edge: LevelEdge,
    pointer: { clientX: number; clientY: number },
  ) {
    closeAllMenus();
    setSelectedGrassTile(null);
    const pos = menuPointer(pointer, containerRef.current);
    setEdgeGateMenu({
      edge,
      clientX: pos.clientX,
      clientY: pos.clientY,
    });
  }

  function handleUnlockEdgeGate(edge: LevelEdge) {
    if (gold < EDGE_GATE_COST) {
      return;
    }

    if (unlockedBuildEdges.includes(edge)) {
      return;
    }

    const origin = computeBuildPlotOrigin(edge, mainOrigin, mainLayout.size);
    const id = nextBuildPlotId.current;
    nextBuildPlotId.current += 1;

    setGold((current) => current - EDGE_GATE_COST);
    setUnlockedBuildEdges((current) => [...current, edge]);
    setBuildPlots((current) => [
      ...current,
      { id, edge, origin, size: BUILD_PLOT_SIZE },
    ]);
    setEdgeGateMenu(null);
  }

  function handleSpawn() {
    // Begin the current preview (enemies use its entrance), then queue another preview.
    // IMPORTANT: create/claim outside setState — updaters may run twice in Strict Mode.
    const beginIndex = spawnedLevels.length;
    const next = tryCreateNextLevel(spawnedLevels);
    if (next) {
      setSpawnedLevels((current) => [...current, next]);
    }
    if (beginIndex > 0) {
      setActiveLevelIndex(beginIndex);
    }
  }

  useRegisterPlayDebugToolbar(
    {
      spawnedLevelCount: spawnedLevels.length,
      showAddPath: ENABLE_MAIN_MULTI_PATH,
      addPathDisabled: revealedPathCount >= mainLayout.paths.length,
      autoSpawnEnemies,
    },
    {
      onSpawnLevel: handleSpawn,
      onAddPath: handleAddPath,
      onSpawnGrunt: () => handleSpawnEnemy("grunt"),
      onSpawnFlyer: () => handleSpawnEnemy("flyer"),
      onToggleAutoSpawn: () => setAutoSpawnEnemies((current) => !current),
    },
  );

  const obstacleClearCost =
    obstacleClearMenu?.kind === "rock" ? ROCK_CLEAR_COST : TREE_CLEAR_COST;
  const obstacleYieldLabel =
    obstacleClearMenu?.kind === "rock"
      ? `+${ROCK_CLEAR_STONE} stone`
      : `+${TREE_CLEAR_WOOD} wood`;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [13, 16, 13], fov: 45 }}>
        <SceneRaycastGate enabled={perf.raycast} />
        <color attach="background" args={["#0b1220"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 16, 8]} intensity={1.4} />
        {perf.previewLevels
          ? spawnedLevels.map((chunk, index) => {
              const isNextPreview = index === spawnedLevels.length - 1;

              return (
                <group key={chunk.id}>
                  <LevelChunk
                    layout={chunk.layout}
                    origin={chunk.origin}
                    opacity={isNextPreview ? PREVIEW_LEVEL_OPACITY : 1}
                    showDecor={perf.decor}
                    showMountains={perf.mountains}
                    showGrass={perf.grass}
                    clearedObstacleKeys={clearedObstacleKeys}
                    selectedTileKey={selectedTileKey}
                    onSelectTile={handleSelectGrassTile}
                  />
                  <LevelDirectionArrow
                    layout={chunk.layout}
                    origin={chunk.origin}
                  />
                </group>
              );
            })
          : null}
        <LevelChunk
          layout={mainLayout}
          origin={mainOrigin}
          showCastlePad={perf.castle}
          showDecor={perf.decor}
          showMountains={perf.mountains}
          showGrass={perf.grass}
          goldMine={goldMineTile}
          ironMine={ironMineTile}
          fertileDirt={fertileDirtTile}
          hasFarm={hasMainFarm}
          clearedObstacleKeys={clearedObstacleKeys}
          revealedPathCount={
            ENABLE_MAIN_MULTI_PATH ? revealedPathCount : undefined
          }
          selectedTileKey={selectedTileKey}
          onSelectTile={handleSelectGrassTile}
        />
        {perf.grass
          ? buildPlots.map((plot) => (
              <GrassGround
                key={`build-plot-${plot.id}`}
                size={plot.size}
                origin={plot.origin}
                selectedTileKey={selectedTileKey}
                onSelectTile={handleSelectGrassTile}
              />
            ))
          : null}
        {unusedEdgeGates.map(({ edge, position }) => (
          <EdgeGateModel
            key={`edge-gate-${edge}`}
            edge={edge}
            position={position}
            onClick={(pointer) => handleEdgeGateClick(edge, pointer)}
          />
        ))}
        {perf.fog ? (
          <FogOfWarClouds
            levels={fogLevels}
            seamTiles={fogSeamTiles}
            extraClearedTiles={buildPlotFogTiles}
          />
        ) : null}
        {perf.grass
          ? seamGrassGroups.map((group, index) => (
              <GrassTiles
                key={`seam-${index}`}
                tiles={group.tiles}
                opacity={group.opacity}
                selectedTileKey={selectedTileKey}
                onSelectTile={handleSelectGrassTile}
              />
            ))
          : null}
        {perf.combat
          ? enemies.map((enemy) => {
              const stats = getEnemyStats(enemy.typeId);

              return (
                <EnemyWalker
                  key={enemy.id}
                  path={enemy.path}
                  typeId={enemy.typeId}
                  moveSpeed={stats.moveSpeed}
                  movementType={stats.movementType}
                  dying={enemy.dying}
                  onReachExit={() => handleEnemyReachExit(enemy.id)}
                  onDeathComplete={() => handleEnemyDeathComplete(enemy.id)}
                  onPositionUpdate={(position) => {
                    if (enemy.dying) {
                      return;
                    }
                    enemyPositionsRef.current.set(enemy.id, position);
                  }}
                />
              );
            })
          : null}
        {perf.combat ? (
          <TowerDefenseSystem
            towers={towers}
            enemyPositionsRef={enemyPositionsRef}
            pendingTargetIdsRef={pendingTargetIdsRef}
            enemyIds={enemies
              .filter((enemy) => !enemy.dying)
              .map((enemy) => enemy.id)}
            onFireProjectile={handleFireProjectile}
          />
        ) : null}
        {perf.combat
          ? projectiles.map((projectile) => (
              <Projectile
                key={projectile.id}
                from={projectile.from}
                to={projectile.to}
                speed={projectile.speed}
                onHit={() => handleProjectileHit(projectile)}
              />
            ))
          : null}
        {perf.combat && selectedTower && selectedTowerAttackRangeTiles != null ? (
          <TowerAttackRadiusPreview
            gx={selectedTower.gx}
            gz={selectedTower.gz}
            attackRangeTiles={selectedTowerAttackRangeTiles}
          />
        ) : null}
        {perf.combat
          ? towers.map((tower) => {
              const { x, z } = globalTileWorldPosition(tower.gx, tower.gz);

              return (
                <TowerModel
                  key={tower.id}
                  typeId={tower.typeId}
                  position={[x, tower.groundY ?? 0, z]}
                />
              );
            })
          : null}
        {perf.castle ? (
          <CastleModel position={[castleWorld.x, 0, castleWorld.z]} />
        ) : null}
        <GroundOrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-10">
        {towerPlaceMenu ? (
          <TowerPlaceMenu
            menu={towerPlaceMenu}
            gold={gold}
            onSelect={handlePlaceTowerFromMenu}
            onClose={() => setTowerPlaceMenu(null)}
          />
        ) : null}
        {edgeGateMenu ? (
          <EdgeGateMenu
            menu={edgeGateMenu}
            gold={gold}
            onUnlock={handleUnlockEdgeGate}
            onClose={() => setEdgeGateMenu(null)}
          />
        ) : null}
        {farmPlaceMenu ? (
          <FarmPlaceMenu
            menu={farmPlaceMenu}
            gold={gold}
            onBuild={handleBuildFarm}
            onClose={() => setFarmPlaceMenu(null)}
          />
        ) : null}
        {obstacleClearMenu ? (
          <ObstacleClearMenu
            menu={obstacleClearMenu}
            gold={gold}
            cost={obstacleClearCost}
            yieldLabel={obstacleYieldLabel}
            onClear={handleClearObstacle}
            onClose={() => setObstacleClearMenu(null)}
          />
        ) : null}
        <LevelHud level={combatLevelIndex + 1} />
        <ResourcesHud
          gold={gold}
          iron={iron}
          wood={wood}
          stone={stone}
          food={food}
        />
      </div>
    </div>
  );
}
