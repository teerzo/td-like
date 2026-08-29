"use client";

import { useCastleSpriteMap } from "@/lib/pixel-art/use-castle-sprite-maps";
import type { LevelEdge } from "@/lib/world-layout";
import { DebugClickVolume } from "@/components/game/debug-hitbox";

const POST_W = 0.16;
const POST_H = 0.72;
const BEAM_H = 0.14;
const GATE_Y = 0.02;
const GATE_HIT_SIZE: [number, number, number] = [0.85, POST_H + 0.1, 0.55];

function yawForEdge(edge: LevelEdge) {
  switch (edge) {
    case "north":
      return 0;
    case "south":
      return Math.PI;
    case "west":
      return Math.PI / 2;
    case "east":
      return -Math.PI / 2;
  }
}

type EdgeGateModelProps = {
  position: [number, number, number];
  edge: LevelEdge;
  onClick?: (pointer: { clientX: number; clientY: number }) => void;
};

/** Locked wooden gate on an unused map edge. */
export function EdgeGateModel({ position, edge, onClick }: EdgeGateModelProps) {
  const woodMap = useCastleSpriteMap("wood");
  const stoneMap = useCastleSpriteMap("stone");

  return (
    <group position={position} rotation={[0, yawForEdge(edge), 0]}>
      <DebugClickVolume
        position={[0, GATE_Y + POST_H / 2, 0]}
        size={GATE_HIT_SIZE}
        color="#38bdf8"
        onClick={(event) => {
          if (!onClick) {
            return;
          }
          event.stopPropagation();
          onClick({ clientX: event.clientX, clientY: event.clientY });
        }}
        onPointerOver={(event) => {
          if (!onClick) {
            return;
          }
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (!onClick) {
            return;
          }
          document.body.style.cursor = "auto";
        }}
      />
      <mesh position={[-0.28, GATE_Y + POST_H / 2, 0]} castShadow>
        <boxGeometry args={[POST_W, POST_H, POST_W]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.28, GATE_Y + POST_H / 2, 0]} castShadow>
        <boxGeometry args={[POST_W, POST_H, POST_W]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, GATE_Y + POST_H - BEAM_H / 2, 0]} castShadow>
        <boxGeometry args={[0.72, BEAM_H, POST_W]} />
        <meshStandardMaterial map={woodMap} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, GATE_Y + 0.22, 0.02]} castShadow>
        <boxGeometry args={[0.42, 0.36, 0.08]} />
        <meshStandardMaterial map={stoneMap} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0, GATE_Y + 0.52, 0.06]}>
        <boxGeometry args={[0.18, 0.18, 0.06]} />
        <meshStandardMaterial
          color="#e8c84a"
          roughness={0.55}
          metalness={0.35}
        />
      </mesh>
    </group>
  );
}
