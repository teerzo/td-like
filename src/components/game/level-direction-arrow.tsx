"use client";

import { useMemo } from "react";

import {
  globalTileWorldPosition,
  type ChunkOrigin,
} from "@/lib/global-grid";
import { getEntranceEdge, type WorldLayout } from "@/lib/world-layout";

const ARROW_Y = 2.1;
const LEG_LENGTH = 1.65;
const CORNER_LEG_LENGTH = 1.45;
const SHAFT_WIDTH = 0.26;
const SHAFT_HEIGHT = 0.16;
const HEAD_LENGTH = 0.62;
const HEAD_WIDTH = 0.5;
const STRAIGHT_LENGTH = LEG_LENGTH + HEAD_LENGTH;
const STRAIGHT_CENTER_Z = -STRAIGHT_LENGTH / 2;
const CORNER_CENTER_X_RIGHT = -CORNER_LEG_LENGTH / 2;
const CORNER_CENTER_X_LEFT = CORNER_LEG_LENGTH / 2;
const CORNER_CENTER_Z = -CORNER_LEG_LENGTH / 2;

type ArrowVariant = "straight" | "left" | "right";

type LevelDirectionArrowProps = {
  layout: WorldLayout;
  origin: ChunkOrigin;
};

const arrowMaterial = {
  shaft: {
    color: "#f5d547",
    emissive: "#7a5a00",
    emissiveIntensity: 0.35,
    roughness: 0.75,
    metalness: 0.05,
  },
  head: {
    color: "#ffe566",
    emissive: "#9a7200",
    emissiveIntensity: 0.4,
    roughness: 0.7,
    metalness: 0.05,
  },
} as const;

function getExitInwardVector(
  exit: WorldLayout["exit"],
  size: number,
): { x: number; z: number } {
  if (exit.z < 0) {
    return { x: 0, z: 1 };
  }
  if (exit.z >= size) {
    return { x: 0, z: -1 };
  }
  if (exit.x < 0) {
    return { x: 1, z: 0 };
  }
  return { x: -1, z: 0 };
}

function areOppositeEdges(
  a: ReturnType<typeof getEntranceEdge>,
  b: ReturnType<typeof getEntranceEdge>,
) {
  return (
    (a === "north" && b === "south") ||
    (a === "south" && b === "north") ||
    (a === "east" && b === "west") ||
    (a === "west" && b === "east")
  );
}

function getArrowVariant(layout: WorldLayout): {
  variant: ArrowVariant;
  rotationY: number;
} {
  const exitEdge = getEntranceEdge(layout.exit, layout.size);
  const entranceEdge = getEntranceEdge(layout.entrance, layout.size);
  const inward = getExitInwardVector(layout.exit, layout.size);
  const toEntrance = {
    x: layout.entrance.x - layout.exit.x,
    z: layout.entrance.z - layout.exit.z,
  };

  if (areOppositeEdges(exitEdge, entranceEdge)) {
    return {
      variant: "straight",
      rotationY: Math.atan2(toEntrance.x, toEntrance.z),
    };
  }

  const crossY = inward.x * toEntrance.z - inward.z * toEntrance.x;

  return {
    variant: crossY > 0 ? "left" : "right",
    rotationY: Math.atan2(inward.x, inward.z),
  };
}

function ArrowHead({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[HEAD_WIDTH, HEAD_LENGTH, 4]} />
      <meshStandardMaterial {...arrowMaterial.head} />
    </mesh>
  );
}

function StraightArrow() {
  return (
    <>
      <mesh position={[0, 0, LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, LEG_LENGTH]} />
        <meshStandardMaterial {...arrowMaterial.shaft} />
      </mesh>
      <ArrowHead
        position={[0, 0, LEG_LENGTH + HEAD_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </>
  );
}

function RightCornerArrow() {
  return (
    <>
      <mesh position={[0, 0, CORNER_LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, CORNER_LEG_LENGTH]} />
        <meshStandardMaterial {...arrowMaterial.shaft} />
      </mesh>
      <mesh position={[CORNER_LEG_LENGTH / 2, 0, CORNER_LEG_LENGTH]}>
        <boxGeometry args={[CORNER_LEG_LENGTH, SHAFT_HEIGHT, SHAFT_WIDTH]} />
        <meshStandardMaterial {...arrowMaterial.shaft} />
      </mesh>
      <ArrowHead
        position={[CORNER_LEG_LENGTH, 0, CORNER_LEG_LENGTH]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </>
  );
}

function LeftCornerArrow() {
  return (
    <>
      <mesh position={[0, 0, CORNER_LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, CORNER_LEG_LENGTH]} />
        <meshStandardMaterial {...arrowMaterial.shaft} />
      </mesh>
      <mesh position={[-CORNER_LEG_LENGTH / 2, 0, CORNER_LEG_LENGTH]}>
        <boxGeometry args={[CORNER_LEG_LENGTH, SHAFT_HEIGHT, SHAFT_WIDTH]} />
        <meshStandardMaterial {...arrowMaterial.shaft} />
      </mesh>
      <ArrowHead
        position={[-CORNER_LEG_LENGTH, 0, CORNER_LEG_LENGTH]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </>
  );
}

/** Floating arrow from exit toward entrance (travel direction through the level). */
export function LevelDirectionArrow({ layout, origin }: LevelDirectionArrowProps) {
  const { position, rotationY, variant } = useMemo(() => {
    const centerX = Math.floor(layout.size / 2);
    const centerZ = Math.floor(layout.size / 2);
    const centerWorld = globalTileWorldPosition(
      origin.gx + centerX,
      origin.gz + centerZ,
    );
    const { variant: arrowVariant, rotationY: arrowRotation } =
      getArrowVariant(layout);

    return {
      variant: arrowVariant,
      position: [centerWorld.x, ARROW_Y, centerWorld.z] as [
        number,
        number,
        number,
      ],
      rotationY: arrowRotation,
    };
  }, [layout, origin]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group
        position={
          variant === "straight"
            ? ([0, 0, STRAIGHT_CENTER_Z] as [number, number, number])
            : variant === "right"
              ? ([CORNER_CENTER_X_RIGHT, 0, CORNER_CENTER_Z] as [
                  number,
                  number,
                  number,
                ])
              : ([CORNER_CENTER_X_LEFT, 0, CORNER_CENTER_Z] as [
                  number,
                  number,
                  number,
                ])
        }
      >
        {variant === "straight" ? (
          <StraightArrow />
        ) : variant === "left" ? (
          <LeftCornerArrow />
        ) : (
          <RightCornerArrow />
        )}
      </group>
    </group>
  );
}
