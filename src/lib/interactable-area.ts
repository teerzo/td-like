import { collectBuildPlotTiles, type BuildPlot } from "@/lib/fertile-farm";
import {
  collectLayoutGlobalKeys,
  getSeamGrassTileGroups,
  globalCoordKey,
  type ChunkOrigin,
  type GlobalGridCoord,
} from "@/lib/global-grid";
import type { WorldLayout } from "@/lib/world-layout";

type PlacedLevel = {
  layout: WorldLayout;
  origin: ChunkOrigin;
};

export function buildInteractableTileKeys(input: {
  mainLayout: WorldLayout;
  mainOrigin: ChunkOrigin;
  spawnedLevels: readonly PlacedLevel[];
  buildPlots: readonly BuildPlot[];
}): Set<string> {
  const keys = new Set<string>();

  const addLayout = (layout: WorldLayout, origin: ChunkOrigin) => {
    for (const key of collectLayoutGlobalKeys(layout, origin)) {
      keys.add(key);
    }
  };

  addLayout(input.mainLayout, input.mainOrigin);

  for (const level of input.spawnedLevels.slice(0, -1)) {
    addLayout(level.layout, level.origin);
  }

  for (const plot of input.buildPlots) {
    for (const tile of collectBuildPlotTiles(plot)) {
      keys.add(globalCoordKey(tile.gx, tile.gz));
    }
  }

  const levels: PlacedLevel[] = [
    { layout: input.mainLayout, origin: input.mainOrigin },
    ...input.spawnedLevels,
  ];
  const hasPreview = input.spawnedLevels.length > 0;
  const seamGroups = getSeamGrassTileGroups(levels);

  seamGroups.forEach((tiles, pairIndex) => {
    const childLevelIndex = pairIndex + 1;
    const isPreviewSeam =
      hasPreview && childLevelIndex === levels.length - 1;

    if (isPreviewSeam) {
      return;
    }

    for (const tile of tiles) {
      keys.add(globalCoordKey(tile.gx, tile.gz));
    }
  });

  return keys;
}

export function isInteractableTile(
  gx: number,
  gz: number,
  interactableKeys: ReadonlySet<string>,
): boolean {
  return interactableKeys.has(globalCoordKey(gx, gz));
}

export function isInteractableCoord(
  coord: GlobalGridCoord,
  interactableKeys: ReadonlySet<string>,
): boolean {
  return isInteractableTile(coord.gx, coord.gz, interactableKeys);
}
