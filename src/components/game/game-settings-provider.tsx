"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { AUTOPLAY_CONFIDENCE_START } from "@/lib/autoplay";
import {
  GAME_SETTINGS_KEYS,
  usePersistedBoolean,
} from "@/lib/game-settings";

type GameSettingsContextValue = {
  autoplayEnabled: boolean;
  setAutoplayEnabled: ReturnType<typeof usePersistedBoolean>[1];
  freezeMapExpansion: boolean;
  setFreezeMapExpansion: ReturnType<typeof usePersistedBoolean>[1];
  autoplayConfidence: number;
  setAutoplayConfidence: (value: number | ((current: number) => number)) => void;
};

const GameSettingsContext = createContext<GameSettingsContextValue | null>(null);

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [autoplayEnabled, setAutoplayEnabled] = usePersistedBoolean(
    GAME_SETTINGS_KEYS.autoplay,
    true,
    { mobileDefault: false, initial: false },
  );
  const [freezeMapExpansion, setFreezeMapExpansion] = usePersistedBoolean(
    GAME_SETTINGS_KEYS.fixedMap,
    true,
  );
  const [autoplayConfidence, setAutoplayConfidence] = useState(
    AUTOPLAY_CONFIDENCE_START,
  );

  return (
    <GameSettingsContext.Provider
      value={{
        autoplayEnabled,
        setAutoplayEnabled,
        freezeMapExpansion,
        setFreezeMapExpansion,
        autoplayConfidence,
        setAutoplayConfidence,
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
