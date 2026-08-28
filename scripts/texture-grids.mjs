/** Source pixel grids used by scripts/generate-textures.mjs */

export const PALETTE = {
  ".": null,
  b: [0x5c, 0x40, 0x33],
  B: [0x3d, 0x28, 0x17],
  d: [0x8b, 0x69, 0x14],
  D: [0x6b, 0x4f, 0x10],
  t: [0xa0, 0x80, 0x50],
  s: [0x7a, 0x84, 0x94],
  S: [0x5a, 0x62, 0x70],
  m: [0x4a, 0x50, 0x58],
  w: [0xc8, 0xcc, 0xd4],
  r: [0x8b, 0x30, 0x30],
  R: [0x6b, 0x20, 0x20],
  o: [0xc8, 0x78, 0x30],
  O: [0xa0, 0x58, 0x20],
  g: [0x4a, 0x7a, 0x38],
  G: [0x2d, 0x5a, 0x22],
  l: [0x6e, 0xcf, 0x5a],
  L: [0x3d, 0x8f, 0x32],
  n: [0x6b, 0x44, 0x23],
  N: [0x4a, 0x2f, 0x18],
  q: [0x4a, 0x98, 0xe0],
  p: [0x3a, 0x78, 0xc8],
  P: [0x2a, 0x58, 0x98],
};

const ROAD_GRID = 16;

/** Path band thickness in source pixels — identical for vertical and horizontal arms. */
const ROAD_THICKNESS = 4;

const ROAD_V0 = Math.floor((ROAD_GRID - ROAD_THICKNESS) / 2);
const ROAD_V1 = ROAD_V0 + ROAD_THICKNESS - 1;
const ROAD_H0 = ROAD_V0;
const ROAD_H1 = ROAD_V1;

function inRoadVertical(x) {
  return x >= ROAD_V0 && x <= ROAD_V1;
}

function inRoadHorizontal(y) {
  return y >= ROAD_H0 && y <= ROAD_H1;
}

function roadGridFrom(isRoadPixel) {
  const rows = [];

  for (let y = 0; y < ROAD_GRID; y += 1) {
    let row = "";

    for (let x = 0; x < ROAD_GRID; x += 1) {
      row += isRoadPixel(x, y) ? "d" : "b";
    }

    rows.push(row);
  }

  return rows;
}

const STONE_GRID = [
  "ssssssssssssssss",
  "ssssssssssssssss",
  "ssSssssssssssSss",
  "ssssssssssssssss",
  "ssssssmsssssssss",
  "ssssssssssssssss",
  "ssssssssssssssss",
  "ssSssssssssssSss",
  "ssssssssssssssss",
  "ssssssssssssssss",
  "ssssssmsssssssss",
  "ssssssssssssssss",
  "ssssssssssssssss",
  "ssSssssssssssSss",
  "ssssssssssssssss",
  "ssssssssssssssss",
];

const BLEND_SPLIT = 8;

function isRoadOnDirt(x, y, pathOrient) {
  return pathOrient === "ns" ? inRoadVertical(x) : inRoadHorizontal(y);
}

function dirtStoneBlendPixel(x, y, stoneToward, pathOrient) {
  switch (stoneToward) {
    case "n": {
      if (y < BLEND_SPLIT - 1) {
        return STONE_GRID[y][x];
      }
      if (y === BLEND_SPLIT - 1) {
        return isRoadOnDirt(x, y, pathOrient) ? "t" : STONE_GRID[y][x];
      }
      return isRoadOnDirt(x, y, pathOrient) ? "d" : "b";
    }
    case "s": {
      if (y > BLEND_SPLIT) {
        return STONE_GRID[y][x];
      }
      if (y === BLEND_SPLIT) {
        return isRoadOnDirt(x, y, pathOrient) ? "t" : "b";
      }
      return isRoadOnDirt(x, y, pathOrient) ? "d" : "b";
    }
    case "e": {
      if (x > BLEND_SPLIT) {
        return STONE_GRID[y][x];
      }
      if (x === BLEND_SPLIT) {
        return isRoadOnDirt(x, y, pathOrient) ? "t" : "b";
      }
      return isRoadOnDirt(x, y, pathOrient) ? "d" : "b";
    }
    case "w": {
      if (x < BLEND_SPLIT - 1) {
        return STONE_GRID[y][x];
      }
      if (x === BLEND_SPLIT - 1) {
        return isRoadOnDirt(x, y, pathOrient) ? "t" : STONE_GRID[y][x];
      }
      return isRoadOnDirt(x, y, pathOrient) ? "d" : "b";
    }
    default:
      return "b";
  }
}

function dirtStoneBlendGrid(stoneToward, pathOrient) {
  const rows = [];

  for (let y = 0; y < ROAD_GRID; y += 1) {
    let row = "";

    for (let x = 0; x < ROAD_GRID; x += 1) {
      row += dirtStoneBlendPixel(x, y, stoneToward, pathOrient);
    }

    rows.push(row);
  }

  return rows;
}

function exitBlendGrids(stoneToward) {
  return {
    [`dirt-stone-${stoneToward}-ns`]: dirtStoneBlendGrid(stoneToward, "ns"),
    [`dirt-stone-${stoneToward}-ew`]: dirtStoneBlendGrid(stoneToward, "ew"),
  };
}

/** Dirt road tiles share band geometry so edges meet when placed adjacent. */
const DIRT_ROAD_GRIDS = {
  dirt: roadGridFrom((x, y) => inRoadVertical(x) || inRoadHorizontal(y)),
  "dirt-ns": roadGridFrom((x, y) => inRoadVertical(x)),
  "dirt-ew": roadGridFrom((x, y) => inRoadHorizontal(y)),
  /** NE corner — vertical only through the horizontal band (no road stub to south). */
  "dirt-turn-right": roadGridFrom(
    (x, y) =>
      (inRoadVertical(x) && y <= ROAD_H1) ||
      (inRoadHorizontal(y) && x >= ROAD_V0),
  ),
  /** NW corner — vertical only through the horizontal band (no road stub to south). */
  "dirt-turn-left": roadGridFrom(
    (x, y) =>
      (inRoadVertical(x) && y <= ROAD_H1) ||
      (inRoadHorizontal(y) && x <= ROAD_V1),
  ),
  /** T junction — open west (roads to N, E, S). */
  "dirt-t-west": roadGridFrom(
    (x, y) =>
      inRoadVertical(x) || (inRoadHorizontal(y) && x >= ROAD_V0),
  ),
  /** Exit tile — stone toward castle, dirt road toward path (ns or ew). */
  ...exitBlendGrids("n"),
  ...exitBlendGrids("s"),
  ...exitBlendGrids("e"),
  ...exitBlendGrids("w"),
};

export const TEXTURE_GRIDS = {
  ...DIRT_ROAD_GRIDS,
  grass: [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "ggggggglgggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggggglgggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
  "grass-2": [
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggggglgggggggg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggggglgggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
  "grass-3": [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggGggggGgggggg",
    "gggggggggggggggg",
    "gglggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggGggggGgggggg",
    "gggggggggggggggg",
    "gglggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggGggggGgggggg",
    "gggggggggggggggg",
    "gglggggggggggggg",
    "gggggggggggggggg",
  ],
  "grass-4": [
    "gggggggggggggggg",
    "ggggglggggggglgg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "ggggggglgggggggg",
    "gggggggggggggggg",
    "ggggglggggggglgg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggggglggggggglgg",
    "gggggggggggggggg",
    "ggGggggggggggGgg",
    "gggggggggggggggg",
  ],
  stone: STONE_GRID,
  brick: [
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrRrrrrrrrrrrRrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrRrrrrrrrrrrRrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrRrrrrrrrrrrRrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrrrrrrrrrrrrrrr",
    "rrRrrrrrrrrrrRrr",
    "rrrrrrrrrrrrrrrr",
  ],
  roof: [
    "oooooooooooooooo",
    "oooooooooooooooo",
    "ooOooooooooooOoo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "ooOooooooooooOoo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "ooOooooooooooOoo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "oooooooooooooooo",
    "ooOooooooooooOoo",
    "oooooooooooooooo",
  ],
  wood: [
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
  ],
  "tree-foliage": [
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGggggggggggGGG",
    "GGggggggggggggGG",
    "GggggggggggggggG",
    "GgggggglgggggggG",
    "GggggggggggggggG",
    "GggggggggggggggG",
    "GGGggggggggggGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "GgggggglgggggggG",
    "GggggggggggggggG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
  ],
  bark: [
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
    "nnnnnnnnnnnnnnnn",
    "nnNnnnnnnnnnnNnn",
    "nnnnnnnnnnnnnnnn",
  ],
  water: [
    "qqqqqqqqqqqqqqqq",
    "qqqqqqqpqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqpqqqqqqqpqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqqqqPqqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqqqpqqqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqpqqqqqqqpqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqqqqPqqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqqqpqqqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
    "qqqqqqqqqqqqqqqq",
  ],
};
