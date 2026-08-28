"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import {
  GROUND_SPRITE_SHEET,
  spriteUvTransform,
  type GroundSpriteId,
  type TextureWrap,
} from "@/lib/pixel-art/ground-sprites";

const groundMapCache = new Map<string, THREE.Texture>();

function toWrapMode(mode: TextureWrap) {
  return mode === "repeat" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
}

function configureGroundMap(
  source: THREE.Texture,
  sprite: GroundSpriteId,
  tileRepeat: [number, number],
  uvOffset: [number, number] = [0, 0],
) {
  const map = source.clone();
  const { repeat, offset, wrapS, wrapT } = spriteUvTransform(
    sprite,
    tileRepeat,
    uvOffset,
  );

  map.repeat.set(repeat[0], repeat[1]);
  map.offset.set(offset[0], offset[1]);
  map.wrapS = toWrapMode(wrapS);
  map.wrapT = toWrapMode(wrapT);
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  return map;
}

function getCachedGroundMap(
  source: THREE.Texture,
  sprite: GroundSpriteId,
  tileRepeat: [number, number],
  uvOffset: [number, number] = [0, 0],
) {
  const key = `${source.uuid}:${sprite}:${tileRepeat[0]}:${tileRepeat[1]}:${uvOffset[0]}:${uvOffset[1]}`;
  let map = groundMapCache.get(key);

  if (!map) {
    map = configureGroundMap(source, sprite, tileRepeat, uvOffset);
    groundMapCache.set(key, map);
  }

  return map;
}

export function useGroundSpriteSheet() {
  return useTexture(GROUND_SPRITE_SHEET.path);
}

export function useGroundSpriteMap(
  sprite: GroundSpriteId,
  tileRepeat: [number, number] = [1, 1],
  uvOffset: [number, number] = [0, 0],
) {
  const sheet = useGroundSpriteSheet();

  return useMemo(
    () => getCachedGroundMap(sheet, sprite, tileRepeat, uvOffset),
    [sheet, sprite, tileRepeat[0], tileRepeat[1], uvOffset[0], uvOffset[1]],
  );
}

export function GroundSpriteMaterial({
  sprite,
  tileRepeat = [1, 1],
  uvOffset = [0, 0],
}: {
  sprite: GroundSpriteId;
  tileRepeat?: [number, number];
  uvOffset?: [number, number];
}) {
  const map = useGroundSpriteMap(sprite, tileRepeat, uvOffset);

  return <meshStandardMaterial map={map} roughness={0.95} metalness={0} />;
}

useTexture.preload(GROUND_SPRITE_SHEET.path);
