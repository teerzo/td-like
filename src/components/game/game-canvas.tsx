"use client";

import dynamic from "next/dynamic";

const scenes = {
  home: dynamic(() => import("@/components/game/home-scene"), {
    ssr: false,
    loading: () => <SceneFallback />,
  }),
  play: dynamic(() => import("@/components/game/play-scene"), {
    ssr: false,
    loading: () => <SceneFallback />,
  }),
};

function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#07080c] text-sm text-muted-foreground">
      Loading 3D scene...
    </div>
  );
}

export function GameCanvas({ scene }: { scene: keyof typeof scenes }) {
  const Scene = scenes[scene];

  return (
    <div className="absolute inset-0">
      <Scene />
    </div>
  );
}
