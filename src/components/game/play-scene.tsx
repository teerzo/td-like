"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MOUSE } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import {
  CastleArmyMenu,
  type CastleArmyMenuState,
} from "@/components/game/castle-army-menu";
import { CastleHealthBar } from "@/components/game/castle-health-bar";
import {
  GameOverModal,
  type GameOverModalState,
} from "@/components/game/game-over-modal";
import { DayNightCycle } from "@/components/game/day-night-cycle";
import { DaySkyClouds } from "@/components/game/day-sky-clouds";
import { DebugHitbox } from "@/components/game/debug-hitbox";
import { WorldMenuProjector } from "@/components/game/world-menu-projector";
import { EnemyWalker } from "@/components/game/enemy-walker";
import {
  EDGE_GATE_COST,
  EdgeGateMenu,
  type EdgeGateMenuState,
} from "@/components/game/edge-gate-menu";
import { EdgeGateModel } from "@/components/game/edge-gate-model";
import {
  computeWaveFoodReward,
  computeWaveGoldReward,
  WaveClearModal,
  type WaveClearModalState,
} from "@/components/game/wave-clear-modal";
import {
  FarmPlaceMenu,
  type FarmPlaceMenuState,
} from "@/components/game/farm-place-menu";
import {
  LumberMillPlaceMenu,
  type LumberMillPlaceMenuState,
} from "@/components/game/lumber-mill-place-menu";
import {
  FishingHutPlaceMenu,
  type FishingHutPlaceMenuState,
} from "@/components/game/fishing-hut-place-menu";
import {
  MinePlaceMenu,
  type MinePlaceMenuState,
} from "@/components/game/mine-place-menu";
import { useGameSettings } from "@/components/game/game-settings-provider";
import { FogOfWarClouds } from "@/components/game/fog-of-war-clouds";
import { Projectile } from "@/components/game/projectile";
import { CastleModel, TowerModel } from "@/components/game/models";
import {
  GrassTiles,
  type GrassSelectionProps,
  type GrassTilePointer,
} from "@/components/game/ground-plane";
import { LevelDirectionArrow } from "@/components/game/level-direction-arrow";
import {
  ObstacleClearMenu,
  type ObstacleClearMenuState,
} from "@/components/game/obstacle-clear-menu";
import { ForestGround } from "@/components/game/forest-ground";
import { Terrain } from "@/components/game/terrain";
import { TowerAttackRadiusPreview } from "@/components/game/tower-attack-radius-preview";
import { TowerPlaceMenu, type TowerPlaceMenuState } from "@/components/game/tower-place-menu";
import {
  TowerManageMenu,
  type TowerManageMenuState,
} from "@/components/game/tower-manage-menu";
import { usePublishPlayHud } from "@/components/game/play-hud-provider";
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
  getChainedFlyingWorldPath,
  getChainedWorldPath,
  getSeamGrassTileGroups,
  localToGlobal,
  type ChunkOrigin,
  type GlobalGridCoord,
} from "@/lib/global-grid";
import { getEnemiesInAoe, getEffectiveAttackRangeTiles } from "@/lib/tower-combat";
import { computeTowerDamage } from "@/lib/combat-counters";
import { CASTLE_MAX_HEALTH, getCastleLeakDamage } from "@/lib/castle";
import {
  buildGameRunStats,
  createEmptyLifetimeStats,
  recordKill,
  recordLeak,
  recordResourceEarned,
  type LifetimeStats,
} from "@/lib/game-stats";
import {
  buildInteractableTileKeys,
  isInteractableCoord,
} from "@/lib/interactable-area";
import type { ResourceId } from "@/components/game/resource-icon";
import {
  getEnemyMoveSpeedForWave,
  getEnemyStats,
  getWaveSpawnStaggerMs,
  type EnemyTypeId,
} from "@/lib/enemy-types";
import {
  ARMY_UNIT_IDS,
  armyGoldIncome,
  armyResourcesSpent,
  armyTotal,
  canAffordUnit,
  createEmptyArmy,
  spendUnitCost,
  type ArmyResources,
  type ArmyRoster,
  type ArmyUnitId,
} from "@/lib/army-types";
import {
  AUTOPLAY_CONFIDENCE_START,
  AUTOPLAY_MODAL_DELAY_MS,
  AUTOPLAY_TICK_MS,
  chooseAutoplayAction,
  countAutoplayLeaks,
  nextAutoplayConfidence,
  planFoodRecruits,
  type AutoplaySnapshot,
} from "@/lib/autoplay";
import {
  canAffordFishingHut,
  FISHING_HUT_COST,
  FISHING_HUT_INCOME,
  hasFishingHutAt,
} from "@/lib/fishing-hut";
import {
  BUILD_PLOT_SIZE,
  canAffordFarm,
  collectBuildPlotTiles,
  computeBuildPlotOrigin,
  FARM_COST,
  FARM_INCOME,
  hasFarmAt,
  type BuildPlot,
} from "@/lib/fertile-farm";
import {
  canAffordLumberMill,
  hasLumberMillAt,
  LUMBER_MILL_COST,
  LUMBER_MILL_INCOME,
} from "@/lib/lumber-mill";
import {
  collectBuildPlotForestKeys,
  collectStandingForestKeys,
  collectTowerPlacementBlockedKeys,
  isBlockingRevealedTile,
  isEmptyGrassTowerTile,
  isGlobalRoadClearanceTile,
  isPathDirtTile,
  rollTreeReveal,
  seedMainForestReveals,
  type BuiltMine,
  type RevealedTileKind,
} from "@/lib/forest-nothing";
import {
  GOLD_MINE_COST,
  GOLD_MINE_INCOME,
  IRON_MINE_COST,
  IRON_MINE_INCOME,
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
import {
  canAffordTowerPlace,
  canTowerTargetMovement,
  getTowerIronCost,
  getTowerSellRefund,
  getTowerStats,
  getTowerStatsAtLevel,
  getTowerUpgradeCost,
  getTowerWoodCost,
  STARTING_GOLD,
  type TowerTypeId,
} from "@/lib/tower-types";
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
  shouldPlaceDirtTile,
  type GridCoord,
  type LevelEdge,
  type SpawnTurn,
  type WorldLayout,
} from "@/lib/world-layout";

const MAX_SPAWN_ATTEMPTS = 64;

const PREVIEW_LEVEL_OPACITY = 0.5;
/** Claimed spawned chunks allowed while Fixed Map is on (preview does not count). */
const FIXED_MAP_MAX_EXPANSIONS = 2;
const AUTO_SPAWN_INTERVAL_MS = 1200;
/** Delay between each mirrored inbound unit spawn. */

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
  standingForestKeys,
  revealedTiles,
  builtMines,
  farms,
  lumberMills,
  fishingHutKeys,
  clearedObstacleKeys,
  selectedTileKey,
  onSelectTile,
  onSelectTreeTile,
}: {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  revealedPathCount?: number;
  showCastlePad?: boolean;
  showDecor?: boolean;
  showMountains?: boolean;
  showGrass?: boolean;
  standingForestKeys?: ReadonlySet<string>;
  revealedTiles?: ReadonlyMap<string, RevealedTileKind>;
  builtMines?: readonly BuiltMine[];
  farms?: readonly { gx: number; gz: number }[];
  lumberMills?: readonly { gx: number; gz: number }[];
  fishingHutKeys?: ReadonlySet<string>;
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
      standingForestKeys={standingForestKeys}
      revealedTiles={revealedTiles}
      builtMines={builtMines}
      farms={farms}
      lumberMills={lumberMills}
      fishingHutKeys={fishingHutKeys}
      clearedObstacleKeys={clearedObstacleKeys}
      selectedTileKey={selectedTileKey}
      onSelectTile={onSelectTile}
      onSelectTreeTile={onSelectTreeTile}
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
      enableZoom
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        // Disable middle-mouse drag; scroll wheel zoom still works via enableZoom.
        MIDDLE: -1 as MOUSE,
        RIGHT: MOUSE.PAN,
      }}
    />
  );
}

export default function PlayScene() {
  const perf = usePlayPerfFlags();
  const { autoplayEnabled, freezeMapExpansion, autoplayConfidence, setAutoplayConfidence } =
    useGameSettings();
  const prevAutoplayEnabledRef = useRef(autoplayEnabled);
  /** Day = manage land/army; night = inbound raid until the wave is cleared. */
  const [isNight, setIsNight] = useState(false);
  const isNightRef = useRef(false);
  /** True after Send Attack has queued its counter-wave (avoids day flicker). */
  const nightWaveActiveRef = useRef(false);
  /** Inbound units still waiting to spawn (stagger queue). */
  const waveSpawnRemainingRef = useRef(0);
  const waveSpawnTimeoutsRef = useRef<number[]>([]);
  /** Bumps on each Send Attack so stale stagger timeouts never spawn. */
  const waveGenerationRef = useRef(0);
  const nightKillsRef = useRef<Partial<Record<EnemyTypeId, number>>>({});
  const nightLeaksRef = useRef<Partial<Record<EnemyTypeId, number>>>({});
  const sentWaveGoldRef = useRef(0);
  const lifetimeStatsRef = useRef<LifetimeStats>(createEmptyLifetimeStats());
  const gameOverRef = useRef(false);
  const [castleHp, setCastleHp] = useState(CASTLE_MAX_HEALTH);
  const [gameOver, setGameOver] = useState<GameOverModalState | null>(null);
  const [waveClearModal, setWaveClearModal] =
    useState<WaveClearModalState | null>(null);
  const waveClearOpenedAtRef = useRef<number | null>(null);
  const autoplayPendingSendAttackRef = useRef(false);
  const autoplayArmyMenuOpenedAtRef = useRef<number | null>(null);
  const gameOverOpenedAtRef = useRef<number | null>(null);

  useEffect(() => {
    waveClearOpenedAtRef.current = waveClearModal ? Date.now() : null;
  }, [waveClearModal]);

  useEffect(() => {
    gameOverOpenedAtRef.current = gameOver ? Date.now() : null;
  }, [gameOver]);
  const [mainLayout, setMainLayout] = useState(() => generateWorldLayout());
  const [revealedPathCount, setRevealedPathCount] = useState(
    ENABLE_MAIN_MULTI_PATH ? 0 : 1,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const registryRef = useRef(new GlobalTileRegistry());
  const [spawnedLevels, setSpawnedLevels] = useState<PlacedLevel[]>([]);
  /** 0 = main grid; N = enemies spawn from spawnedLevels[N - 1] entrance. */
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  /** Raid / wave level shown in the HUD; increments when a night wave is cleared. */
  const [waveLevel, setWaveLevel] = useState(1);
  const [selectedGrassTile, setSelectedGrassTile] =
    useState<GlobalGridCoord | null>(null);
  const [towers, setTowers] = useState<PlacedTower[]>([]);
  const [towerPlaceMenu, setTowerPlaceMenu] =
    useState<TowerPlaceMenuState | null>(null);
  const [towerPlaceHoverTypeId, setTowerPlaceHoverTypeId] =
    useState<TowerTypeId | null>(null);
  const [towerManageMenu, setTowerManageMenu] =
    useState<TowerManageMenuState | null>(null);
  const [edgeGateMenu, setEdgeGateMenu] = useState<EdgeGateMenuState | null>(
    null,
  );
  const [farmPlaceMenu, setFarmPlaceMenu] = useState<FarmPlaceMenuState | null>(
    null,
  );
  const [lumberMillPlaceMenu, setLumberMillPlaceMenu] =
    useState<LumberMillPlaceMenuState | null>(null);
  const [fishingHutPlaceMenu, setFishingHutPlaceMenu] =
    useState<FishingHutPlaceMenuState | null>(null);
  const [minePlaceMenu, setMinePlaceMenu] = useState<MinePlaceMenuState | null>(
    null,
  );
  const [farms, setFarms] = useState<{ gx: number; gz: number }[]>([]);
  const [lumberMills, setLumberMills] = useState<{ gx: number; gz: number }[]>(
    [],
  );
  const [fishingHuts, setFishingHuts] = useState<{ gx: number; gz: number }[]>(
    [],
  );
  const [builtMines, setBuiltMines] = useState<BuiltMine[]>([]);
  const [choppedForestKeys, setChoppedForestKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [revealedTiles, setRevealedTiles] = useState<
    Map<string, RevealedTileKind>
  >(() => new Map());
  const [obstacleClearMenu, setObstacleClearMenu] =
    useState<ObstacleClearMenuState | null>(null);
  const [armyMenu, setArmyMenu] = useState<CastleArmyMenuState | null>(null);
  const [army, setArmy] = useState<ArmyRoster>(() => createEmptyArmy());
  const autoplayArmyRef = useRef(army);
  autoplayArmyRef.current = army;
  const [unlockedBuildEdges, setUnlockedBuildEdges] = useState<LevelEdge[]>([]);
  const [buildPlots, setBuildPlots] = useState<BuildPlot[]>([]);
  const [clearedObstacleKeys, setClearedObstacleKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [enemies, setEnemies] = useState<PlacedEnemy[]>([]);
  const [projectiles, setProjectiles] = useState<FiredProjectile[]>([]);
  /** Debug: continuous spawns during night (normal nights use Send Attack waves). */
  const [autoSpawnEnemies, setAutoSpawnEnemies] = useState(false);
  const [gold, setGold] = useState(STARTING_GOLD);
  const [iron, setIron] = useState(STARTING_IRON);
  const [wood, setWood] = useState(STARTING_WOOD);
  const [stone, setStone] = useState(STARTING_STONE);
  const [food, setFood] = useState(STARTING_FOOD);
  const autoplayFoodRef = useRef(food);
  autoplayFoodRef.current = food;

  const handleAddHudResource = useCallback((resource: ResourceId) => {
    const amount = 10;
    if (resource === "gold") {
      setGold((current) => current + amount);
      return;
    }
    if (resource === "iron") {
      setIron((current) => current + amount);
      return;
    }
    if (resource === "wood") {
      setWood((current) => current + amount);
      return;
    }
    if (resource === "stone") {
      setStone((current) => current + amount);
      return;
    }
    setFood((current) => current + amount);
  }, []);

  usePublishPlayHud({
    level: waveLevel,
    gold,
    iron,
    wood,
    stone,
    food,
    onAddResource: handleAddHudResource,
  });
  const nextChunkId = useRef(0);
  const nextTowerId = useRef(0);
  const nextEnemyId = useRef(0);
  const nextBuildPlotId = useRef(0);
  const enemyPositionsRef = useRef(new Map<number, [number, number, number]>());
  const pendingTargetIdsRef = useRef(new Set<number>());

  function earnResource(resource: ResourceId, amount: number) {
    recordResourceEarned(lifetimeStatsRef.current, resource, amount);
  }

  function currentArmyResources(): ArmyResources {
    return {
      gold,
      iron,
      wood,
      stone,
      food: autoplayFoodRef.current,
    };
  }

  function applyArmyResources(next: ArmyResources) {
    autoplayFoodRef.current = next.food;
    setGold(next.gold);
    setIron(next.iron);
    setWood(next.wood);
    setStone(next.stone);
    setFood(next.food);
  }

  function triggerGameOver() {
    if (gameOverRef.current) {
      return;
    }

    gameOverRef.current = true;
    isNightRef.current = false;
    nightWaveActiveRef.current = false;
    waveGenerationRef.current += 1;
    for (const timeoutId of waveSpawnTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    waveSpawnTimeoutsRef.current = [];
    waveSpawnRemainingRef.current = 0;
    setIsNight(false);
    setWaveClearModal(null);
    setEnemies([]);
    setProjectiles([]);
    closeAllMenus();
    setGameOver(buildGameRunStats(lifetimeStatsRef.current, waveLevel));
  }

  function applyCastleLeakDamage(typeId: EnemyTypeId) {
    if (gameOverRef.current) {
      return;
    }

    const damage = getCastleLeakDamage(typeId);
    setCastleHp((current) => {
      const next = Math.max(0, current - damage);
      if (next <= 0) {
        queueMicrotask(() => {
          triggerGameOver();
        });
      }
      return next;
    });
  }

  const selectedTileKey = selectedGrassTile
    ? globalCoordKey(selectedGrassTile.gx, selectedGrassTile.gz)
    : null;

  const mainOrigin = useMemo(() => centeredChunkOrigin(mainLayout), [mainLayout]);

  const interactableTileKeys = useMemo(
    () =>
      buildInteractableTileKeys({
        mainLayout,
        mainOrigin,
        spawnedLevels,
        buildPlots,
      }),
    [mainLayout, mainOrigin, spawnedLevels, buildPlots],
  );

  const globalRoadKeys = useMemo(() => {
    const set = new Set<string>();

    const addLayoutRoads = (layout: WorldLayout, origin: ChunkOrigin) => {
      for (const key of layout.roadKeys) {
        const [x, z] = key.split(":").map(Number);
        if (shouldPlaceDirtTile(layout, x, z)) {
          set.add(globalCoordKey(origin.gx + x, origin.gz + z));
        }
      }
    };

    addLayoutRoads(mainLayout, mainOrigin);
    for (const level of spawnedLevels) {
      addLayoutRoads(level.layout, level.origin);
    }

    return set;
  }, [mainLayout, mainOrigin, spawnedLevels]);

  const isGlobalRoad = useCallback(
    (gx: number, gz: number) => globalRoadKeys.has(globalCoordKey(gx, gz)),
    [globalRoadKeys],
  );

  const plotForestKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const plot of buildPlots) {
      for (const key of collectBuildPlotForestKeys(plot, isGlobalRoad)) {
        keys.add(key);
      }
    }
    return keys;
  }, [buildPlots, isGlobalRoad]);

  const towerPlacementBlockedKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const key of collectTowerPlacementBlockedKeys(mainLayout, mainOrigin)) {
      keys.add(key);
    }

    for (const level of spawnedLevels) {
      for (const key of collectTowerPlacementBlockedKeys(
        level.layout,
        level.origin,
      )) {
        keys.add(key);
      }
    }

    return keys;
  }, [mainLayout, mainOrigin, spawnedLevels]);

  const mainForestRevealSeed = useMemo(
    () => seedMainForestReveals(mainLayout, mainOrigin),
    [mainLayout, mainOrigin],
  );

  const standingForestKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const key of collectStandingForestKeys(mainLayout, mainOrigin)) {
      if (!choppedForestKeys.has(key)) {
        keys.add(key);
      }
    }

    for (const level of spawnedLevels) {
      for (const key of collectStandingForestKeys(level.layout, level.origin)) {
        if (!choppedForestKeys.has(key)) {
          keys.add(key);
        }
      }
    }

    for (const key of plotForestKeys) {
      if (!choppedForestKeys.has(key)) {
        keys.add(key);
      }
    }

    return keys;
  }, [
    mainLayout,
    mainOrigin,
    spawnedLevels,
    plotForestKeys,
    choppedForestKeys,
  ]);

  const builtMineKeySet = useMemo(
    () => new Set(builtMines.map((mine) => globalCoordKey(mine.gx, mine.gz))),
    [builtMines],
  );

  const obstacleByKey = useMemo(() => {
    const map = new Map<string, ObstacleKind>();

    for (const [key, kind] of revealedTiles) {
      if (kind === "rock" && !clearedObstacleKeys.has(key)) {
        map.set(key, "rock");
      }
    }

    return map;
  }, [revealedTiles, clearedObstacleKeys]);

  const fishingHutKeys = useMemo(
    () =>
      new Set(fishingHuts.map((hut) => globalCoordKey(hut.gx, hut.gz))),
    [fishingHuts],
  );

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
    () =>
      selectedTower
        ? getTowerStatsAtLevel(selectedTower.typeId, selectedTower.level ?? 1)
        : null,
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

  const anchoredMenuWorldPosition = useMemo(():
    | [number, number, number]
    | null => {
    if (towerPlaceMenu) {
      const { x, z } = globalTileWorldPosition(
        towerPlaceMenu.gx,
        towerPlaceMenu.gz,
      );
      return [x, 0.45, z];
    }

    if (towerManageMenu) {
      const tower = towers.find((entry) => entry.id === towerManageMenu.towerId);
      if (!tower) {
        return null;
      }
      const { x, z } = globalTileWorldPosition(tower.gx, tower.gz);
      return [x, (tower.groundY ?? 0) + 0.55, z];
    }

    if (farmPlaceMenu) {
      const { x, z } = globalTileWorldPosition(
        farmPlaceMenu.gx,
        farmPlaceMenu.gz,
      );
      return [x, 0.35, z];
    }

    if (lumberMillPlaceMenu) {
      const { x, z } = globalTileWorldPosition(
        lumberMillPlaceMenu.gx,
        lumberMillPlaceMenu.gz,
      );
      return [x, 0.35, z];
    }

    if (fishingHutPlaceMenu) {
      const { x, z } = globalTileWorldPosition(
        fishingHutPlaceMenu.gx,
        fishingHutPlaceMenu.gz,
      );
      return [x, 0.35, z];
    }

    if (minePlaceMenu) {
      const { x, z } = globalTileWorldPosition(
        minePlaceMenu.gx,
        minePlaceMenu.gz,
      );
      return [x, 0.35, z];
    }

    if (obstacleClearMenu) {
      const { x, z } = globalTileWorldPosition(
        obstacleClearMenu.gx,
        obstacleClearMenu.gz,
      );
      return [x, 0.4, z];
    }

    if (edgeGateMenu) {
      const tile = getEdgeGateTile(edgeGateMenu.edge, mainLayout.size);
      const { x, z } = globalTileWorldPosition(
        mainOrigin.gx + tile.x,
        mainOrigin.gz + tile.z,
      );
      return [x, 0.45, z];
    }

    return null;
  }, [
    towerPlaceMenu,
    towerManageMenu,
    farmPlaceMenu,
    lumberMillPlaceMenu,
    fishingHutPlaceMenu,
    minePlaceMenu,
    obstacleClearMenu,
    edgeGateMenu,
    towers,
    mainLayout.size,
    mainOrigin.gx,
    mainOrigin.gz,
  ]);

  function closeAllMenus() {
    setTowerPlaceMenu(null);
    setTowerManageMenu(null);
    setEdgeGateMenu(null);
    setFarmPlaceMenu(null);
    setLumberMillPlaceMenu(null);
    setFishingHutPlaceMenu(null);
    setMinePlaceMenu(null);
    setObstacleClearMenu(null);
    setArmyMenu(null);
    setTowerPlaceHoverTypeId(null);
  }

  function dismissAnchoredMenus() {
    setTowerPlaceMenu(null);
    setTowerManageMenu(null);
    setEdgeGateMenu(null);
    setFarmPlaceMenu(null);
    setLumberMillPlaceMenu(null);
    setFishingHutPlaceMenu(null);
    setMinePlaceMenu(null);
    setObstacleClearMenu(null);
    setSelectedGrassTile(null);
    setTowerPlaceHoverTypeId(null);
  }

  function isTileInteractable(gx: number, gz: number) {
    return interactableTileKeys.has(globalCoordKey(gx, gz));
  }

  function isBuildableTile(gx: number, gz: number) {
    return !isPathDirtTile(gx, gz, isGlobalRoad);
  }

  function handleSelectTreeTile(
    coord: GlobalGridCoord,
    pointer: GrassTilePointer,
  ) {
    if (gameOverRef.current) {
      return;
    }

    if (!isInteractableCoord(coord, interactableTileKeys)) {
      return;
    }

    const tileKey = globalCoordKey(coord.gx, coord.gz);
    if (!standingForestKeys.has(tileKey)) {
      return;
    }

    closeAllMenus();
    setSelectedGrassTile(coord);
    const pos = menuPointer(pointer, containerRef.current);
    setObstacleClearMenu({
      kind: "tree",
      gx: coord.gx,
      gz: coord.gz,
      clientX: pos.clientX,
      clientY: pos.clientY,
    });
  }

  function handleSelectGrassTile(
    coord: GlobalGridCoord,
    pointer: GrassTilePointer,
  ) {
    if (gameOverRef.current) {
      return;
    }

    if (!isInteractableCoord(coord, interactableTileKeys)) {
      return;
    }

    const tileKey = globalCoordKey(coord.gx, coord.gz);
    const revealed = revealedTiles.get(tileKey);

    if (revealed === "goldDeposit") {
      if (!isBuildableTile(coord.gx, coord.gz)) {
        return;
      }
      closeAllMenus();
      setSelectedGrassTile(coord);
      if (builtMineKeySet.has(tileKey)) {
        return;
      }
      const pos = menuPointer(pointer, containerRef.current);
      setMinePlaceMenu({
        kind: "gold",
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    if (revealed === "ironDeposit") {
      if (!isBuildableTile(coord.gx, coord.gz)) {
        return;
      }
      closeAllMenus();
      setSelectedGrassTile(coord);
      if (builtMineKeySet.has(tileKey)) {
        return;
      }
      const pos = menuPointer(pointer, containerRef.current);
      setMinePlaceMenu({
        kind: "iron",
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    if (revealed === "fertile") {
      if (!isBuildableTile(coord.gx, coord.gz)) {
        return;
      }
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

    if (revealed === "lumber") {
      if (!isBuildableTile(coord.gx, coord.gz)) {
        return;
      }
      closeAllMenus();
      setSelectedGrassTile(coord);

      if (hasLumberMillAt(lumberMills, coord.gx, coord.gz)) {
        return;
      }

      const pos = menuPointer(pointer, containerRef.current);
      setLumberMillPlaceMenu({
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    if (revealed === "pond") {
      if (!isBuildableTile(coord.gx, coord.gz)) {
        return;
      }
      closeAllMenus();
      setSelectedGrassTile(coord);

      if (hasFishingHutAt(fishingHuts, coord.gx, coord.gz)) {
        return;
      }

      const pos = menuPointer(pointer, containerRef.current);
      setFishingHutPlaceMenu({
        gx: coord.gx,
        gz: coord.gz,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    const obstacle = obstacleByKey.get(tileKey);
    if (obstacle === "rock") {
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

    const tower = towers.find(
      (entry) => entry.gx === coord.gx && entry.gz === coord.gz,
    );

    if (tower) {
      closeAllMenus();
      const isDeselect =
        selectedGrassTile?.gx === coord.gx && selectedGrassTile?.gz === coord.gz;
      if (isDeselect) {
        setSelectedGrassTile(null);
        return;
      }

      setSelectedGrassTile(coord);
      const pos = menuPointer(pointer, containerRef.current);
      setTowerManageMenu({
        towerId: tower.id,
        typeId: tower.typeId,
        level: tower.level ?? 1,
        clientX: pos.clientX,
        clientY: pos.clientY,
      });
      return;
    }

    closeAllMenus();

    if (!isBuildableTile(coord.gx, coord.gz)) {
      return;
    }

    if (
      revealed &&
      isBlockingRevealedTile(
        revealed,
        tileKey,
        builtMineKeySet,
        clearedObstacleKeys,
      )
    ) {
      return;
    }

    if (
      !isEmptyGrassTowerTile({
        gx: coord.gx,
        gz: coord.gz,
        tileKey,
        revealed,
        standingForestKeys,
        towerOccupiedKeys,
        towerPlacementBlockedKeys,
        clearedObstacleKeys,
        isGlobalRoad,
      })
    ) {
      return;
    }

    setSelectedGrassTile(coord);
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
    placeTowerAt(towerPlaceMenu.gx, towerPlaceMenu.gz, typeId);
    setTowerPlaceMenu(null);
  }

  function placeTowerAt(gx: number, gz: number, typeId: TowerTypeId) {
    if (!isTileInteractable(gx, gz) || !isBuildableTile(gx, gz)) {
      return;
    }

    const tileKey = globalCoordKey(gx, gz);
    const alreadyOccupied = towers.some(
      (tower) => tower.gx === gx && tower.gz === gz,
    );
    const stats = getTowerStats(typeId);
    const goldCost = stats.cost;
    const ironCost = getTowerIronCost(typeId);
    const woodCost = getTowerWoodCost(typeId);

    if (alreadyOccupied) {
      setSelectedGrassTile({ gx, gz });
      return;
    }

    if (!canAffordTowerPlace(typeId, gold, wood, iron)) {
      return;
    }

    if (obstacleByKey.has(tileKey)) {
      return;
    }

    const revealed = revealedTiles.get(tileKey);
    if (
      !isEmptyGrassTowerTile({
        gx,
        gz,
        tileKey,
        revealed,
        standingForestKeys,
        towerOccupiedKeys,
        towerPlacementBlockedKeys,
        clearedObstacleKeys,
        isGlobalRoad,
      })
    ) {
      return;
    }

    const id = nextTowerId.current;
    nextTowerId.current += 1;
    const hill = hillTilesByKey.get(tileKey);
    setGold((current) => current - goldCost);
    if (ironCost > 0) {
      setIron((current) => current - ironCost);
    }
    if (woodCost > 0) {
      setWood((current) => current - woodCost);
    }
    setTowers((current) => [
      ...current,
      {
        id,
        gx,
        gz,
        typeId,
        level: 1,
        onHill: !!hill,
        groundY: hill?.height ?? 0,
      },
    ]);
    setSelectedGrassTile({ gx, gz });
  }

  function handleUpgradeTower(towerId: number) {
    const tower = towers.find((entry) => entry.id === towerId);
    if (!tower) {
      return;
    }

    const level = tower.level ?? 1;
    const cost = getTowerUpgradeCost(tower.typeId, level);
    if (cost === null || gold < cost) {
      return;
    }

    setGold((current) => current - cost);
    setTowers((current) =>
      current.map((entry) =>
        entry.id === towerId ? { ...entry, level: level + 1 } : entry,
      ),
    );
    setTowerManageMenu((current) =>
      current && current.towerId === towerId
        ? { ...current, level: level + 1 }
        : current,
    );
  }

  function handleDestroyTower(towerId: number) {
    const tower = towers.find((entry) => entry.id === towerId);
    if (!tower) {
      return;
    }

    const refund = getTowerSellRefund(tower.typeId, tower.level ?? 1);
    setGold((current) => current + refund);
    setTowers((current) => current.filter((entry) => entry.id !== towerId));
    setTowerManageMenu(null);
    setSelectedGrassTile(null);
  }

  function handleBuildFarm() {
    if (!farmPlaceMenu) {
      return;
    }
    buildFarmAt(farmPlaceMenu.gx, farmPlaceMenu.gz);
    setFarmPlaceMenu(null);
  }

  function buildFarmAt(gx: number, gz: number) {
    if (!isTileInteractable(gx, gz) || !isBuildableTile(gx, gz)) {
      return;
    }

    if (!canAffordFarm({ gold, iron, wood })) {
      return;
    }

    const tileKey = globalCoordKey(gx, gz);
    if (revealedTiles.get(tileKey) !== "fertile") {
      return;
    }
    if (hasFarmAt(farms, gx, gz)) {
      return;
    }

    setGold((current) => current - FARM_COST.gold);
    setIron((current) => current - FARM_COST.iron);
    setWood((current) => current - FARM_COST.wood);
    setFarms((current) => [...current, { gx, gz }]);
    setSelectedGrassTile({ gx, gz });
  }

  function handleBuildLumberMill() {
    if (!lumberMillPlaceMenu) {
      return;
    }
    buildLumberMillAt(lumberMillPlaceMenu.gx, lumberMillPlaceMenu.gz);
    setLumberMillPlaceMenu(null);
  }

  function buildLumberMillAt(gx: number, gz: number) {
    if (!isTileInteractable(gx, gz) || !isBuildableTile(gx, gz)) {
      return;
    }

    if (!canAffordLumberMill({ gold })) {
      return;
    }

    const tileKey = globalCoordKey(gx, gz);
    if (revealedTiles.get(tileKey) !== "lumber") {
      return;
    }
    if (hasLumberMillAt(lumberMills, gx, gz)) {
      return;
    }

    setGold((current) => current - LUMBER_MILL_COST);
    setLumberMills((current) => [...current, { gx, gz }]);
    setSelectedGrassTile({ gx, gz });
  }

  function handleBuildFishingHut() {
    if (!fishingHutPlaceMenu) {
      return;
    }
    buildFishingHutAt(fishingHutPlaceMenu.gx, fishingHutPlaceMenu.gz);
    setFishingHutPlaceMenu(null);
  }

  function buildFishingHutAt(gx: number, gz: number) {
    if (!isTileInteractable(gx, gz) || !isBuildableTile(gx, gz)) {
      return;
    }

    if (!canAffordFishingHut({ gold, wood })) {
      return;
    }

    const tileKey = globalCoordKey(gx, gz);
    if (revealedTiles.get(tileKey) !== "pond") {
      return;
    }
    if (hasFishingHutAt(fishingHuts, gx, gz)) {
      return;
    }

    setGold((current) => current - FISHING_HUT_COST.gold);
    setWood((current) => current - FISHING_HUT_COST.wood);
    setFishingHuts((current) => [...current, { gx, gz }]);
    setSelectedGrassTile({ gx, gz });
  }

  function handleBuildMine() {
    if (!minePlaceMenu) {
      return;
    }
    buildMineAt(minePlaceMenu.kind, minePlaceMenu.gx, minePlaceMenu.gz);
    setMinePlaceMenu(null);
  }

  function buildMineAt(kind: "gold" | "iron", gx: number, gz: number) {
    if (!isTileInteractable(gx, gz) || !isBuildableTile(gx, gz)) {
      return;
    }

    const tileKey = globalCoordKey(gx, gz);
    const cost = kind === "gold" ? GOLD_MINE_COST : IRON_MINE_COST;

    if (gold < cost) {
      return;
    }

    const expectedReveal = kind === "gold" ? "goldDeposit" : "ironDeposit";
    if (revealedTiles.get(tileKey) !== expectedReveal) {
      return;
    }

    if (builtMineKeySet.has(tileKey)) {
      return;
    }

    setGold((current) => current - cost);
    setBuiltMines((current) => [...current, { gx, gz, kind }]);
    setSelectedGrassTile({ gx, gz });
  }

  function handleClearObstacle() {
    if (!obstacleClearMenu) {
      return;
    }
    clearObstacleAt(
      obstacleClearMenu.kind,
      obstacleClearMenu.gx,
      obstacleClearMenu.gz,
    );
    setObstacleClearMenu(null);
  }

  function clearObstacleAt(kind: ObstacleKind, gx: number, gz: number) {
    if (!isTileInteractable(gx, gz)) {
      return;
    }

    const cost = kind === "tree" ? TREE_CLEAR_COST : ROCK_CLEAR_COST;

    if (gold < cost) {
      return;
    }

    const key = globalCoordKey(gx, gz);
    setGold((current) => current - cost);

    if (kind === "tree") {
      setWood((current) => current + TREE_CLEAR_WOOD);
      earnResource("wood", TREE_CLEAR_WOOD);
      setChoppedForestKeys((current) => {
        const next = new Set(current);
        next.add(key);
        return next;
      });
      setRevealedTiles((current) => {
        const next = new Map(current);
        next.set(key, mainForestRevealSeed.get(key) ?? rollTreeReveal(gx, gz));
        return next;
      });
    } else {
      setStone((current) => current + ROCK_CLEAR_STONE);
      earnResource("stone", ROCK_CLEAR_STONE);
      setClearedObstacleKeys((current) => {
        const next = new Set(current);
        next.add(key);
        return next;
      });
    }

    setSelectedGrassTile({ gx, gz });
  }

  const hillTilesByKey = useMemo(() => {
    const map = new Map<string, { height: number }>();

    for (const [key, kind] of revealedTiles) {
      if (kind !== "hill") {
        continue;
      }

      const [gxPart, gzPart] = key.split(":");
      const gx = Number(gxPart);
      const gz = Number(gzPart);
      map.set(key, { height: hillVariant(gx, gz).height });
    }

    return map;
  }, [revealedTiles]);

  const towerAttackRangePreview = useMemo(() => {
    if (selectedTower && selectedTowerAttackRangeTiles != null) {
      return {
        gx: selectedTower.gx,
        gz: selectedTower.gz,
        attackRangeTiles: selectedTowerAttackRangeTiles,
      };
    }

    if (!towerPlaceMenu) {
      return null;
    }

    const tileKey = globalCoordKey(towerPlaceMenu.gx, towerPlaceMenu.gz);
    const previewTypeId = towerPlaceHoverTypeId ?? "archer";
    const previewStats = getTowerStats(previewTypeId);

    return {
      gx: towerPlaceMenu.gx,
      gz: towerPlaceMenu.gz,
      attackRangeTiles: getEffectiveAttackRangeTiles(
        previewStats,
        hillTilesByKey.has(tileKey),
      ),
    };
  }, [
    hillTilesByKey,
    selectedTower,
    selectedTowerAttackRangeTiles,
    towerPlaceHoverTypeId,
    towerPlaceMenu,
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

  const farmKeys = useMemo(
    () => new Set(farms.map((farm) => globalCoordKey(farm.gx, farm.gz))),
    [farms],
  );

  const lumberMillKeys = useMemo(
    () =>
      new Set(lumberMills.map((mill) => globalCoordKey(mill.gx, mill.gz))),
    [lumberMills],
  );

  const towerOccupiedKeys = useMemo(
    () => new Set(towers.map((tower) => globalCoordKey(tower.gx, tower.gz))),
    [towers],
  );

  const autoplayOpenAndBuildable = useMemo(() => {
    const openKeys = new Set<string>();
    const buildableTowerKeys: { gx: number; gz: number; key: string }[] = [];

    const considerTile = (gx: number, gz: number) => {
      const key = globalCoordKey(gx, gz);
      if (isPathDirtTile(gx, gz, isGlobalRoad)) {
        return;
      }
      if (standingForestKeys.has(key)) {
        return;
      }
      if (towerOccupiedKeys.has(key)) {
        return;
      }

      const revealed = revealedTiles.get(key);
      const onClearance = isGlobalRoadClearanceTile(gx, gz, isGlobalRoad);

      if (onClearance || revealed !== undefined) {
        openKeys.add(key);
      }

      if (
        isEmptyGrassTowerTile({
          gx,
          gz,
          tileKey: key,
          revealed,
          standingForestKeys,
          towerOccupiedKeys,
          towerPlacementBlockedKeys,
          clearedObstacleKeys,
          isGlobalRoad,
        })
      ) {
        buildableTowerKeys.push({ gx, gz, key });
      }
    };

    for (let x = 0; x < mainLayout.size; x += 1) {
      for (let z = 0; z < mainLayout.size; z += 1) {
        considerTile(mainOrigin.gx + x, mainOrigin.gz + z);
      }
    }

    for (const level of spawnedLevels.slice(0, -1)) {
      for (let x = 0; x < level.layout.size; x += 1) {
        for (let z = 0; z < level.layout.size; z += 1) {
          considerTile(level.origin.gx + x, level.origin.gz + z);
        }
      }
    }

    for (const plot of buildPlots) {
      for (const tile of collectBuildPlotTiles(plot)) {
        considerTile(tile.gx, tile.gz);
      }
    }

    return { openKeys, buildableTowerKeys };
  }, [
    mainLayout,
    mainOrigin,
    spawnedLevels,
    buildPlots,
    standingForestKeys,
    towerOccupiedKeys,
    towerPlacementBlockedKeys,
    revealedTiles,
    builtMineKeySet,
    clearedObstacleKeys,
    isGlobalRoad,
  ]);

  useEffect(() => {
    const wasEnabled = prevAutoplayEnabledRef.current;
    prevAutoplayEnabledRef.current = autoplayEnabled;

    if (!autoplayEnabled) {
      cancelAutoplayPendingSendAttack();
    }

    if (!autoplayEnabled || wasEnabled) {
      return;
    }

    closeAllMenus();
    setSelectedGrassTile(null);
  }, [autoplayEnabled]);

  function isAutoplayModalDelayElapsed(openedAt: number | null): boolean {
    return (
      openedAt !== null &&
      Date.now() - openedAt >= AUTOPLAY_MODAL_DELAY_MS
    );
  }

  function openAutoplayArmyMenu() {
    setArmyMenu({
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    });
    autoplayArmyMenuOpenedAtRef.current = Date.now();
  }

  function cancelAutoplayPendingSendAttack() {
    autoplayPendingSendAttackRef.current = false;
    autoplayArmyMenuOpenedAtRef.current = null;
  }

  const autoplayTickRef = useRef<() => void>(() => {});
  autoplayTickRef.current = () => {
    if (gameOverRef.current) {
      if (
        autoplayEnabled &&
        isAutoplayModalDelayElapsed(gameOverOpenedAtRef.current)
      ) {
        resetRun();
      }
      return;
    }

    if (autoplayEnabled && autoplayPendingSendAttackRef.current) {
      if (isNight) {
        cancelAutoplayPendingSendAttack();
        return;
      }

      if (!armyMenu) {
        openAutoplayArmyMenu();
      }

      if (!isAutoplayModalDelayElapsed(autoplayArmyMenuOpenedAtRef.current)) {
        return;
      }

      cancelAutoplayPendingSendAttack();
      setArmyMenu(null);
      handleSendAttack();
      return;
    }

    if (isNight && !waveClearModal) {
      return;
    }

    const waveClearAutoplayReady =
      !autoplayEnabled ||
      isAutoplayModalDelayElapsed(waveClearOpenedAtRef.current);

    const autoplayFood = autoplayFoodRef.current;
    const autoplayArmy = autoplayArmyRef.current;

    const snapshot: AutoplaySnapshot = {
      gold,
      iron,
      wood,
      stone,
      food: autoplayFood,
      waveLevel,
      isNight,
      waveClearOpen: !!waveClearModal && waveClearAutoplayReady,
      confidence: autoplayConfidence,
      standingForestKeys,
      revealedTiles,
      builtMineKeys: builtMineKeySet,
      farmKeys,
      lumberMillKeys,
      fishingHutKeys,
      clearedObstacleKeys,
      towerOccupiedKeys,
      towers: towers.map((tower) => ({
        id: tower.id,
        gx: tower.gx,
        gz: tower.gz,
        typeId: tower.typeId,
        level: tower.level ?? 1,
      })),
      hillKeys: new Set(hillTilesByKey.keys()),
      roadKeys: globalRoadKeys,
      openKeys: autoplayOpenAndBuildable.openKeys,
      interactableKeys: interactableTileKeys,
      buildableTowerKeys: autoplayOpenAndBuildable.buildableTowerKeys,
      unusedGates: unusedEdgeGates.map((entry) => entry.edge),
      edgeGateCost: EDGE_GATE_COST,
      army: autoplayArmy,
    };

    const action = chooseAutoplayAction(snapshot);

    if (!action) {
      return;
    }

    if (action.type === "recruit") {
      const recruitPlan = planFoodRecruits({
        gold,
        iron,
        wood,
        stone,
        food: autoplayFood,
      });
      if (recruitPlan.length === 0) {
        return;
      }

      let remaining = {
        gold,
        iron,
        wood,
        stone,
        food: autoplayFood,
      };
      const nextArmy = { ...autoplayArmy };

      for (const unitId of recruitPlan) {
        remaining = spendUnitCost(remaining, unitId);
        nextArmy[unitId] += 1;
      }

      autoplayArmyRef.current = nextArmy;
      applyArmyResources(remaining);
      setArmy(nextArmy);

      queueMicrotask(() => {
        autoplayTickRef.current();
      });
      return;
    }

    switch (action.type) {
      case "cutTree":
        clearObstacleAt("tree", action.gx, action.gz);
        break;
      case "buildMine":
        buildMineAt(action.kind, action.gx, action.gz);
        break;
      case "buildFarm":
        buildFarmAt(action.gx, action.gz);
        break;
      case "buildLumberMill":
        buildLumberMillAt(action.gx, action.gz);
        break;
      case "buildFishingHut":
        buildFishingHutAt(action.gx, action.gz);
        break;
      case "placeTower":
        placeTowerAt(action.gx, action.gz, action.typeId);
        break;
      case "upgradeTower":
        handleUpgradeTower(action.towerId);
        break;
      case "unlockGate":
        handleUnlockEdgeGate(action.edge);
        break;
      case "sendAttack":
        if (autoplayEnabled) {
          autoplayPendingSendAttackRef.current = true;
          if (!armyMenu) {
            openAutoplayArmyMenu();
          }
          return;
        }
        handleSendAttack();
        break;
      case "acceptWaveClear":
        handleAcceptWaveClear();
        break;
    }
  };

  useEffect(() => {
    if (!autoplayEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      autoplayTickRef.current();
    }, AUTOPLAY_TICK_MS);

    // Run one tick soon so the bot starts immediately.
    const kickoffId = window.setTimeout(() => {
      autoplayTickRef.current();
    }, 200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(kickoffId);
    };
  }, [autoplayEnabled]);

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

  function tryCreateEnemy(typeId: EnemyTypeId): PlacedEnemy | null {
    const combatLevel = levelChain[combatLevelIndex];
    if (!combatLevel) {
      return null;
    }

    const pathCount =
      combatLevelIndex === 0 && ENABLE_MAIN_MULTI_PATH
        ? revealedPathCount
        : combatLevel.layout.paths.length;

    if (pathCount < 1) {
      return null;
    }

    const pathIndex = Math.floor(Math.random() * pathCount);
    const stats = getEnemyStats(typeId);
    const path =
      stats.movementType === "flying"
        ? getChainedFlyingWorldPath(
            levelChain,
            combatLevelIndex,
            0.12,
            pathIndex,
          )
        : getChainedWorldPath(
            levelChain,
            combatLevelIndex,
            0.12,
            pathIndex,
          );

    if (!path || path.length < 2) {
      return null;
    }

    const id = nextEnemyId.current;
    nextEnemyId.current += 1;
    return {
      id,
      typeId: stats.id,
      path,
      hp: stats.health,
      maxHp: stats.health,
    };
  }

  function handleSpawnEnemy(typeId: EnemyTypeId) {
    // Combat waves only run at night.
    if (!isNightRef.current) {
      return;
    }

    const enemy = tryCreateEnemy(typeId);
    if (!enemy) {
      return;
    }

    setEnemies((current) => [...current, enemy]);
  }

  const handleSpawnEnemyRef = useRef(handleSpawnEnemy);
  handleSpawnEnemyRef.current = handleSpawnEnemy;

  useEffect(() => {
    if (!autoSpawnEnemies || !isNight) {
      return;
    }

    const spawnRandomEnemy = () => {
      if (!isNightRef.current) {
        return;
      }
      const typeId =
        ARMY_UNIT_IDS[Math.floor(Math.random() * ARMY_UNIT_IDS.length)]!;
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
  }, [autoSpawnEnemies, isNight]);

  /** Show end-of-wave modal once the inbound night wave is fully cleared. */
  useEffect(() => {
    if (gameOverRef.current) {
      return;
    }
    if (!isNight || !nightWaveActiveRef.current) {
      return;
    }
    if (waveSpawnRemainingRef.current > 0) {
      return;
    }
    if (enemies.length > 0) {
      return;
    }
    if (waveClearModal) {
      return;
    }

    const kills = { ...nightKillsRef.current };
    const leaks = { ...nightLeaksRef.current };
    const foodReward = computeWaveFoodReward(waveLevel);
    const waveGold = computeWaveGoldReward(waveLevel);
    const armyGold = sentWaveGoldRef.current;
    const buildingGold =
      builtMines.filter((mine) => mine.kind === "gold").length *
      GOLD_MINE_INCOME;
    const buildingIron =
      builtMines.filter((mine) => mine.kind === "iron").length *
      IRON_MINE_INCOME;
    const buildingFood =
      FARM_INCOME * farms.length + FISHING_HUT_INCOME * fishingHuts.length;
    const buildingWood = LUMBER_MILL_INCOME * lumberMills.length;

    nightWaveActiveRef.current = false;
    nightKillsRef.current = {};
    nightLeaksRef.current = {};
    sentWaveGoldRef.current = 0;
    setAutoplayConfidence((current) =>
      nextAutoplayConfidence(current, countAutoplayLeaks(leaks)),
    );
    setWaveClearModal({
      kills,
      leaks,
      foodReward,
      waveGold,
      armyGold,
      buildingGold,
      buildingIron,
      buildingFood,
      buildingWood,
    });
  }, [
    enemies.length,
    isNight,
    waveClearModal,
    waveLevel,
    builtMines,
    farms.length,
    fishingHuts.length,
    lumberMills.length,
  ]);

  function handleAcceptWaveClear() {
    if (!waveClearModal || gameOverRef.current) {
      return;
    }
    const { foodReward, waveGold, armyGold, buildingGold, buildingIron, buildingFood, buildingWood } =
      waveClearModal;
    earnResource("food", foodReward + buildingFood);
    const totalGold = waveGold + armyGold + buildingGold;
    if (totalGold > 0) {
      earnResource("gold", totalGold);
    }
    if (buildingIron > 0) {
      earnResource("iron", buildingIron);
    }
    if (buildingWood > 0) {
      earnResource("wood", buildingWood);
    }
    setFood((current) => current + foodReward + buildingFood);
    if (totalGold > 0) {
      setGold((current) => current + totalGold);
    }
    if (buildingIron > 0) {
      setIron((current) => current + buildingIron);
    }
    if (buildingWood > 0) {
      setWood((current) => current + buildingWood);
    }
    setWaveLevel((current) => current + 1);
    isNightRef.current = false;
    nightWaveActiveRef.current = false;
    waveGenerationRef.current += 1;
    setIsNight(false);
    setWaveClearModal(null);
    if (canExpandMap()) {
      handleSpawn();
    }
  }

  function canExpandMap() {
    if (!freezeMapExpansion) {
      return true;
    }

    const claimedExpansions = Math.max(0, spawnedLevels.length - 1);
    return claimedExpansions < FIXED_MAP_MAX_EXPANSIONS;
  }

  function handleEnemyReachExit(enemyId: number, typeId: EnemyTypeId) {
    if (gameOverRef.current) {
      return;
    }

    nightLeaksRef.current[typeId] = (nightLeaksRef.current[typeId] ?? 0) + 1;
    recordLeak(lifetimeStatsRef.current, typeId);
    applyCastleLeakDamage(typeId);

    pendingTargetIdsRef.current.delete(enemyId);
    enemyPositionsRef.current.delete(enemyId);
    setProjectiles((current) =>
      current.filter((projectile) => projectile.targetEnemyId !== enemyId),
    );
    setEnemies((current) => current.filter((entry) => entry.id !== enemyId));
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
        const towerStats = getTowerStats(projectile.typeId);
        if (!canTowerTargetMovement(towerStats, stats.movementType)) {
          nextEnemies.push(enemy);
          continue;
        }

        const finalDamage = computeTowerDamage(
          stats,
          projectile.damage,
          projectile.damageType,
          towerStats.role,
        );
        const nextHp = enemy.hp - finalDamage;

        if (nextHp > 0) {
          nextEnemies.push({ ...enemy, hp: nextHp });
          continue;
        }

        recordKill(lifetimeStatsRef.current, enemy.typeId);
        pendingTargetIdsRef.current.delete(enemy.id);
        enemyPositionsRef.current.delete(enemy.id);
        nightKillsRef.current[enemy.typeId] =
          (nightKillsRef.current[enemy.typeId] ?? 0) + 1;
        nextEnemies.push({ ...enemy, hp: 0, dying: true });
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

  function resetRun() {
    registryRef.current.reset();
    registryRef.current.claimLayout(mainOrigin, mainLayout, 0);
    setSpawnedLevels([]);
    setActiveLevelIndex(0);
    setWaveLevel(1);
    setRevealedPathCount(ENABLE_MAIN_MULTI_PATH ? 0 : 1);
    setSelectedGrassTile(null);
    closeAllMenus();
    setTowers([]);
    setFarms([]);
    setLumberMills([]);
    setFishingHuts([]);
    setBuiltMines([]);
    setChoppedForestKeys(new Set());
    setRevealedTiles(new Map());
    setUnlockedBuildEdges([]);
    setBuildPlots([]);
    setClearedObstacleKeys(new Set());
    setEnemies([]);
    setProjectiles([]);
    setAutoSpawnEnemies(false);
    isNightRef.current = false;
    nightWaveActiveRef.current = false;
    waveSpawnRemainingRef.current = 0;
    for (const timeoutId of waveSpawnTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    waveSpawnTimeoutsRef.current = [];
    waveGenerationRef.current += 1;
    nightKillsRef.current = {};
    nightLeaksRef.current = {};
    sentWaveGoldRef.current = 0;
    setAutoplayConfidence(AUTOPLAY_CONFIDENCE_START);
    lifetimeStatsRef.current = createEmptyLifetimeStats();
    gameOverRef.current = false;
    setCastleHp(CASTLE_MAX_HEALTH);
    setGameOver(null);
    setIsNight(false);
    setWaveClearModal(null);
    cancelAutoplayPendingSendAttack();
    setGold(STARTING_GOLD);
    setIron(STARTING_IRON);
    setWood(STARTING_WOOD);
    setStone(STARTING_STONE);
    setFood(STARTING_FOOD);
    autoplayFoodRef.current = STARTING_FOOD;
    const emptyArmy = createEmptyArmy();
    autoplayArmyRef.current = emptyArmy;
    setArmy(emptyArmy);
    enemyPositionsRef.current.clear();
    pendingTargetIdsRef.current.clear();
    nextChunkId.current = 0;
    nextTowerId.current = 0;
    nextEnemyId.current = 0;
    nextBuildPlotId.current = 0;

    const preview = tryCreateNextLevel([]);
    setSpawnedLevels(preview ? [preview] : []);
  }

  useEffect(() => {
    resetRun();
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

  function handleCastleClick(pointer: { clientX: number; clientY: number }) {
    if (gameOverRef.current) {
      return;
    }
    closeAllMenus();
    setSelectedGrassTile(null);
    const pos = menuPointer(pointer, containerRef.current);
    setArmyMenu({
      clientX: pos.clientX,
      clientY: pos.clientY,
    });
  }

  function handleRecruitArmyUnit(unitId: ArmyUnitId) {
    if (isNight) {
      return;
    }
    const resources = currentArmyResources();
    if (!canAffordUnit(unitId, resources)) {
      return;
    }
    const nextArmy = {
      ...autoplayArmyRef.current,
      [unitId]: autoplayArmyRef.current[unitId] + 1,
    };
    autoplayArmyRef.current = nextArmy;
    applyArmyResources(spendUnitCost(resources, unitId));
    setArmy(nextArmy);
  }

  function handleClearArmy() {
    if (isNight) {
      return;
    }

    const currentArmy = autoplayArmyRef.current;
    if (armyTotal(currentArmy) < 1) {
      return;
    }

    const refund = armyResourcesSpent(currentArmy);
    const resources = currentArmyResources();
    const emptyArmy = createEmptyArmy();

    autoplayArmyRef.current = emptyArmy;
    applyArmyResources({
      gold: resources.gold + refund.gold,
      iron: resources.iron + refund.iron,
      wood: resources.wood + refund.wood,
      stone: resources.stone + refund.stone,
      food: resources.food + refund.food,
    });
    setArmy(emptyArmy);
  }

  function handleSendAttack() {
    if (gameOverRef.current) {
      return;
    }
    // Use the ref — React state lags a frame, so a double-click can queue the wave twice.
    if (isNightRef.current || nightWaveActiveRef.current) {
      return;
    }
    const currentArmy = autoplayArmyRef.current;
    const total = armyTotal(currentArmy);
    if (total < 1) {
      return;
    }

    // Exact copy of the player's sent roster (1:1 inbound wave).
    const raid = { ...currentArmy };
    sentWaveGoldRef.current = armyGoldIncome(raid);
    const queue: ArmyUnitId[] = [];
    for (const unitId of ARMY_UNIT_IDS) {
      for (let i = 0; i < raid[unitId]; i += 1) {
        queue.push(unitId);
      }
    }
    if (queue.length < 1) {
      return;
    }

    // Randomise inbound spawn order (same units, shuffled).
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = queue[i]!;
      queue[i] = queue[j]!;
      queue[j] = tmp;
    }

    // Lock night immediately so a second click cannot re-queue this roster.
    isNightRef.current = true;
    nightWaveActiveRef.current = true;
    waveGenerationRef.current += 1;
    const waveGeneration = waveGenerationRef.current;

    const emptyArmy = createEmptyArmy();
    autoplayArmyRef.current = emptyArmy;
    setArmy(emptyArmy);

    for (const timeoutId of waveSpawnTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    waveSpawnTimeoutsRef.current = [];

    waveSpawnRemainingRef.current = queue.length;
    nightKillsRef.current = {};
    nightLeaksRef.current = {};
    setIsNight(true);
    setArmyMenu(null);
    setWaveClearModal(null);

    const staggerMs = getWaveSpawnStaggerMs(waveLevel);

    queue.forEach((unitId, index) => {
      const timeoutId = window.setTimeout(() => {
        if (waveGenerationRef.current !== waveGeneration) {
          return;
        }
        if (!isNightRef.current) {
          waveSpawnRemainingRef.current = Math.max(
            0,
            waveSpawnRemainingRef.current - 1,
          );
          return;
        }
        const enemy = tryCreateEnemy(unitId);
        if (enemy) {
          setEnemies((current) => [...current, enemy]);
        }
        waveSpawnRemainingRef.current = Math.max(
          0,
          waveSpawnRemainingRef.current - 1,
        );
        // Re-check clear when the last queued spawn finishes and map is empty.
        if (waveSpawnRemainingRef.current === 0) {
          setEnemies((current) => [...current]);
        }
      }, index * staggerMs);
      waveSpawnTimeoutsRef.current.push(timeoutId);
    });
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

  const obstacleClearCost =
    obstacleClearMenu?.kind === "rock" ? ROCK_CLEAR_COST : TREE_CLEAR_COST;
  const obstacleYieldResource =
    obstacleClearMenu?.kind === "rock" ? ("stone" as const) : ("wood" as const);
  const obstacleYieldAmount =
    obstacleClearMenu?.kind === "rock" ? ROCK_CLEAR_STONE : TREE_CLEAR_WOOD;
  const tileMenuOpen = Boolean(
    towerPlaceMenu ||
      towerManageMenu ||
      edgeGateMenu ||
      farmPlaceMenu ||
      lumberMillPlaceMenu ||
      fishingHutPlaceMenu ||
      minePlaceMenu ||
      obstacleClearMenu,
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [13, 16, 13], fov: 45 }}>
        <SceneRaycastGate enabled={perf.raycast} />
        <DayNightCycle isNight={isNight} />
        <DaySkyClouds isNight={isNight} />
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
                    standingForestKeys={standingForestKeys}
                    revealedTiles={revealedTiles}
                    builtMines={builtMines}
                    farms={farms}
                    lumberMills={lumberMills}
                    fishingHutKeys={fishingHutKeys}
                    clearedObstacleKeys={clearedObstacleKeys}
                    selectedTileKey={selectedTileKey}
                    onSelectTile={
                      isNextPreview ? undefined : handleSelectGrassTile
                    }
                    onSelectTreeTile={
                      isNextPreview ? undefined : handleSelectTreeTile
                    }
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
          standingForestKeys={standingForestKeys}
          revealedTiles={revealedTiles}
          builtMines={builtMines}
          farms={farms}
          lumberMills={lumberMills}
          fishingHutKeys={fishingHutKeys}
          clearedObstacleKeys={clearedObstacleKeys}
          revealedPathCount={
            ENABLE_MAIN_MULTI_PATH ? revealedPathCount : undefined
          }
          selectedTileKey={selectedTileKey}
          onSelectTile={handleSelectGrassTile}
          onSelectTreeTile={handleSelectTreeTile}
        />
        {perf.grass
          ? buildPlots.map((plot) => (
              <ForestGround
                key={`build-plot-${plot.id}`}
                plot={plot}
                standingForestKeys={standingForestKeys}
                revealedTiles={revealedTiles}
                builtMines={builtMines}
                farms={farms}
                lumberMills={lumberMills}
                fishingHutKeys={fishingHutKeys}
                clearedObstacleKeys={clearedObstacleKeys}
                isGlobalRoad={isGlobalRoad}
                showMountains={perf.mountains}
                selectedTileKey={selectedTileKey}
                onSelectTile={handleSelectGrassTile}
                onSelectTreeTile={handleSelectTreeTile}
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
                onSelectTile={
                  group.opacity < 1 ? undefined : handleSelectGrassTile
                }
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
                  moveSpeed={getEnemyMoveSpeedForWave(stats.moveSpeed, waveLevel)}
                  movementType={stats.movementType}
                  hp={enemy.hp}
                  maxHp={enemy.maxHp}
                  dying={enemy.dying}
                  paused={!isNight}
                  onReachExit={() => handleEnemyReachExit(enemy.id, enemy.typeId)}
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
            enemyTargets={enemies
              .filter((enemy) => !enemy.dying)
              .map((enemy) => ({
                id: enemy.id,
                movementType: getEnemyStats(enemy.typeId).movementType,
                hp: enemy.hp,
              }))}
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
        {perf.combat && towerAttackRangePreview ? (
          <TowerAttackRadiusPreview
            gx={towerAttackRangePreview.gx}
            gz={towerAttackRangePreview.gz}
            attackRangeTiles={towerAttackRangePreview.attackRangeTiles}
          />
        ) : null}
        {perf.combat
          ? towers.map((tower) => {
              const { x, z } = globalTileWorldPosition(tower.gx, tower.gz);
              const groundY = tower.groundY ?? 0;

              return (
                <group key={tower.id}>
                  <TowerModel
                    typeId={tower.typeId}
                    position={[x, groundY, z]}
                  />
                  <DebugHitbox
                    size={[1, 1.1, 1]}
                    position={[x, groundY + 0.55, z]}
                    color="#c084fc"
                  />
                </group>
              );
            })
          : null}
        {perf.castle ? (
          <group position={[castleWorld.x, 0, castleWorld.z]}>
            <CastleModel
              position={[0, 0, 0]}
              onClick={gameOver ? undefined : handleCastleClick}
            />
            {!gameOver ? (
              <CastleHealthBar hp={castleHp} maxHp={CASTLE_MAX_HEALTH} />
            ) : null}
          </group>
        ) : null}
        <WorldMenuProjector
          worldPosition={anchoredMenuWorldPosition}
          targetRef={menuAnchorRef}
        />
        <GroundOrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-10">
        {tileMenuOpen ? (
          <button
            type="button"
            aria-label="Close tile menu"
            className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-black/20"
            onClick={(event) => {
              event.stopPropagation();
              dismissAnchoredMenus();
            }}
          />
        ) : null}
        {towerPlaceMenu ? (
          <TowerPlaceMenu
            ref={menuAnchorRef}
            menu={towerPlaceMenu}
            gold={gold}
            iron={iron}
            wood={wood}
            onSelect={handlePlaceTowerFromMenu}
            onClose={dismissAnchoredMenus}
            onHoverType={setTowerPlaceHoverTypeId}
          />
        ) : null}
        {towerManageMenu ? (
          <TowerManageMenu
            ref={menuAnchorRef}
            menu={towerManageMenu}
            gold={gold}
            onUpgrade={handleUpgradeTower}
            onDestroy={handleDestroyTower}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {edgeGateMenu ? (
          <EdgeGateMenu
            ref={menuAnchorRef}
            menu={edgeGateMenu}
            gold={gold}
            onUnlock={handleUnlockEdgeGate}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {farmPlaceMenu ? (
          <FarmPlaceMenu
            ref={menuAnchorRef}
            menu={farmPlaceMenu}
            gold={gold}
            iron={iron}
            wood={wood}
            onBuild={handleBuildFarm}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {lumberMillPlaceMenu ? (
          <LumberMillPlaceMenu
            ref={menuAnchorRef}
            menu={lumberMillPlaceMenu}
            gold={gold}
            onBuild={handleBuildLumberMill}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {fishingHutPlaceMenu ? (
          <FishingHutPlaceMenu
            ref={menuAnchorRef}
            menu={fishingHutPlaceMenu}
            gold={gold}
            wood={wood}
            onBuild={handleBuildFishingHut}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {minePlaceMenu ? (
          <MinePlaceMenu
            ref={menuAnchorRef}
            menu={minePlaceMenu}
            gold={gold}
            onBuild={handleBuildMine}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {obstacleClearMenu ? (
          <ObstacleClearMenu
            ref={menuAnchorRef}
            menu={obstacleClearMenu}
            gold={gold}
            cost={obstacleClearCost}
            yieldResource={obstacleYieldResource}
            yieldAmount={obstacleYieldAmount}
            onClear={handleClearObstacle}
            onClose={dismissAnchoredMenus}
          />
        ) : null}
        {armyMenu ? (
          <CastleArmyMenu
            menu={armyMenu}
            army={army}
            gold={gold}
            iron={iron}
            wood={wood}
            stone={stone}
            food={food}
            waveLevel={waveLevel}
            farmCount={farms.length}
            lumberMillCount={lumberMills.length}
            fishingHutCount={fishingHuts.length}
            goldMineCount={
              builtMines.filter((mine) => mine.kind === "gold").length
            }
            ironMineCount={
              builtMines.filter((mine) => mine.kind === "iron").length
            }
            isDay={!isNight}
            onRecruit={handleRecruitArmyUnit}
            onClear={handleClearArmy}
            onSendAttack={handleSendAttack}
            onClose={() => {
              if (autoplayPendingSendAttackRef.current) {
                cancelAutoplayPendingSendAttack();
              }
              setArmyMenu(null);
            }}
          />
        ) : null}
        {gameOver ? (
          <GameOverModal stats={gameOver} onPlayAgain={resetRun} />
        ) : null}
        {waveClearModal ? (
          <WaveClearModal
            result={waveClearModal}
            onAccept={handleAcceptWaveClear}
          />
        ) : null}
      </div>
    </div>
  );
}
