"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { GrassGround } from "@/components/game/ground-plane";
import { centeredOriginForSize } from "@/lib/global-grid";
import {
  CastleModel,
  DirtRoadTile,
  MountainModel,
  PondModel,
  RockModel,
  TowerModel,
  TreeModel,
  treeVariant,
} from "@/components/game/models";
import {
  DIRT_ROAD_Y,
  DIRT_TILE_REPEAT,
} from "@/components/game/models/dirt-road-tile";
import { useGroundSpriteMap } from "@/lib/pixel-art/use-ground-sprite-sheet";
import { SHOW_DIRT_TILES, SHOW_TREES } from "@/lib/terrain";

function HomeRoadStrip() {
  const dirtMap = useGroundSpriteMap("dirt", DIRT_TILE_REPEAT);

  if (!SHOW_DIRT_TILES) {
    return null;
  }

  return (
    <>
      <DirtRoadTile map={dirtMap} position={[-1.5, DIRT_ROAD_Y, 0]} />
      <DirtRoadTile map={dirtMap} position={[0, DIRT_ROAD_Y, 0]} />
      <DirtRoadTile map={dirtMap} position={[1.5, DIRT_ROAD_Y, 0]} />
    </>
  );
}

export default function HomeScene() {
  const trees = [
    { x: -2.2, z: -1.4, seed: 1 },
    { x: 1.8, z: -1.8, seed: 2 },
    { x: -1.6, z: 2.1, seed: 3 },
    { x: 2.4, z: 1.5, seed: 4 },
  ];

  return (
    <Canvas camera={{ position: [10, 8, 10], fov: 50 }}>
      <color attach="background" args={["#07080c"]} />
      <fog attach="fog" args={["#07080c", 12, 28]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 14, 6]} intensity={1.35} />
      <GrassGround size={5} origin={centeredOriginForSize(5)} />
      <HomeRoadStrip />
      {SHOW_TREES
        ? trees.map((tree) => {
            const variant = treeVariant(tree.seed, tree.seed * 3);

            return (
              <TreeModel
                key={tree.seed}
                position={[tree.x + variant.offsetX, 0, tree.z + variant.offsetZ]}
                rotation={variant.rotation}
                scale={variant.scale}
              />
            );
          })
        : null}
      <CastleModel position={[-2.5, 0.5, -2]} />
      <TowerModel typeId="rook" position={[2.5, 0.5, 2]} />
      <TowerModel typeId="archer" position={[1.2, 0.5, 2.4]} />
      <TowerModel typeId="mage" position={[3.6, 0.5, 1.5]} />
      <RockModel position={[-1.2, 0, 1.6]} rotation={0.4} scale={1.1} />
      <MountainModel position={[2.1, 0, -1.3]} scale={1.05} />
      <PondModel position={[-2, 0, 2.2]} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.45}
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
}
