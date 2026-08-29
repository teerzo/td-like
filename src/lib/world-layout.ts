import {
  SPAWN_TERRAIN_SIZE_MAX,
  SPAWN_TERRAIN_SIZE_MIN,
  TILE_SPACING,
  TERRAIN_SIZE,
  tileWorldPosition,
} from "@/lib/terrain";

export type GridCoord = {
  x: number;
  z: number;
};

export type RoadPath = {
  entrance: GridCoord;
  gate: GridCoord;
  exit: GridCoord;
  roadKeys: ReadonlySet<string>;
};

export type WorldLayout = {
  size: number;
  castle: GridCoord;
  paths: RoadPath[];
  /** Primary path aliases (paths[0]) for spawn chaining and legacy call sites. */
  exit: GridCoord;
  gate: GridCoord;
  entrance: GridCoord;
  /** Union of all path road keys. */
  roadKeys: ReadonlySet<string>;
};

type Edge = "north" | "south" | "west" | "east";

export type LevelEdge = Edge;

const ALL_EDGES: Edge[] = ["north", "south", "west", "east"];

/**
 * When true, main layout packs up to 4 isolated paths and play-scene can reveal them.
 * Kept off for now; multi-path helpers remain for later reuse.
 */
export const ENABLE_MAIN_MULTI_PATH = false;

/** Tiles inward from each corner that entrance/exit may not use (0 = corner tile only). */
export const ENTRANCE_CORNER_MARGIN = 1;

/** Spawned levels keep one extra tile of clearance from corners. */
export const SPAWN_ENTRANCE_CORNER_MARGIN = ENTRANCE_CORNER_MARGIN + 1;

function coordKey(coord: GridCoord) {
  return `${coord.x}:${coord.z}`;
}

export function syncLayoutFromPaths(
  size: number,
  castle: GridCoord,
  paths: RoadPath[],
): WorldLayout {
  if (paths.length === 0) {
    throw new Error("WorldLayout requires at least one path.");
  }

  const primary = paths[0]!;
  const roadKeys = new Set<string>();

  for (const path of paths) {
    for (const key of path.roadKeys) {
      roadKeys.add(key);
    }
  }

  return {
    size,
    castle,
    paths,
    entrance: primary.entrance,
    gate: primary.gate,
    exit: primary.exit,
    roadKeys,
  };
}

export function getLayoutPaths(layout: WorldLayout): RoadPath[] {
  return layout.paths;
}

function effectiveCornerMargin(size: number, preferredMargin: number) {
  for (let margin = preferredMargin; margin >= 0; margin -= 1) {
    if (margin + 1 <= size - margin - 2) {
      return margin;
    }
  }

  throw new Error(`Map size ${size} is too small for edge entrance placement.`);
}

/** Valid positions along an edge (0…size−1), inset from corners. */
export function getValidEntranceAlongIndices(
  size: number,
  cornerMargin = ENTRANCE_CORNER_MARGIN,
) {
  if (size < 3) {
    throw new Error(`Map size ${size} is too small for edge entrance placement.`);
  }

  const margin = effectiveCornerMargin(size, cornerMargin);
  const min = margin + 1;
  const max = size - margin - 2;
  const indices: number[] = [];

  for (let along = min; along <= max; along += 1) {
    indices.push(along);
  }

  return indices;
}

function pickRandomEdgeTile(
  size: number,
  random: () => number,
): { entrance: GridCoord; edge: Edge } {
  const edge = ALL_EDGES[Math.floor(random() * ALL_EDGES.length)]!;
  const entrance = pickEntranceOnEdge(edge, size, random);

  return { entrance, edge };
}

function pickEntranceOnEdge(
  edge: Edge,
  size: number,
  random: () => number,
): GridCoord {
  const validAlong = getValidEntranceAlongIndices(size);
  const along = validAlong[Math.floor(random() * validAlong.length)]!;

  switch (edge) {
    case "north":
      return { x: along, z: -1 };
    case "south":
      return { x: along, z: size };
    case "west":
      return { x: -1, z: along };
    case "east":
      return { x: size, z: along };
  }
}

function getGridGate(entrance: GridCoord, size: number): GridCoord {
  if (entrance.z < 0) {
    return { x: entrance.x, z: 0 };
  }
  if (entrance.z >= size) {
    return { x: entrance.x, z: size - 1 };
  }
  if (entrance.x < 0) {
    return { x: 0, z: entrance.z };
  }
  return { x: size - 1, z: entrance.z };
}

type PathDir = {
  dx: number;
  dz: number;
};

const PATH_DIRS: PathDir[] = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
];

function manhattanDistance(a: GridCoord, b: GridCoord) {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function addPathStep(coord: GridCoord, dir: PathDir): GridCoord {
  return { x: coord.x + dir.dx, z: coord.z + dir.dz };
}

/** Minimum stride keeps at least one grass tile between parallel legs. */
const MIN_SERPENTINE_STRIDE = 2;

function randomSerpentineStride(random: () => number) {
  return random() < 0.7
    ? MIN_SERPENTINE_STRIDE
    : MIN_SERPENTINE_STRIDE + 1;
}

function generateLinePath(start: GridCoord, end: GridCoord): GridCoord[] {
  const points: GridCoord[] = [{ ...start }];
  let x = start.x;
  let z = start.z;

  while (x !== end.x) {
    x += Math.sign(end.x - x);
    points.push({ x, z });
  }

  while (z !== end.z) {
    z += Math.sign(end.z - z);
    points.push({ x, z });
  }

  return points;
}

function countPathTurns(points: GridCoord[]) {
  if (points.length < 3) {
    return 0;
  }

  let turns = 0;
  let prevDx = points[1]!.x - points[0]!.x;
  let prevDz = points[1]!.z - points[0]!.z;

  for (let index = 2; index < points.length; index += 1) {
    const dx = points[index]!.x - points[index - 1]!.x;
    const dz = points[index]!.z - points[index - 1]!.z;

    if (dx !== prevDx || dz !== prevDz) {
      turns += 1;
    }

    prevDx = dx;
    prevDz = dz;
  }

  return turns;
}

function collectRoadPathPoints(
  entrance: GridCoord,
  gate: GridCoord,
  exit: GridCoord,
  size: number,
  random: () => number,
) {
  const gateToExit = generateSerpentinePath(gate, exit, size, random);

  return [...generateLinePath(entrance, gate), ...gateToExit.slice(1)];
}

/** Collapse self-crossings so the walk becomes a single non-branching polyline. */
function polylineToSimpleRoadKeys(points: GridCoord[]): ReadonlySet<string> {
  const path: GridCoord[] = [];
  const indexByKey = new Map<string, number>();

  for (const point of points) {
    const key = coordKey(point);
    const existingIndex = indexByKey.get(key);

    if (existingIndex !== undefined) {
      path.splice(existingIndex + 1);
      indexByKey.clear();

      for (let index = 0; index < path.length; index += 1) {
        indexByKey.set(coordKey(path[index]!), index);
      }

      continue;
    }

    indexByKey.set(key, path.length);
    path.push({ ...point });
  }

  return new Set(path.map((coord) => coordKey(coord)));
}

function isOuterEdgeTile(x: number, z: number, size: number) {
  return x === 0 || x === size - 1 || z === 0 || z === size - 1;
}

function stepInwardFromEdge(coord: GridCoord, size: number): GridCoord | null {
  if (coord.z === 0) {
    return { x: coord.x, z: 1 };
  }

  if (coord.z === size - 1) {
    return { x: coord.x, z: size - 2 };
  }

  if (coord.x === 0) {
    return { x: 1, z: coord.z };
  }

  if (coord.x === size - 1) {
    return { x: size - 2, z: coord.z };
  }

  return null;
}

/** Back-and-forth path with tower lanes between each leg. */
function generateSerpentinePath(
  start: GridCoord,
  end: GridCoord,
  size: number,
  random: () => number,
): GridCoord[] {
  const points: GridCoord[] = [{ ...start }];
  let x = start.x;
  let z = start.z;

  const boundMin = 1;
  const boundMax = size - 2;
  let sweepPositive = random() < 0.5;

  const deltaX = Math.abs(end.x - start.x);
  const deltaZ = Math.abs(end.z - start.z);
  const sweepX =
    deltaX === deltaZ ? random() < 0.5 : deltaZ >= deltaX;

  const atEnd = () => x === end.x && z === end.z;

  let turnsMade = 0;

  const stepTo = (nextX: number, nextZ: number) => {
    if (atEnd()) {
      return;
    }

    const from = points[points.length - 1]!;
    const dx = nextX - from.x;
    const dz = nextZ - from.z;

    if (points.length >= 2) {
      const prev = points[points.length - 2]!;
      const prevDx = from.x - prev.x;
      const prevDz = from.z - prev.z;

      if (dx !== prevDx || dz !== prevDz) {
        turnsMade += 1;
      }
    }

    x = nextX;
    z = nextZ;
    points.push({ x, z });
  };

  if (isOuterEdgeTile(x, z, size)) {
    const inward = stepInwardFromEdge({ x, z }, size);

    if (inward) {
      stepTo(inward.x, inward.z);
    }
  }

  const onSameColumn = x === end.x;
  const onSameRow = z === end.z;

  if ((onSameColumn || onSameRow) && !atEnd()) {
    if (onSameColumn) {
      const dir =
        x <= boundMin ? 1 : x >= boundMax ? -1 : random() < 0.5 ? 1 : -1;
      stepTo(
        Math.max(boundMin, Math.min(boundMax, x + dir)),
        z,
      );
    } else {
      const dir =
        z <= boundMin ? 1 : z >= boundMax ? -1 : random() < 0.5 ? 1 : -1;
      stepTo(
        x,
        Math.max(boundMin, Math.min(boundMax, z + dir)),
      );
    }
  }

  while (!atEnd()) {
    const stride = randomSerpentineStride(random);

    if (sweepX) {
      const targetX = sweepPositive ? boundMax : boundMin;

      while (x !== targetX && !atEnd()) {
        if (Math.abs(end.z - z) <= stride && x === end.x) {
          break;
        }

        stepTo(x + Math.sign(targetX - x), z);
      }

      if (atEnd()) {
        break;
      }

      if (z === end.z && turnsMade >= 1) {
        while (x !== end.x) {
          stepTo(x + Math.sign(end.x - x), z);
        }
        break;
      }

      const remaining = end.z - z;
      const steps = Math.min(stride, Math.abs(remaining));

      for (let step = 0; step < steps; step += 1) {
        stepTo(x, z + Math.sign(remaining));
      }

      sweepPositive = !sweepPositive;
    } else {
      const targetZ = sweepPositive ? boundMax : boundMin;

      while (z !== targetZ && !atEnd()) {
        if (Math.abs(end.x - x) <= stride && z === end.z) {
          break;
        }

        stepTo(x, z + Math.sign(targetZ - z));
      }

      if (atEnd()) {
        break;
      }

      if (x === end.x && turnsMade >= 1) {
        while (z !== end.z) {
          stepTo(x, z + Math.sign(end.z - z));
        }
        break;
      }

      const remaining = end.x - x;
      const steps = Math.min(stride, Math.abs(remaining));

      for (let step = 0; step < steps; step += 1) {
        stepTo(x + Math.sign(remaining), z);
      }

      sweepPositive = !sweepPositive;
    }
  }

  if (!atEnd()) {
    const tail = generateLinePath({ x, z }, end);
    points.push(...tail.slice(1));
  }

  return points;
}

const MIN_PATH_TURNS = 1;
const MAX_LAYOUT_ATTEMPTS = 64;

function insertGateDetour(
  points: GridCoord[],
  gate: GridCoord,
  size: number,
): GridCoord[] {
  const boundMin = 1;
  const boundMax = size - 2;
  const gateIndex = points.findIndex(
    (point) => point.x === gate.x && point.z === gate.z,
  );

  if (gateIndex === -1) {
    return points;
  }

  const gatePoint = points[gateIndex]!;
  const detourX =
    gatePoint.x <= boundMin
      ? gatePoint.x + 1
      : gatePoint.x >= boundMax
        ? gatePoint.x - 1
        : gatePoint.x + 1;
  const detour = [
    { x: detourX, z: gatePoint.z },
    { x: detourX, z: Math.max(boundMin, Math.min(boundMax, gatePoint.z + 1)) },
    { x: gatePoint.x, z: Math.max(boundMin, Math.min(boundMax, gatePoint.z + 1)) },
    gatePoint,
  ];

  return [
    ...points.slice(0, gateIndex + 1),
    ...detour.slice(1),
    ...points.slice(gateIndex + 1),
  ];
}

function generateRoadPathWithTurns(
  entrance: GridCoord,
  gate: GridCoord,
  exit: GridCoord,
  size: number,
  random: () => number,
): ReadonlySet<string> {
  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
    const points = collectRoadPathPoints(entrance, gate, exit, size, random);

    if (countPathTurns(points) >= MIN_PATH_TURNS) {
      return polylineToSimpleRoadKeys(points);
    }
  }

  let points = collectRoadPathPoints(entrance, gate, exit, size, random);

  if (countPathTurns(points) < MIN_PATH_TURNS) {
    points = insertGateDetour(points, gate, size);
  }

  return polylineToSimpleRoadKeys(points);
}

function collectPreviewRoadPathPoints(
  entrance: GridCoord,
  gate: GridCoord,
  exit: GridCoord,
  size: number,
  random: () => number,
) {
  let points = collectRoadPathPoints(entrance, gate, exit, size, random);

  if (countPathTurns(points) < MIN_PATH_TURNS) {
    points = insertGateDetour(points, gate, size);
  }

  return points;
}

function generatePreviewRoadKeys(
  entrance: GridCoord,
  gate: GridCoord,
  exit: GridCoord,
  size: number,
  random: () => number,
): ReadonlySet<string> {
  const points = collectPreviewRoadPathPoints(
    entrance,
    gate,
    exit,
    size,
    random,
  );

  return polylineToSimpleRoadKeys(points);
}

function pickCastleExit(
  castle: GridCoord,
  gate: GridCoord,
  size: number,
  random: () => number,
  excludeExitKeys: ReadonlySet<string> = new Set(),
): GridCoord | null {
  const neighbors = PATH_DIRS.map((dir) => addPathStep(castle, dir)).filter(
    (coord) =>
      isOnGrid(coord.x, coord.z, size) &&
      !excludeExitKeys.has(coordKey(coord)),
  );

  if (neighbors.length === 0) {
    return null;
  }

  const towardGate = neighbors
    .map((coord) => ({
      coord,
      progress:
        manhattanDistance(castle, gate) - manhattanDistance(coord, gate),
    }))
    .filter(({ progress }) => progress > 0);

  if (towardGate.length === 0) {
    return neighbors[Math.floor(random() * neighbors.length)]!;
  }

  const bestProgress = Math.max(...towardGate.map(({ progress }) => progress));
  const candidates = towardGate
    .filter(({ progress }) => progress === bestProgress)
    .map(({ coord }) => coord);

  return candidates[Math.floor(random() * candidates.length)]!;
}

function getCastleNeighborCoords(
  castle: GridCoord,
  size: number,
): GridCoord[] {
  return PATH_DIRS.map((dir) => addPathStep(castle, dir)).filter((coord) =>
    isOnGrid(coord.x, coord.z, size),
  );
}

export function canAddMainLevelPath(layout: WorldLayout): boolean {
  const usedEdges = new Set(
    layout.paths.map((path) => getEntranceEdge(path.entrance, layout.size)),
  );

  if (ALL_EDGES.every((edge) => usedEdges.has(edge))) {
    return false;
  }

  const usedExits = new Set(layout.paths.map((path) => coordKey(path.exit)));

  return getCastleNeighborCoords(layout.castle, layout.size).some(
    (coord) => !usedExits.has(coordKey(coord)),
  );
}

const MAX_ADD_PATH_ATTEMPTS = 64;

/** True when sets share a tile or any new tile is cardinally adjacent to an existing road. */
function pathConnectsToExistingRoads(
  newRoadKeys: ReadonlySet<string>,
  existingRoadKeys: ReadonlySet<string>,
): boolean {
  for (const key of newRoadKeys) {
    if (existingRoadKeys.has(key)) {
      return true;
    }

    const [x, z] = key.split(":").map(Number);

    for (const { dx, dz } of PATH_DIRS) {
      if (existingRoadKeys.has(coordKey({ x: x + dx, z: z + dz }))) {
        return true;
      }
    }
  }

  return false;
}

export function addMainLevelPath(
  layout: WorldLayout,
  random: () => number = Math.random,
  options?: { edge?: LevelEdge },
): WorldLayout | null {
  if (!canAddMainLevelPath(layout)) {
    return null;
  }

  const usedEdges = new Set(
    layout.paths.map((path) => getEntranceEdge(path.entrance, layout.size)),
  );
  const freeEdges = ALL_EDGES.filter((edge) => !usedEdges.has(edge));
  const candidateEdges = options?.edge
    ? freeEdges.includes(options.edge)
      ? [options.edge]
      : []
    : freeEdges;

  if (candidateEdges.length === 0) {
    return null;
  }

  const usedExits = new Set(layout.paths.map((path) => coordKey(path.exit)));

  for (let attempt = 0; attempt < MAX_ADD_PATH_ATTEMPTS; attempt += 1) {
    const edge =
      candidateEdges[Math.floor(random() * candidateEdges.length)]!;
    const entrance = pickEntranceOnEdge(edge, layout.size, random);
    const gate = getGridGate(entrance, layout.size);
    const exit = pickCastleExit(
      layout.castle,
      gate,
      layout.size,
      random,
      usedExits,
    );

    if (!exit) {
      return null;
    }

    const draft = syncLayoutFromPaths(layout.size, layout.castle, [
      {
        entrance,
        gate,
        exit,
        roadKeys: generateRoadPathWithTurns(
          entrance,
          gate,
          exit,
          layout.size,
          random,
        ),
      },
    ]);
    const finalized = finalizeRoadGraph(draft);

    if (!finalized) {
      continue;
    }

    const newPath = finalized.paths[0]!;

    if (pathConnectsToExistingRoads(newPath.roadKeys, layout.roadKeys)) {
      continue;
    }

    return syncLayoutFromPaths(layout.size, layout.castle, [
      ...layout.paths,
      newPath,
    ]);
  }

  return null;
}

/** Edges of the main grid that do not yet have a path entrance. */
export function getUnusedEntranceEdges(layout: WorldLayout): LevelEdge[] {
  const usedEdges = new Set(
    layout.paths.map((path) => getEntranceEdge(path.entrance, layout.size)),
  );

  return ALL_EDGES.filter((edge) => !usedEdges.has(edge));
}

/** On-grid perimeter tile at the center of an edge (locked gate location). */
export function getEdgeGateTile(edge: LevelEdge, size: number): GridCoord {
  const mid = Math.floor(size / 2);

  switch (edge) {
    case "north":
      return { x: mid, z: 0 };
    case "south":
      return { x: mid, z: size - 1 };
    case "west":
      return { x: 0, z: mid };
    case "east":
      return { x: size - 1, z: mid };
  }
}

export function getEntranceEdge(
  entrance: GridCoord,
  size: number,
): Edge {
  if (entrance.z < 0) {
    return "north";
  }

  if (entrance.z >= size) {
    return "south";
  }

  if (entrance.x < 0) {
    return "west";
  }

  return "east";
}

function getOppositeEdge(edge: Edge): Edge {
  switch (edge) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "west":
      return "east";
    case "east":
      return "west";
  }
}

export type SpawnTurn = "straight" | "left" | "right";

function inwardVectorForEdge(edge: Edge) {
  switch (edge) {
    case "north":
      return { x: 0, z: 1 };
    case "south":
      return { x: 0, z: -1 };
    case "west":
      return { x: 1, z: 0 };
    case "east":
      return { x: -1, z: 0 };
  }
}

function edgeCenterCoord(edge: Edge, size: number): GridCoord {
  const center = Math.floor(size / 2);

  switch (edge) {
    case "north":
      return { x: center, z: -1 };
    case "south":
      return { x: center, z: size };
    case "west":
      return { x: -1, z: center };
    case "east":
      return { x: size, z: center };
  }
}

function getEntranceEdgeForTurn(exitEdge: Edge, turn: SpawnTurn): LevelEdge {
  if (turn === "straight") {
    return getOppositeEdge(exitEdge);
  }

  const inward = inwardVectorForEdge(exitEdge);
  const exitCoord = edgeCenterCoord(exitEdge, TERRAIN_SIZE);
  const adjacent = ALL_EDGES.filter(
    (edge) => edge !== exitEdge && edge !== getOppositeEdge(exitEdge),
  );

  for (const edge of adjacent) {
    const entranceCoord = edgeCenterCoord(edge, TERRAIN_SIZE);
    const toEntrance = {
      x: entranceCoord.x - exitCoord.x,
      z: entranceCoord.z - exitCoord.z,
    };
    const crossY = inward.x * toEntrance.z - inward.z * toEntrance.x;
    const isLeft = crossY > 0;

    if (turn === "left" && isLeft) {
      return edge;
    }

    if (turn === "right" && !isLeft) {
      return edge;
    }
  }

  throw new Error(`Unable to resolve ${turn} turn from ${exitEdge} exit.`);
}

function getParentExitEdge(parentLayout: WorldLayout): Edge {
  const connectionEdge = getEntranceEdge(
    parentLayout.entrance,
    parentLayout.size,
  );

  return getOppositeEdge(connectionEdge);
}

/** Classify how a spawned level routes from its exit to its entrance. */
export function getLayoutSpawnTurn(layout: WorldLayout): SpawnTurn {
  const exitEdge = getEntranceEdge(layout.exit, layout.size);
  const entranceEdge = getEntranceEdge(layout.entrance, layout.size);

  if (entranceEdge === getOppositeEdge(exitEdge)) {
    return "straight";
  }

  const inward = inwardVectorForEdge(exitEdge);
  const toEntrance = {
    x: layout.entrance.x - layout.exit.x,
    z: layout.entrance.z - layout.exit.z,
  };
  const crossY = inward.x * toEntrance.z - inward.z * toEntrance.x;

  return crossY > 0 ? "left" : "right";
}

/** Derive left/right blocks from prior spawned turns. */
export function getSpawnTurnBlocks(spawnTurns: readonly SpawnTurn[]) {
  let blockLeft = false;
  let blockRight = false;

  for (const turn of spawnTurns) {
    if (turn === "left") {
      blockRight = false;
      blockLeft = true;
    } else if (turn === "right") {
      blockLeft = false;
      blockRight = true;
    }
  }

  return { blockLeft, blockRight };
}

/** Pick straight, left, or right before building the next level. */
export function pickPreviewSpawnTurn(
  parentLayout: WorldLayout,
  options: { blockLeft?: boolean; blockRight?: boolean } = {},
  random: () => number = Math.random,
): SpawnTurn {
  const candidates = (["straight", "left", "right"] as const).filter((turn) => {
    if (turn === "left" && options.blockLeft) {
      return false;
    }

    if (turn === "right" && options.blockRight) {
      return false;
    }

    return true;
  });

  return candidates[Math.floor(random() * candidates.length)]!;
}

/** Map a spawn turn choice to the entrance edge for layout generation. */
export function getEntranceEdgeForSpawnTurn(
  parentLayout: WorldLayout,
  turn: SpawnTurn,
): LevelEdge {
  return getEntranceEdgeForTurn(getParentExitEdge(parentLayout), turn);
}

function pickRandomAlongEdge(
  size: number,
  random: () => number,
  cornerMargin = ENTRANCE_CORNER_MARGIN,
) {
  const validAlong = getValidEntranceAlongIndices(size, cornerMargin);

  return validAlong[Math.floor(random() * validAlong.length)]!;
}

function pickRandomPreviewEntrance(
  entranceEdge: Edge,
  size: number,
  random: () => number,
): GridCoord {
  return connectionCoordOnEdge(
    entranceEdge,
    size,
    pickRandomAlongEdge(size, random, SPAWN_ENTRANCE_CORNER_MARGIN),
  );
}

function previewEntranceExitOppositeSides(layout: WorldLayout) {
  const entranceEdge = getEntranceEdge(layout.entrance, layout.size);
  const exitEdge = getEntranceEdge(layout.exit, layout.size);

  return entranceEdge !== exitEdge;
}

function mapAlongToPreviewSize(
  entrance: GridCoord,
  fromSize: number,
  toSize: number,
  fromMargin = ENTRANCE_CORNER_MARGIN,
  toMargin = SPAWN_ENTRANCE_CORNER_MARGIN,
): number {
  const edge = getEntranceEdge(entrance, fromSize);
  const validFrom = getValidEntranceAlongIndices(fromSize, fromMargin);
  const validTo = getValidEntranceAlongIndices(toSize, toMargin);
  const fromMin = validFrom[0]!;
  const fromMax = validFrom[validFrom.length - 1]!;
  const toMin = validTo[0]!;
  const toMax = validTo[validTo.length - 1]!;
  const rawAlong =
    edge === "north" || edge === "south" ? entrance.x : entrance.z;
  const span = fromMax - fromMin || 1;
  const t = (rawAlong - fromMin) / span;

  return Math.round(toMin + t * (toMax - toMin));
}

function connectionCoordOnEdge(
  edge: Edge,
  size: number,
  along: number,
): GridCoord {
  switch (edge) {
    case "north":
      return { x: along, z: -1 };
    case "south":
      return { x: along, z: size };
    case "west":
      return { x: -1, z: along };
    case "east":
      return { x: size, z: along };
  }
}

/** Connection tile on the preview's inward edge (toward the current level). */
function mapConnectionToPreviewExit(
  entrance: GridCoord,
  fromSize: number,
  toSize: number,
): GridCoord {
  const connectionEdge = getEntranceEdge(entrance, fromSize);
  const inwardEdge = getOppositeEdge(connectionEdge);
  const along = mapAlongToPreviewSize(entrance, fromSize, toSize);

  return connectionCoordOnEdge(inwardEdge, toSize, along);
}

/** Map an off-grid entrance from one map size to the equivalent edge tile on another. */
export function mapEntranceToSize(
  entrance: GridCoord,
  fromSize: number,
  toSize: number,
): GridCoord {
  const edge = getEntranceEdge(entrance, fromSize);
  const along = mapAlongToPreviewSize(entrance, fromSize, toSize);

  return connectionCoordOnEdge(edge, toSize, along);
}

export function generateWorldLayout(
  size = TERRAIN_SIZE,
  random: () => number = Math.random,
): WorldLayout {
  let best: WorldLayout | null = null;
  const maxPaths = ENABLE_MAIN_MULTI_PATH
    ? Math.min(4, ALL_EDGES.length)
    : 1;

  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
    const center = Math.floor(size / 2);
    const castle = { x: center, z: center };
    const { entrance } = pickRandomEdgeTile(size, random);
    const gate = getGridGate(entrance, size);
    const exit = pickCastleExit(castle, gate, size, random);

    if (!exit) {
      continue;
    }

    const primary = finalizeRoadGraph(
      syncLayoutFromPaths(size, castle, [
        {
          entrance,
          gate,
          exit,
          roadKeys: generateRoadPathWithTurns(
            entrance,
            gate,
            exit,
            size,
            random,
          ),
        },
      ]),
    );

    if (!primary) {
      continue;
    }

    let layout = primary;

    while (layout.paths.length < maxPaths) {
      const next = addMainLevelPath(layout, random);

      if (!next) {
        break;
      }

      layout = next;
    }

    if (!best || layout.paths.length > best.paths.length) {
      best = layout;
    }

    if (layout.paths.length >= maxPaths) {
      return layout;
    }
  }

  if (best) {
    return best;
  }

  const center = Math.floor(size / 2);
  const castle = { x: center, z: center };
  const { entrance } = pickRandomEdgeTile(size, random);
  const gate = getGridGate(entrance, size);
  const exit =
    pickCastleExit(castle, gate, size, random) ??
    getCastleNeighborCoords(castle, size)[0]!;

  return syncLayoutFromPaths(size, castle, [
    {
      entrance,
      gate,
      exit,
      roadKeys: generateRoadPathWithTurns(entrance, gate, exit, size, random),
    },
  ]);
}

/** Index of the path that owns this tile, or -1 if none. */
export function getPathIndexAtTile(
  layout: WorldLayout,
  x: number,
  z: number,
): number {
  return layout.paths.findIndex(
    (path) =>
      path.roadKeys.has(coordKey({ x, z })) ||
      (path.entrance.x === x && path.entrance.z === z) ||
      (path.exit.x === x && path.exit.z === z),
  );
}

/** Next-level preview: random odd-sized grid extending outward from the current level entrance. */
const MAX_PREVIEW_ATTEMPTS = 64;

/** Off-grid tiles on the straight segment between entrance and its gate. */
function isOnPreviewEntranceCorridor(
  coord: GridCoord,
  layout: Pick<WorldLayout, "entrance" | "gate">,
) {
  const { entrance, gate } = layout;

  if (entrance.x === gate.x) {
    const minZ = Math.min(entrance.z, gate.z);
    const maxZ = Math.max(entrance.z, gate.z);

    return (
      coord.x === entrance.x && coord.z > minZ && coord.z < maxZ
    );
  }

  if (entrance.z === gate.z) {
    const minX = Math.min(entrance.x, gate.x);
    const maxX = Math.max(entrance.x, gate.x);

    return (
      coord.z === entrance.z && coord.x > minX && coord.x < maxX
    );
  }

  return false;
}

/** Off-grid tiles on the straight segment between exit and its inward gate. */
function isOnPreviewExitCorridor(
  coord: GridCoord,
  layout: Pick<WorldLayout, "exit" | "castle">,
) {
  const { exit, castle } = layout;

  if (exit.x === castle.x) {
    const minZ = Math.min(exit.z, castle.z);
    const maxZ = Math.max(exit.z, castle.z);

    return coord.x === exit.x && coord.z > minZ && coord.z < maxZ;
  }

  if (exit.z === castle.z) {
    const minX = Math.min(exit.x, castle.x);
    const maxX = Math.max(exit.x, castle.x);

    return coord.z === exit.z && coord.x > minX && coord.x < maxX;
  }

  return false;
}

function isOffGridCoord(coord: GridCoord, size: number) {
  return !isOnGrid(coord.x, coord.z, size);
}

/** Perimeter road tiles allowed beside the entrance or exit only. */
function isPermittedPerimeterRoadTile(
  layout: WorldLayout,
  x: number,
  z: number,
) {
  for (const path of layout.paths) {
    if (path.gate.x === x && path.gate.z === z) {
      return true;
    }

    if (isOffGridCoord(path.exit, layout.size)) {
      const exitGate = getGridGate(path.exit, layout.size);

      if (exitGate.x === x && exitGate.z === z) {
        return true;
      }
    }
  }

  return false;
}

function shouldKeepRoadCoord(coord: GridCoord, layout: WorldLayout) {
  const { x, z } = coord;

  if (isEntranceTile(layout, x, z) || isExitTile(layout, x, z)) {
    return true;
  }

  if (isOnPreviewEntranceCorridor(coord, layout)) {
    return true;
  }

  if (isOnPreviewExitCorridor(coord, layout)) {
    return true;
  }

  if (!isOnGrid(x, z, layout.size)) {
    return false;
  }

  if (isOuterEdgeTile(x, z, layout.size)) {
    return isPermittedPerimeterRoadTile(layout, x, z);
  }

  return true;
}

function applyRoadPlacementRules(layout: WorldLayout): WorldLayout {
  const roadKeys = new Set(
    [...layout.roadKeys].filter((key) => {
      const [x, z] = key.split(":").map(Number);

      return shouldKeepRoadCoord({ x, z }, layout);
    }),
  );

  return { ...layout, roadKeys };
}

function pathConnectsEntranceToExit(layout: WorldLayout) {
  const visited = new Set<string>();
  const queue: GridCoord[] = [{ ...layout.entrance }];
  visited.add(coordKey(layout.entrance));

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (
      current.x === layout.exit.x &&
      current.z === layout.exit.z
    ) {
      return true;
    }

    for (const { dx, dz } of PATH_DIRS) {
      const next = { x: current.x + dx, z: current.z + dz };
      const key = coordKey(next);

      if (!layout.roadKeys.has(key) || visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

function sanitizePreviewRoadKeys(layout: WorldLayout): WorldLayout {
  return finalizeRoadGraph(layout) ?? layout;
}

function pruneDeadEndRoadTiles(layout: WorldLayout): WorldLayout {
  const roadKeys = new Set(layout.roadKeys);
  let changed = true;

  while (changed) {
    changed = false;

    for (const key of [...roadKeys]) {
      const [x, z] = key.split(":").map(Number);

      if (isEntranceTile(layout, x, z) || isExitTile(layout, x, z)) {
        continue;
      }

      let neighbors = 0;

      for (const { dx, dz } of PATH_DIRS) {
        if (roadKeys.has(coordKey({ x: x + dx, z: z + dz }))) {
          neighbors += 1;
        }
      }

      if (neighbors <= 1) {
        roadKeys.delete(key);
        changed = true;
      }
    }
  }

  return { ...layout, roadKeys };
}

/** Walk the unique entrance→exit polyline (no junctions). */
export function traceRoadPathCoords(layout: WorldLayout): GridCoord[] | null {
  const path: GridCoord[] = [];
  let current = { ...layout.entrance };
  let previous: GridCoord | null = null;

  for (let step = 0; step <= layout.roadKeys.size; step += 1) {
    path.push({ ...current });

    if (current.x === layout.exit.x && current.z === layout.exit.z) {
      return path;
    }

    let next: GridCoord | null = null;

    for (const { dx, dz } of PATH_DIRS) {
      const candidate = { x: current.x + dx, z: current.z + dz };
      const key = coordKey(candidate);

      if (!layout.roadKeys.has(key)) {
        continue;
      }

      if (
        previous &&
        candidate.x === previous.x &&
        candidate.z === previous.z
      ) {
        continue;
      }

      if (path.some((coord) => coord.x === candidate.x && coord.z === candidate.z)) {
        continue;
      }

      if (next !== null) {
        return null;
      }

      next = candidate;
    }

    if (!next) {
      return null;
    }

    previous = current;
    current = next;
  }

  return null;
}

export type RoadTileFlow = {
  x: number;
  z: number;
  entryDir: { x: number; z: number } | null;
  exitDir: { x: number; z: number } | null;
};

export function getRoadTileFlows(layout: WorldLayout): RoadTileFlow[] {
  if (layout.paths.length <= 1) {
    return getRoadTileFlowsForPath(layout);
  }

  const byKey = new Map<string, RoadTileFlow>();

  for (const path of layout.paths) {
    const single = syncLayoutFromPaths(layout.size, layout.castle, [path]);

    for (const flow of getRoadTileFlowsForPath(single)) {
      byKey.set(`${flow.x}:${flow.z}`, flow);
    }
  }

  return [...byKey.values()];
}

function getRoadTileFlowsForPath(layout: WorldLayout): RoadTileFlow[] {
  const path = traceRoadPathCoords(layout);

  if (!path) {
    return [];
  }

  return path.map((coord, index) => {
    const prev = path[index - 1];
    const next = path[index + 1];

    return {
      x: coord.x,
      z: coord.z,
      entryDir: prev
        ? { x: coord.x - prev.x, z: coord.z - prev.z }
        : null,
      exitDir: next
        ? { x: next.x - coord.x, z: next.z - coord.z }
        : null,
    };
  });
}

function traceEntranceToExitPath(
  layout: WorldLayout,
): WorldLayout | null {
  const path = traceRoadPathCoords(layout);

  if (!path) {
    return null;
  }

  return syncLayoutFromPaths(layout.size, layout.castle, [
    {
      entrance: layout.entrance,
      gate: layout.gate,
      exit: layout.exit,
      roadKeys: new Set(path.map((coord) => coordKey(coord))),
    },
  ]);
}

function finalizeRoadGraph(layout: WorldLayout): WorldLayout | null {
  let current = applyRoadPlacementRules(layout);
  current = pruneDeadEndRoadTiles(current);

  return traceEntranceToExitPath(current);
}

function roadGraphIsSimplePath(layout: WorldLayout) {
  for (const key of layout.roadKeys) {
    const [x, z] = key.split(":").map(Number);
    let neighbors = 0;

    for (const { dx, dz } of PATH_DIRS) {
      if (layout.roadKeys.has(coordKey({ x: x + dx, z: z + dz }))) {
        neighbors += 1;
      }
    }

    const isEndpoint =
      isEntranceTile(layout, x, z) || isExitTile(layout, x, z);

    if (isEndpoint) {
      if (neighbors !== 1) {
        return false;
      }
    } else if (neighbors > 2) {
      return false;
    }
  }

  return true;
}

function previewRoadStaysInGrid(
  roadKeys: ReadonlySet<string>,
  layout: WorldLayout,
) {
  for (const key of roadKeys) {
    const [x, z] = key.split(":").map(Number);

    if (!shouldKeepRoadCoord({ x, z }, layout)) {
      return false;
    }
  }

  return true;
}

function computePreviewOffset(
  currentLayout: WorldLayout,
  previewLayout: WorldLayout,
) {
  const entranceWorld = tileWorldPosition(
    currentLayout.entrance.x,
    currentLayout.entrance.z,
    currentLayout.size,
  );
  const exitWorld = tileWorldPosition(
    previewLayout.exit.x,
    previewLayout.exit.z,
    previewLayout.size,
  );

  return {
    x: entranceWorld.x - exitWorld.x,
    z: entranceWorld.z - exitWorld.z,
  };
}

function previewRoadOverlapsLevel(
  previewLayout: WorldLayout,
  currentLayout: WorldLayout,
  offset: { x: number; z: number },
) {
  const threshold = TILE_SPACING * 0.5;

  for (const key of previewLayout.roadKeys) {
    const [px, pz] = key.split(":").map(Number);
    const previewWorld = tileWorldPosition(px, pz, previewLayout.size);
    const worldX = previewWorld.x + offset.x;
    const worldZ = previewWorld.z + offset.z;

    for (let cx = 0; cx < currentLayout.size; cx += 1) {
      for (let cz = 0; cz < currentLayout.size; cz += 1) {
        const currentWorld = tileWorldPosition(cx, cz, currentLayout.size);

        if (
          Math.abs(worldX - currentWorld.x) < threshold &&
          Math.abs(worldZ - currentWorld.z) < threshold
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function randomSpawnTerrainSize(random: () => number) {
  const oddCount =
    (SPAWN_TERRAIN_SIZE_MAX - SPAWN_TERRAIN_SIZE_MIN) / 2 + 1;

  return (
    SPAWN_TERRAIN_SIZE_MIN + Math.floor(random() * oddCount) * 2
  );
}

function buildPreviewWorldLayout(
  currentLayout: WorldLayout,
  entranceEdge: LevelEdge,
  random: () => number,
): WorldLayout {
  const size = randomSpawnTerrainSize(random);
  const connectionEdge = getEntranceEdge(
    currentLayout.entrance,
    currentLayout.size,
  );
  const inwardEdge = getOppositeEdge(connectionEdge);
  const exit = connectionCoordOnEdge(
    inwardEdge,
    size,
    pickRandomAlongEdge(size, random, SPAWN_ENTRANCE_CORNER_MARGIN),
  );
  const castle = getGridGate(exit, size);
  const entrance = pickRandomPreviewEntrance(entranceEdge, size, random);
  const gate = getGridGate(entrance, size);
  const roadKeys = generatePreviewRoadKeys(
    entrance,
    gate,
    exit,
    size,
    random,
  );

  return syncLayoutFromPaths(size, castle, [
    {
      entrance,
      gate,
      exit,
      roadKeys,
    },
  ]);
}

export type PreviewWorldLayoutOptions = {
  entranceEdge: LevelEdge;
};

function isValidPreviewSinglePath(layout: WorldLayout): boolean {
  if (!previewEntranceExitOppositeSides(layout)) {
    return false;
  }

  if (!roadGraphIsSimplePath(layout)) {
    return false;
  }

  if (!pathConnectsEntranceToExit(layout)) {
    return false;
  }

  if (!previewRoadStaysInGrid(layout.roadKeys, layout)) {
    return false;
  }

  return true;
}

/** True for level numbers 5, 10, 15, … (forked dual-entrance grids). */
export function isForkSpawnLevel(levelNumber: number): boolean {
  return levelNumber > 1 && levelNumber % 5 === 0;
}

function pickSecondaryForkEntranceEdge(
  exitEdge: Edge,
  primaryEntranceEdge: Edge,
  random: () => number,
): LevelEdge {
  const candidates = ALL_EDGES.filter(
    (edge) => edge !== exitEdge && edge !== primaryEntranceEdge,
  );

  return candidates[Math.floor(random() * candidates.length)]!;
}

/** Paths may only share the exit tile (Y-merge at the castle/exit). */
function forkPathsOnlyShareExit(
  roadKeysA: ReadonlySet<string>,
  roadKeysB: ReadonlySet<string>,
  exit: GridCoord,
): boolean {
  const exitKey = coordKey(exit);

  if (!roadKeysA.has(exitKey) || !roadKeysB.has(exitKey)) {
    return false;
  }

  for (const key of roadKeysA) {
    if (key !== exitKey && roadKeysB.has(key)) {
      return false;
    }
  }

  return true;
}

function buildForkBranchDraft(
  entranceEdge: LevelEdge,
  exit: GridCoord,
  castle: GridCoord,
  size: number,
  random: () => number,
): WorldLayout {
  const entrance = pickRandomPreviewEntrance(entranceEdge, size, random);
  const gate = getGridGate(entrance, size);
  const roadKeys = generatePreviewRoadKeys(
    entrance,
    gate,
    exit,
    size,
    random,
  );

  return syncLayoutFromPaths(size, castle, [
    {
      entrance,
      gate,
      exit,
      roadKeys,
    },
  ]);
}

/**
 * Spawned-level layout with two entrances that meet at one shared exit
 * (exit still snaps to the parent entrance for chaining).
 */
export function generateForkPreviewWorldLayout(
  currentLayout: WorldLayout,
  options: PreviewWorldLayoutOptions,
  random: () => number = Math.random,
): WorldLayout {
  const connectionEdge = getEntranceEdge(
    currentLayout.entrance,
    currentLayout.size,
  );
  const exitEdge = getOppositeEdge(connectionEdge);

  for (let attempt = 0; attempt < MAX_PREVIEW_ATTEMPTS; attempt += 1) {
    const size = randomSpawnTerrainSize(random);
    const exit = connectionCoordOnEdge(
      exitEdge,
      size,
      pickRandomAlongEdge(size, random, SPAWN_ENTRANCE_CORNER_MARGIN),
    );
    const castle = getGridGate(exit, size);
    const secondaryEntranceEdge = pickSecondaryForkEntranceEdge(
      exitEdge,
      options.entranceEdge,
      random,
    );

    const finalizedA = finalizeRoadGraph(
      buildForkBranchDraft(
        options.entranceEdge,
        exit,
        castle,
        size,
        random,
      ),
    );
    const finalizedB = finalizeRoadGraph(
      buildForkBranchDraft(
        secondaryEntranceEdge,
        exit,
        castle,
        size,
        random,
      ),
    );

    if (!finalizedA || !finalizedB) {
      continue;
    }

    if (
      !isValidPreviewSinglePath(finalizedA) ||
      !isValidPreviewSinglePath(finalizedB)
    ) {
      continue;
    }

    const pathA = finalizedA.paths[0]!;
    const pathB = finalizedB.paths[0]!;

    if (!forkPathsOnlyShareExit(pathA.roadKeys, pathB.roadKeys, exit)) {
      continue;
    }

    return syncLayoutFromPaths(size, castle, [
      {
        ...pathA,
        exit,
      },
      {
        ...pathB,
        exit,
      },
    ]);
  }

  return generatePreviewWorldLayout(currentLayout, options, random);
}

export function generatePreviewWorldLayout(
  currentLayout: WorldLayout,
  options: PreviewWorldLayoutOptions,
  random: () => number = Math.random,
): WorldLayout {
  for (let attempt = 0; attempt < MAX_PREVIEW_ATTEMPTS; attempt += 1) {
    const layout = finalizeRoadGraph(
      buildPreviewWorldLayout(currentLayout, options.entranceEdge, random),
    );

    if (!layout) {
      continue;
    }

    if (!isValidPreviewSinglePath(layout)) {
      continue;
    }

    return layout;
  }

  return (
    finalizeRoadGraph(
      buildPreviewWorldLayout(currentLayout, options.entranceEdge, random),
    ) ??
    buildPreviewWorldLayout(currentLayout, options.entranceEdge, random)
  );
}

export function isRoadTile(layout: WorldLayout, x: number, z: number) {
  return layout.roadKeys.has(coordKey({ x, z }));
}

export function isEntranceTile(layout: WorldLayout, x: number, z: number) {
  return layout.paths.some(
    (path) => path.entrance.x === x && path.entrance.z === z,
  );
}

export function isExitTile(layout: WorldLayout, x: number, z: number) {
  return layout.paths.some((path) => path.exit.x === x && path.exit.z === z);
}

export function getPathAtExit(
  layout: WorldLayout,
  exit: GridCoord,
): RoadPath | undefined {
  return layout.paths.find(
    (path) => path.exit.x === exit.x && path.exit.z === exit.z,
  );
}

export function layoutForPath(
  layout: WorldLayout,
  path: RoadPath,
): WorldLayout {
  return syncLayoutFromPaths(layout.size, layout.castle, [path]);
}

/** Direction from the exit tile toward the castle (where stone blend sits). */
export function getExitCastleDirection(
  layout: WorldLayout,
): "n" | "s" | "e" | "w" {
  const dx = layout.castle.x - layout.exit.x;
  const dz = layout.castle.z - layout.exit.z;

  if (dx === 1) {
    return "e";
  }
  if (dx === -1) {
    return "w";
  }
  if (dz === 1) {
    return "s";
  }
  if (dz === -1) {
    return "n";
  }

  throw new Error("Exit tile is not adjacent to the castle.");
}

const PATH_NEIGHBOR_DIRS = [
  { dir: "n" as const, x: 0, z: -1 },
  { dir: "e" as const, x: 1, z: 0 },
  { dir: "s" as const, x: 0, z: 1 },
  { dir: "w" as const, x: -1, z: 0 },
];

/** Path orientation at the exit (excluding the castle neighbor). */
export function getExitPathOrientation(
  layout: WorldLayout,
): "ns" | "ew" {
  const castleDir = getExitCastleDirection(layout);
  const { exit } = layout;

  const pathDirs = PATH_NEIGHBOR_DIRS.filter(({ dir, x, z }) => {
    if (dir === castleDir) {
      return false;
    }

    return isRoadTile(layout, exit.x + x, exit.z + z);
  }).map(({ dir }) => dir);

  const hasVertical = pathDirs.some((dir) => dir === "n" || dir === "s");
  const hasHorizontal = pathDirs.some((dir) => dir === "e" || dir === "w");

  if (hasHorizontal && !hasVertical) {
    return "ew";
  }

  return "ns";
}

/** Unit step from exit tile toward the castle. */
export function getExitCastleStep(layout: WorldLayout): { x: number; z: number } {
  return {
    x: Math.sign(layout.castle.x - layout.exit.x),
    z: Math.sign(layout.castle.z - layout.exit.z),
  };
}

/** True when the path meets the castle at a right angle at the exit. */
export function isExitCornerTile(layout: WorldLayout) {
  const pathOrient = getExitPathOrientation(layout);
  const castleDir = getExitCastleDirection(layout);
  const castleIsNS = castleDir === "n" || castleDir === "s";
  const pathIsNS = pathOrient === "ns";

  return pathIsNS !== castleIsNS;
}

/** Exit flow with castle direction as exitDir when the exit is a corner piece. */
export function getExitRoadTileFlow(layout: WorldLayout): RoadTileFlow | null {
  const base = getRoadTileFlows(layout).find(
    (flow) => flow.x === layout.exit.x && flow.z === layout.exit.z,
  );

  if (!base) {
    return null;
  }

  if (!isExitCornerTile(layout) || !base.entryDir) {
    return base;
  }

  return {
    ...base,
    exitDir: getExitCastleStep(layout),
  };
}

export function getExitBlendSprite(
  layout: WorldLayout,
):
  | "xnns"
  | "xnew"
  | "xsns"
  | "xsew"
  | "xens"
  | "xeew"
  | "xwns"
  | "xwew" {
  const towardCastle = getExitCastleDirection(layout);
  const pathOrient = getExitPathOrientation(layout);

  const spriteByCastle = {
    n: { ns: "xnns", ew: "xnew" },
    s: { ns: "xsns", ew: "xsew" },
    e: { ns: "xens", ew: "xeew" },
    w: { ns: "xwns", ew: "xwew" },
  } as const;

  return spriteByCastle[towardCastle][pathOrient];
}

export function isOnGrid(x: number, z: number, size = TERRAIN_SIZE) {
  return x >= 0 && x < size && z >= 0 && z < size;
}

export { isOuterEdgeTile };

/** Dirt may not sit on the map perimeter except beside the entrance or exit. */
export function shouldPlaceDirtTile(
  layout: WorldLayout,
  x: number,
  z: number,
) {
  if (!isRoadTile(layout, x, z)) {
    return false;
  }

  if (!isOnGrid(x, z, layout.size)) {
    return isEntranceTile(layout, x, z) || isExitTile(layout, x, z);
  }

  if (isOuterEdgeTile(x, z, layout.size)) {
    return isPermittedPerimeterRoadTile(layout, x, z);
  }

  return true;
}
