"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import {
  CASTLE_SPRITE_IDS,
  CASTLE_SPRITE_SHEET,
  castleSpriteUvTransform,
  type CastleSpriteId,
} from "@/lib/pixel-art/castle-sprites";

const castleMapCache = new Map<string, THREE.Texture>();

function configureCastleSpriteMap(
  source: THREE.Texture,
  sprite: CastleSpriteId,
) {
  const map = source.clone();
  const { repeat, offset } = castleSpriteUvTransform(sprite);

  map.repeat.set(repeat[0], repeat[1]);
  map.offset.set(offset[0], offset[1]);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  return map;
}

function getCachedCastleSpriteMap(
  source: THREE.Texture,
  sprite: CastleSpriteId,
) {
  const key = `${source.uuid}:${sprite}`;
  let map = castleMapCache.get(key);

  if (!map) {
    map = configureCastleSpriteMap(source, sprite);
    castleMapCache.set(key, map);
  }

  return map;
}

export function useCastleSpriteSheet() {
  return useTexture(CASTLE_SPRITE_SHEET.path);
}

export function useCastleSpriteMap(sprite: CastleSpriteId) {
  const sheet = useCastleSpriteSheet();

  return useMemo(
    () => getCachedCastleSpriteMap(sheet, sprite),
    [sheet, sprite],
  );
}

export function useCastleSpriteMaps(): Record<CastleSpriteId, THREE.Texture> {
  const sheet = useCastleSpriteSheet();

  return useMemo(() => {
    const maps = {} as Record<CastleSpriteId, THREE.Texture>;

    for (const sprite of CASTLE_SPRITE_IDS) {
      maps[sprite] = getCachedCastleSpriteMap(sheet, sprite);
    }

    return maps;
  }, [sheet]);
}

useTexture.preload(CASTLE_SPRITE_SHEET.path);
