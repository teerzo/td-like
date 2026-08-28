"use client";

import { useMemo } from "react";
import * as THREE from "three";

import {
  GRASS_SPRITE_IDS,
  grassSpriteUvTransform,
  type GrassSpriteId,
} from "@/lib/pixel-art/grass-sprites";
import { useGroundSpriteSheet } from "@/lib/pixel-art/use-ground-sprite-sheet";

const grassMapCache = new Map<string, THREE.Texture>();

function configureGrassSpriteMap(
  source: THREE.Texture,
  sprite: GrassSpriteId,
) {
  const map = source.clone();
  const { repeat, offset } = grassSpriteUvTransform(sprite);

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

function getCachedGrassSpriteMap(
  source: THREE.Texture,
  sprite: GrassSpriteId,
) {
  const key = `${source.uuid}:${sprite}`;
  let map = grassMapCache.get(key);

  if (!map) {
    map = configureGrassSpriteMap(source, sprite);
    grassMapCache.set(key, map);
  }

  return map;
}

export function useGrassSpriteMap(sprite: GrassSpriteId) {
  const sheet = useGroundSpriteSheet();

  return useMemo(
    () => getCachedGrassSpriteMap(sheet, sprite),
    [sheet, sprite],
  );
}

export function useGrassSpriteMaps(): Record<GrassSpriteId, THREE.Texture> {
  const sheet = useGroundSpriteSheet();

  return useMemo(() => {
    const maps = {} as Record<GrassSpriteId, THREE.Texture>;

    for (const sprite of GRASS_SPRITE_IDS) {
      maps[sprite] = getCachedGrassSpriteMap(sheet, sprite);
    }

    return maps;
  }, [sheet]);
}
