import { createWriteStream } from "node:fs";
import { deflateSync } from "node:zlib";

export function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

export function writePng(filePath, width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const png = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  createWriteStream(filePath).end(png);
}

export function createPixelBuffer(width, height) {
  return Buffer.alloc(width * height * 4, 0);
}

export function drawGrid(pixels, grid, palette, originX, originY, width) {
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const rgb = palette[grid[y][x]];
      if (!rgb) continue;
      const index = ((originY + y) * width + (originX + x)) * 4;
      pixels[index] = rgb[0];
      pixels[index + 1] = rgb[1];
      pixels[index + 2] = rgb[2];
      pixels[index + 3] = 255;
    }
  }
}

export function gridSize(grid) {
  return {
    width: Math.max(...grid.map((row) => row.length)),
    height: grid.length,
  };
}

/** Nearest-neighbor upscale for pixel-art grids (e.g. 16→32 at scale 2). */
export function upscaleGrid(grid, scale) {
  if (scale <= 1) {
    return grid;
  }

  const rows = [];
  for (const row of grid) {
    const scaledRow = row
      .split("")
      .map((cell) => cell.repeat(scale))
      .join("");

    for (let i = 0; i < scale; i += 1) {
      rows.push(scaledRow);
    }
  }

  return rows;
}

/** Rotate a square pixel grid 90° clockwise. */
export function rotateGrid90CW(grid) {
  const height = grid.length;
  const width = Math.max(...grid.map((row) => row.length));
  const rotated = [];

  for (let x = 0; x < width; x += 1) {
    let row = "";
    for (let y = height - 1; y >= 0; y -= 1) {
      row += grid[y]?.[x] ?? ".";
    }
    rotated.push(row);
  }

  return rotated;
}

export function writeGridPng(filePath, grid, palette) {
  const { width, height } = gridSize(grid);
  const pixels = createPixelBuffer(width, height);
  drawGrid(pixels, grid, palette, 0, 0, width);
  writePng(filePath, width, height, pixels);
  return { width, height };
}
