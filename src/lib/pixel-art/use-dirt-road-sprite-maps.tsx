"use client";

import { useMemo } from "react";
import * as THREE from "three";

import {
  DIRT_ROAD_SPRITE_IDS,
  dirtRoadSpriteUvTransform,
  type DirtRoadSpriteId,
} from "@/lib/pixel-art/dirt-road-sprites";
import { useGroundSpriteSheet } from "@/lib/pixel-art/use-ground-sprite-sheet";

const dirtRoadMapCache = new Map<string, THREE.Texture>();

function configureDirtRoadSpriteMap(
  source: THREE.Texture,
  sprite: DirtRoadSpriteId,
) {
  const map = source.clone();
  const { repeat, offset } = dirtRoadSpriteUvTransform(sprite);

  map.repeat.set(repeat[0], repeat[1]);
  map.offset.set(offset[0], offset[1]);
  map.flipY = true;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  return map;
}

function getCachedDirtRoadSpriteMap(
  source: THREE.Texture,
  sprite: DirtRoadSpriteId,
) {
  const key = `${source.uuid}:${sprite}`;
  let map = dirtRoadMapCache.get(key);

  if (!map) {
    map = configureDirtRoadSpriteMap(source, sprite);
    dirtRoadMapCache.set(key, map);
  }

  return map;
}

export function useDirtRoadSpriteMap(sprite: DirtRoadSpriteId) {
  const sheet = useGroundSpriteSheet();

  return useMemo(
    () => getCachedDirtRoadSpriteMap(sheet, sprite),
    [sheet, sprite],
  );
}

export function useDirtRoadSpriteMaps(): Record<
  DirtRoadSpriteId,
  THREE.Texture
> {
  const sheet = useGroundSpriteSheet();

  return useMemo(() => {
    const maps = {} as Record<DirtRoadSpriteId, THREE.Texture>;

    for (const sprite of DIRT_ROAD_SPRITE_IDS) {
      maps[sprite] = getCachedDirtRoadSpriteMap(sheet, sprite);
    }

    return maps;
  }, [sheet]);
}

