"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ResourceId } from "@/components/game/resource-icon";

export type PlayHudState = {
  level: number;
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
  onAddResource: (resource: ResourceId) => void;
};

type PlayHudContextValue = {
  hud: PlayHudState | null;
  setHud: (hud: PlayHudState | null) => void;
};

const PlayHudContext = createContext<PlayHudContextValue | null>(null);

export function PlayHudProvider({ children }: { children: ReactNode }) {
  const [hud, setHud] = useState<PlayHudState | null>(null);
  const value = useMemo(() => ({ hud, setHud }), [hud]);

  return (
    <PlayHudContext.Provider value={value}>{children}</PlayHudContext.Provider>
  );
}

export function usePlayHud() {
  const context = useContext(PlayHudContext);

  if (!context) {
    throw new Error("usePlayHud must be used within PlayHudProvider");
  }

  return context;
}

export function usePublishPlayHud(hud: PlayHudState) {
  const { setHud } = usePlayHud();
  const { level, gold, iron, wood, stone, food, onAddResource } = hud;

  useEffect(() => {
    setHud({ level, gold, iron, wood, stone, food, onAddResource });
    return () => setHud(null);
  }, [level, gold, iron, wood, stone, food, onAddResource, setHud]);
}
