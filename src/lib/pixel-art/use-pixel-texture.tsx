"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import { TEXTURES, type TextureId } from "@/lib/pixel-art/textures";

const textureMapCache = new Map<string, THREE.Texture>();

function configureTextureMap(
  source: THREE.Texture,
  repeat: [number, number] = [1, 1],
) {
  const map = source.clone();
  map.repeat.set(repeat[0], repeat[1]);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}

function getCachedTextureMap(
  source: THREE.Texture,
  repeat: [number, number],
) {
  const key = `${source.uuid}:${repeat[0]}:${repeat[1]}`;
  let map = textureMapCache.get(key);

  if (!map) {
    map = configureTextureMap(source, repeat);
    textureMapCache.set(key, map);
  }

  return map;
}

export function usePixelTextureSource(id: TextureId) {
  return useTexture(TEXTURES[id]);
}

export function usePixelTextureMap(
  id: TextureId,
  repeat: [number, number] = [1, 1],
) {
  const source = usePixelTextureSource(id);

  return useMemo(
    () => getCachedTextureMap(source, repeat),
    [source, repeat[0], repeat[1]],
  );
}

export function PixelTextureMaterial({
  texture,
  repeat = [1, 1],
}: {
  texture: TextureId;
  repeat?: [number, number];
}) {
  const map = usePixelTextureMap(texture, repeat);

  return <meshStandardMaterial map={map} roughness={0.95} metalness={0} />;
}

for (const path of Object.values(TEXTURES)) {
  useTexture.preload(path);
}

useTexture.preload("/textures/ground-tiles.png");
