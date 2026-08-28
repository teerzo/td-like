/** Half-texel inset UVs for sprite sheets (prevents atlas bleeding). */
export function atlasFrameUvTransform(sheet: {
  cols: number;
  rows: number;
  width: number;
  height: number;
  tilePx: number;
}, frame: { col: number; row: number }) {
  const { width, height, tilePx } = sheet;

  const u0 = (frame.col * tilePx + 0.5) / width;
  const u1 = ((frame.col + 1) * tilePx - 0.5) / width;
  const v1 = (height - frame.row * tilePx - 0.5) / height;
  const v0 = (height - (frame.row + 1) * tilePx + 0.5) / height;

  return {
    repeat: [u1 - u0, v1 - v0] as [number, number],
    offset: [u0, v0] as [number, number],
  };
}
