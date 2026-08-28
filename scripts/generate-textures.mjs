import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPixelBuffer,
  drawGrid,
  gridSize,
  rotateGrid90CW,
  upscaleGrid,
  writeGridPng,
  writePng,
} from "./lib/png.mjs";
import { PALETTE, TEXTURE_GRIDS } from "./texture-grids.mjs";

/** Output resolution for every generated tile texture. */
export const TEXTURE_PX = 32;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "textures");

function toOutputGrid(grid) {
  const sourceSize = gridSize(grid).width;
  const scale = TEXTURE_PX / sourceSize;

  if (!Number.isInteger(scale)) {
    throw new Error(
      `TEXTURE_PX (${TEXTURE_PX}) must be a whole multiple of source grid width (${sourceSize}).`,
    );
  }

  return upscaleGrid(grid, scale);
}

function rotateGridTimes(grid, times) {
  let result = grid;

  for (let index = 0; index < times; index += 1) {
    result = rotateGrid90CW(result);
  }

  return result;
}

await mkdir(outDir, { recursive: true });

/** Source grids packed into sprite sheets — no standalone PNG output. */
const SPRITE_SHEET_TEXTURES = new Set([
  "grass",
  "grass-2",
  "grass-3",
  "grass-4",
  "dirt",
  "dirt-ns",
  "dirt-ew",
  "dirt-turn-right",
  "dirt-turn-left",
  "dirt-t-west",
  "dirt-stone-n-ns",
  "dirt-stone-n-ew",
  "dirt-stone-s-ns",
  "dirt-stone-s-ew",
  "dirt-stone-e-ns",
  "dirt-stone-e-ew",
  "dirt-stone-w-ns",
  "dirt-stone-w-ew",
  "stone",
  "roof",
  "wood",
]);

for (const [name, grid] of Object.entries(TEXTURE_GRIDS)) {
  if (SPRITE_SHEET_TEXTURES.has(name)) {
    continue;
  }

  const outPath = path.join(outDir, `${name}.png`);
  const outputGrid = toOutputGrid(grid);
  const { width, height } = writeGridPng(outPath, outputGrid, PALETTE);
  console.log(`Wrote ${outPath} (${width}x${height})`);
}

const { width: tileWidth } = gridSize(toOutputGrid(TEXTURE_GRIDS.grass));

const dirtRoadFrameGrids = {
  dirt: TEXTURE_GRIDS.dirt,
  ns: TEXTURE_GRIDS["dirt-ns"],
  ew: TEXTURE_GRIDS["dirt-ew"],
  ne: TEXTURE_GRIDS["dirt-turn-right"],
  es: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-right"], 1),
  sw: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-right"], 2),
  wn: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-right"], 3),
  nw: TEXTURE_GRIDS["dirt-turn-left"],
  ws: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-left"], 1),
  se: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-left"], 2),
  en: rotateGridTimes(TEXTURE_GRIDS["dirt-turn-left"], 3),
  tw: TEXTURE_GRIDS["dirt-t-west"],
  tn: rotateGridTimes(TEXTURE_GRIDS["dirt-t-west"], 1),
  te: rotateGridTimes(TEXTURE_GRIDS["dirt-t-west"], 2),
  ts: rotateGridTimes(TEXTURE_GRIDS["dirt-t-west"], 3),
  xnns: TEXTURE_GRIDS["dirt-stone-n-ns"],
  xnew: TEXTURE_GRIDS["dirt-stone-n-ew"],
  xsns: TEXTURE_GRIDS["dirt-stone-s-ns"],
  xsew: TEXTURE_GRIDS["dirt-stone-s-ew"],
  xens: TEXTURE_GRIDS["dirt-stone-e-ns"],
  xeew: TEXTURE_GRIDS["dirt-stone-e-ew"],
  xwns: TEXTURE_GRIDS["dirt-stone-w-ns"],
  xwew: TEXTURE_GRIDS["dirt-stone-w-ew"],
};

/** Grass variants + all dirt road tiles on one sprite sheet. */
const groundSheetFrameGrids = {
  grass: TEXTURE_GRIDS.grass,
  "grass-2": TEXTURE_GRIDS["grass-2"],
  "grass-3": TEXTURE_GRIDS["grass-3"],
  "grass-4": TEXTURE_GRIDS["grass-4"],
  ...dirtRoadFrameGrids,
};

const groundSheetLayout = [
  ["grass", "grass-2", "grass-3", "grass-4"],
  ["dirt", "ns", "ew", "tw"],
  ["ne", "es", "sw", "wn"],
  ["nw", "ws", "se", "en"],
  ["tn", "te", "ts", "dirt"],
  ["xnns", "xnew", "xsns", "xsew"],
  ["xens", "xeew", "xwns", "xwew"],
];

const groundSheetCols = groundSheetLayout[0].length;
const groundSheetRows = groundSheetLayout.length;
const groundSheetWidth = tileWidth * groundSheetCols;
const groundSheetHeight = tileWidth * groundSheetRows;
const groundSheetPixels = createPixelBuffer(
  groundSheetWidth,
  groundSheetHeight,
);

for (let row = 0; row < groundSheetRows; row += 1) {
  for (let col = 0; col < groundSheetCols; col += 1) {
    const frameId = groundSheetLayout[row][col];
    const frameGrid = toOutputGrid(groundSheetFrameGrids[frameId]);
    drawGrid(
      groundSheetPixels,
      frameGrid,
      PALETTE,
      col * tileWidth,
      row * tileWidth,
      groundSheetWidth,
    );
  }
}

const sheetPath = path.join(outDir, "ground-tiles.png");
writePng(sheetPath, groundSheetWidth, groundSheetHeight, groundSheetPixels);
console.log(`Wrote ${sheetPath} (${groundSheetWidth}x${groundSheetHeight})`);

const castleSheetLayout = [["stone", "roof", "wood"]];
const castleSheetCols = castleSheetLayout[0].length;
const castleSheetRows = castleSheetLayout.length;
const castleSheetWidth = tileWidth * castleSheetCols;
const castleSheetHeight = tileWidth * castleSheetRows;
const castleSheetPixels = createPixelBuffer(
  castleSheetWidth,
  castleSheetHeight,
);

for (let row = 0; row < castleSheetRows; row += 1) {
  for (let col = 0; col < castleSheetCols; col += 1) {
    const frameId = castleSheetLayout[row][col];
    const frameGrid = toOutputGrid(TEXTURE_GRIDS[frameId]);
    drawGrid(
      castleSheetPixels,
      frameGrid,
      PALETTE,
      col * tileWidth,
      row * tileWidth,
      castleSheetWidth,
    );
  }
}

const castleSheetPath = path.join(outDir, "castle-tiles.png");
writePng(
  castleSheetPath,
  castleSheetWidth,
  castleSheetHeight,
  castleSheetPixels,
);
console.log(
  `Wrote ${castleSheetPath} (${castleSheetWidth}x${castleSheetHeight})`,
);
