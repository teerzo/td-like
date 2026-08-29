"use client";

import { useMemo } from "react";

import { DIRT_ROAD_Y } from "@/components/game/models/dirt-road-tile";
import { isStraightDirtTile } from "@/lib/road-tile-appearance";
import {
  globalTileWorldPosition,
  type ChunkOrigin,
} from "@/lib/global-grid";
import { TILE_SIZE } from "@/lib/terrain";
import {
  getExitRoadTileFlow,
  getPathAtExit,
  getPathIndexAtTile,
  getRoadTileFlows,
  isExitTile,
  layoutForPath,
  shouldPlaceDirtTile,
  type RoadTileFlow,
  type WorldLayout,
} from "@/lib/world-layout";

const MARKER_Y = DIRT_ROAD_Y + 0.025;
const EDGE_OFFSET = TILE_SIZE * 0.38;
const LEG_LENGTH = 0.36;
const CORNER_LEG_LENGTH = 0.32;
const SHAFT_WIDTH = 0.06;
const SHAFT_HEIGHT = 0.04;
const HEAD_LENGTH = 0.14;
const HEAD_WIDTH = 0.11;
const ENDPOINT_RADIUS = 0.05;
const STRAIGHT_LENGTH = LEG_LENGTH + HEAD_LENGTH;
const STRAIGHT_CENTER_Z = -STRAIGHT_LENGTH / 2;
const CORNER_CENTER_X_RIGHT = -CORNER_LEG_LENGTH / 2;
const CORNER_CENTER_X_LEFT = CORNER_LEG_LENGTH / 2;
const CORNER_CENTER_Z = -CORNER_LEG_LENGTH / 2;
const PATH_PREVIEW_OPACITY = 0.5;

type ArrowVariant = "straight" | "left" | "right";

type DirtTileFlowMarkersProps = {
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity?: number;
  revealedPathCount?: number;
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

function withOpacity(material: Record<string, unknown>, opacity: number) {
  if (opacity >= 1) {
    return material;
  }

  return {
    ...material,
    transparent: true,
    opacity,
    depthWrite: false,
  };
}

function getArrowOrientation(
  flow: RoadTileFlow,
  layout: WorldLayout,
): {
  variant: ArrowVariant;
  rotationY: number;
} | null {
  const { entryDir, exitDir } = flow;
  const travelDir = exitDir ?? entryDir;

  if (!travelDir) {
    return null;
  }

  if (isStraightDirtTile(layout, flow.x, flow.z)) {
    return {
      variant: "straight",
      rotationY: Math.atan2(travelDir.x, travelDir.z),
    };
  }

  if (!entryDir || !exitDir) {
    return {
      variant: "straight",
      rotationY: Math.atan2(travelDir.x, travelDir.z),
    };
  }

  if (entryDir.x === exitDir.x && entryDir.z === exitDir.z) {
    return {
      variant: "straight",
      rotationY: Math.atan2(travelDir.x, travelDir.z),
    };
  }

  const cross = entryDir.x * exitDir.z - entryDir.z * exitDir.x;

  return {
    variant: cross > 0 ? "left" : "right",
    rotationY: Math.atan2(entryDir.x, entryDir.z),
  };
}

function ArrowHead({
  position,
  rotation,
  opacity,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  opacity: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[HEAD_WIDTH, HEAD_LENGTH, 4]} />
      <meshStandardMaterial {...withOpacity(arrowMaterial.head, opacity)} />
    </mesh>
  );
}

function StraightArrow({ opacity }: { opacity: number }) {
  const shaft = withOpacity(arrowMaterial.shaft, opacity);

  return (
    <>
      <mesh position={[0, 0, LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, LEG_LENGTH]} />
        <meshStandardMaterial {...shaft} />
      </mesh>
      <ArrowHead
        position={[0, 0, LEG_LENGTH + HEAD_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        opacity={opacity}
      />
    </>
  );
}

function RightCornerArrow({ opacity }: { opacity: number }) {
  const shaft = withOpacity(arrowMaterial.shaft, opacity);

  return (
    <>
      <mesh position={[0, 0, CORNER_LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, CORNER_LEG_LENGTH]} />
        <meshStandardMaterial {...shaft} />
      </mesh>
      <mesh position={[CORNER_LEG_LENGTH / 2, 0, CORNER_LEG_LENGTH]}>
        <boxGeometry args={[CORNER_LEG_LENGTH, SHAFT_HEIGHT, SHAFT_WIDTH]} />
        <meshStandardMaterial {...shaft} />
      </mesh>
      <ArrowHead
        position={[CORNER_LEG_LENGTH, 0, CORNER_LEG_LENGTH]}
        rotation={[0, -Math.PI / 2, 0]}
        opacity={opacity}
      />
    </>
  );
}

function LeftCornerArrow({ opacity }: { opacity: number }) {
  const shaft = withOpacity(arrowMaterial.shaft, opacity);

  return (
    <>
      <mesh position={[0, 0, CORNER_LEG_LENGTH / 2]}>
        <boxGeometry args={[SHAFT_WIDTH, SHAFT_HEIGHT, CORNER_LEG_LENGTH]} />
        <meshStandardMaterial {...shaft} />
      </mesh>
      <mesh position={[-CORNER_LEG_LENGTH / 2, 0, CORNER_LEG_LENGTH]}>
        <boxGeometry args={[CORNER_LEG_LENGTH, SHAFT_HEIGHT, SHAFT_WIDTH]} />
        <meshStandardMaterial {...shaft} />
      </mesh>
      <ArrowHead
        position={[-CORNER_LEG_LENGTH, 0, CORNER_LEG_LENGTH]}
        rotation={[0, Math.PI / 2, 0]}
        opacity={opacity}
      />
    </>
  );
}

function FlowArrow({
  flow,
  layout,
  opacity,
}: {
  flow: RoadTileFlow;
  layout: WorldLayout;
  opacity: number;
}) {
  const orientation = getArrowOrientation(flow, layout);

  if (!orientation) {
    return null;
  }

  const { variant, rotationY } = orientation;
  const centerOffset: [number, number, number] =
    variant === "straight"
      ? [0, 0, STRAIGHT_CENTER_Z]
      : variant === "right"
        ? [CORNER_CENTER_X_RIGHT, 0, CORNER_CENTER_Z]
        : [CORNER_CENTER_X_LEFT, 0, CORNER_CENTER_Z];

  return (
    <group rotation={[0, rotationY, 0]}>
      <group position={centerOffset}>
        {variant === "straight" ? (
          <StraightArrow opacity={opacity} />
        ) : variant === "left" ? (
          <LeftCornerArrow opacity={opacity} />
        ) : (
          <RightCornerArrow opacity={opacity} />
        )}
      </group>
    </group>
  );
}

function EndpointMarker({
  x,
  z,
  color,
  opacity,
}: {
  x: number;
  z: number;
  color: string;
  opacity: number;
}) {
  return (
    <mesh position={[x, 0, z]}>
      <sphereGeometry args={[ENDPOINT_RADIUS, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.8}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
      />
    </mesh>
  );
}

function DirtTileFlowMarker({
  flow,
  layout,
  origin,
  opacity,
}: {
  flow: RoadTileFlow;
  layout: WorldLayout;
  origin: ChunkOrigin;
  opacity: number;
}) {
  const { x, z } = globalTileWorldPosition(
    origin.gx + flow.x,
    origin.gz + flow.z,
  );

  return (
    <group position={[x, MARKER_Y, z]}>
      {flow.entryDir ? (
        <EndpointMarker
          x={-flow.entryDir.x * EDGE_OFFSET}
          z={-flow.entryDir.z * EDGE_OFFSET}
          color="#4ade80"
          opacity={opacity}
        />
      ) : null}
      {flow.exitDir ? (
        <EndpointMarker
          x={flow.exitDir.x * EDGE_OFFSET}
          z={flow.exitDir.z * EDGE_OFFSET}
          color="#fb923c"
          opacity={opacity}
        />
      ) : null}
      <FlowArrow flow={flow} layout={layout} opacity={opacity} />
    </group>
  );
}

/** Start/finish markers and a flow arrow for each visible dirt tile. */
export function DirtTileFlowMarkers({
  layout,
  origin,
  opacity = 1,
  revealedPathCount,
}: DirtTileFlowMarkersProps) {
  const flows = useMemo(() => {
    return getRoadTileFlows(layout)
      .filter(({ x, z }) => shouldPlaceDirtTile(layout, x, z))
      .map((flow) => {
        if (!isExitTile(layout, flow.x, flow.z)) {
          return flow;
        }

        const path = getPathAtExit(layout, { x: flow.x, z: flow.z });

        if (!path) {
          return flow;
        }

        return (
          getExitRoadTileFlow(layoutForPath(layout, path)) ?? flow
        );
      });
  }, [layout]);

  return (
    <group>
      {flows.map((flow) => {
        const pathIndex = getPathIndexAtTile(layout, flow.x, flow.z);
        const tileOpacity =
          revealedPathCount === undefined || pathIndex < 0
            ? opacity
            : pathIndex < revealedPathCount
              ? 1
              : PATH_PREVIEW_OPACITY;

        return (
          <DirtTileFlowMarker
            key={`${flow.x}:${flow.z}`}
            flow={flow}
            layout={layout}
            origin={origin}
            opacity={tileOpacity}
          />
        );
      })}
    </group>
  );
}
