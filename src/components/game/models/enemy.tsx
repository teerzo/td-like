"use client";

import { VOXEL } from "@/components/game/models/voxel-box";
import type { EnemyTypeId } from "@/lib/enemy-types";

const ENEMY_PALETTES: Record<
  EnemyTypeId,
  { body: string; accent: string; emissive: string }
> = {
  peon: {
    body: "#a16207",
    accent: "#fde68a",
    emissive: "#713f12",
  },
  bat: {
    body: "#44403c",
    accent: "#a8a29e",
    emissive: "#1c1917",
  },
  archer: {
    body: "#4a7c59",
    accent: "#c4a574",
    emissive: "#2d4a35",
  },
  knight: {
    body: "#6b7280",
    accent: "#94a3b8",
    emissive: "#374151",
  },
  catapult: {
    body: "#8b5a2b",
    accent: "#5c4033",
    emissive: "#3e2723",
  },
  dragon: {
    body: "#7c3aed",
    accent: "#f59e0b",
    emissive: "#4c1d95",
  },
};

function HumanoidFigure({
  body,
  accent,
  emissive,
  bulky = false,
}: {
  body: string;
  accent: string;
  emissive: string;
  bulky?: boolean;
}) {
  const bodyH = VOXEL * (bulky ? 1.55 : 1.35);
  const bodyW = VOXEL * (bulky ? 1.55 : 1.2);

  return (
    <group>
      <mesh position={[0, bodyH / 2, 0]}>
        <boxGeometry args={[bodyW, bodyH, bodyW * 0.9]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.3}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, bodyH + VOXEL * 0.5, 0]}>
        <boxGeometry args={[VOXEL * 0.95, VOXEL * 0.95, VOXEL * 0.95]} />
        <meshStandardMaterial
          color={accent}
          emissive={emissive}
          emissiveIntensity={0.2}
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}

function ArcherModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      <HumanoidFigure body={body} accent={accent} emissive={emissive} />
      {/* Bow */}
      <mesh position={[VOXEL * 0.85, VOXEL * 1.1, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[VOXEL * 0.12, VOXEL * 1.4, VOXEL * 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh position={[VOXEL * 0.95, VOXEL * 1.1, 0]}>
        <boxGeometry args={[VOXEL * 0.08, VOXEL * 0.08, VOXEL * 0.9]} />
        <meshStandardMaterial color="#2a2118" roughness={0.8} />
      </mesh>
    </group>
  );
}

function PeonModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      <HumanoidFigure body={body} accent={accent} emissive={emissive} />
      {/* Pickaxe */}
      <mesh position={[VOXEL * 0.75, VOXEL * 0.95, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[VOXEL * 0.12, VOXEL * 1.35, VOXEL * 0.12]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} />
      </mesh>
      <mesh position={[VOXEL * 1.15, VOXEL * 1.55, 0]}>
        <boxGeometry args={[VOXEL * 0.55, VOXEL * 0.22, VOXEL * 0.18]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

function KnightModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      <HumanoidFigure body={body} accent={accent} emissive={emissive} bulky />
      {/* Shield */}
      <mesh position={[-VOXEL * 0.95, VOXEL * 0.95, VOXEL * 0.15]}>
        <boxGeometry args={[VOXEL * 0.18, VOXEL * 1.2, VOXEL * 0.9]} />
        <meshStandardMaterial
          color="#334155"
          emissive="#1e293b"
          emissiveIntensity={0.2}
          roughness={0.6}
          metalness={0.35}
        />
      </mesh>
      {/* Helmet crest */}
      <mesh position={[0, VOXEL * 2.35, 0]}>
        <boxGeometry args={[VOXEL * 0.2, VOXEL * 0.45, VOXEL * 0.55]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.7} />
      </mesh>
    </group>
  );
}

function CatapultModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, VOXEL * 0.55, 0]}>
        <boxGeometry args={[VOXEL * 2.2, VOXEL * 0.7, VOXEL * 1.6]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.25}
          roughness={0.9}
        />
      </mesh>
      {/* Wheels */}
      <mesh position={[VOXEL * 0.85, VOXEL * 0.35, VOXEL * 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[VOXEL * 0.4, VOXEL * 0.4, VOXEL * 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>
      <mesh position={[-VOXEL * 0.85, VOXEL * 0.35, VOXEL * 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[VOXEL * 0.4, VOXEL * 0.4, VOXEL * 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>
      <mesh position={[VOXEL * 0.85, VOXEL * 0.35, -VOXEL * 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[VOXEL * 0.4, VOXEL * 0.4, VOXEL * 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>
      <mesh position={[-VOXEL * 0.85, VOXEL * 0.35, -VOXEL * 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[VOXEL * 0.4, VOXEL * 0.4, VOXEL * 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>
      {/* Arm */}
      <mesh position={[0, VOXEL * 1.35, -VOXEL * 0.2]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[VOXEL * 0.25, VOXEL * 1.8, VOXEL * 0.25]} />
        <meshStandardMaterial color={accent} roughness={0.8} />
      </mesh>
      {/* Basket */}
      <mesh position={[0, VOXEL * 2.05, VOXEL * 0.55]}>
        <boxGeometry args={[VOXEL * 0.7, VOXEL * 0.25, VOXEL * 0.55]} />
        <meshStandardMaterial color="#3f2a1a" roughness={0.85} />
      </mesh>
    </group>
  );
}

function BatModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      <mesh position={[0, VOXEL * 0.55, 0]}>
        <boxGeometry args={[VOXEL * 0.85, VOXEL * 0.65, VOXEL * 1.15]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.3}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, VOXEL * 0.7, VOXEL * 0.7]}>
        <boxGeometry args={[VOXEL * 0.55, VOXEL * 0.5, VOXEL * 0.55]} />
        <meshStandardMaterial
          color={accent}
          emissive={emissive}
          emissiveIntensity={0.2}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[VOXEL * 0.95, VOXEL * 0.75, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[VOXEL * 1.4, VOXEL * 0.08, VOXEL * 0.9]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.2}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[-VOXEL * 0.95, VOXEL * 0.75, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[VOXEL * 1.4, VOXEL * 0.08, VOXEL * 0.9]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.2}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

function DragonModel({
  body,
  accent,
  emissive,
}: {
  body: string;
  accent: string;
  emissive: string;
}) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, VOXEL * 0.9, 0]}>
        <boxGeometry args={[VOXEL * 1.6, VOXEL * 1.1, VOXEL * 2.4]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.4}
          roughness={0.75}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, VOXEL * 1.35, VOXEL * 1.45]}>
        <boxGeometry args={[VOXEL * 1.1, VOXEL * 0.9, VOXEL * 1.1]} />
        <meshStandardMaterial
          color={accent}
          emissive={emissive}
          emissiveIntensity={0.3}
          roughness={0.7}
        />
      </mesh>
      {/* Wings */}
      <mesh position={[VOXEL * 1.5, VOXEL * 1.3, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[VOXEL * 2.2, VOXEL * 0.12, VOXEL * 1.4]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.25}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[-VOXEL * 1.5, VOXEL * 1.3, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[VOXEL * 2.2, VOXEL * 0.12, VOXEL * 1.4]} />
        <meshStandardMaterial
          color={body}
          emissive={emissive}
          emissiveIntensity={0.25}
          roughness={0.8}
        />
      </mesh>
      {/* Tail */}
      <mesh position={[0, VOXEL * 0.7, -VOXEL * 1.6]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[VOXEL * 0.45, VOXEL * 0.45, VOXEL * 1.2]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function EnemyModel({
  typeId = "peon",
}: {
  typeId?: EnemyTypeId;
}) {
  const palette = ENEMY_PALETTES[typeId];

  switch (typeId) {
    case "peon":
      return <PeonModel {...palette} />;
    case "bat":
      return <BatModel {...palette} />;
    case "archer":
      return <ArcherModel {...palette} />;
    case "knight":
      return <KnightModel {...palette} />;
    case "catapult":
      return <CatapultModel {...palette} />;
    case "dragon":
      return <DragonModel {...palette} />;
  }
}
