"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";

type WorldMenuProjectorProps = {
  /** World-space point to pin the HTML menu to, or null when no menu. */
  worldPosition: [number, number, number] | null;
  /** The absolutely positioned menu root (left/top updated each frame). */
  targetRef: RefObject<HTMLElement | null>;
};

/**
 * Projects a world position to canvas CSS pixels and writes `left`/`top`
 * on the menu element so it stays anchored while the camera moves.
 */
export function WorldMenuProjector({
  worldPosition,
  targetRef,
}: WorldMenuProjectorProps) {
  const { camera, size } = useThree();
  const ndc = useRef(new THREE.Vector3());

  useFrame(() => {
    const el = targetRef.current;
    if (!el || !worldPosition) {
      return;
    }

    ndc.current.set(worldPosition[0], worldPosition[1], worldPosition[2]);
    ndc.current.project(camera);

    if (ndc.current.z > 1) {
      el.style.visibility = "hidden";
      return;
    }

    el.style.visibility = "visible";
    const x = (ndc.current.x * 0.5 + 0.5) * size.width;
    const y = (-ndc.current.y * 0.5 + 0.5) * size.height;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });

  return null;
}
