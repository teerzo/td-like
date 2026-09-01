"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  GAME_SETTINGS_KEYS,
  usePersistedBoolean,
} from "@/lib/game-settings";

type GameSettingsContextValue = {
  autoplayEnabled: boolean;
  setAutoplayEnabled: ReturnType<typeof usePersistedBoolean>[1];
  freezeMapExpansion: boolean;
  setFreezeMapExpansion: ReturnType<typeof usePersistedBoolean>[1];
};

const GameSettingsContext = createContext<GameSettingsContextValue | null>(null);

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [autoplayEnabled, setAutoplayEnabled] = usePersistedBoolean(
    GAME_SETTINGS_KEYS.autoplay,
    true,
  );
  const [freezeMapExpansion, setFreezeMapExpansion] = usePersistedBoolean(
    GAME_SETTINGS_KEYS.fixedMap,
    true,
  );

  return (
    <GameSettingsContext.Provider
      value={{
        autoplayEnabled,
        setAutoplayEnabled,
        freezeMapExpansion,
        setFreezeMapExpansion,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  const context = useContext(GameSettingsContext);

  if (!context) {
    throw new Error("useGameSettings must be used within GameSettingsProvider");
  }

  return context;
}
