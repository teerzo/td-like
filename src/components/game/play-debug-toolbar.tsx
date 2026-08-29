"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";

export type PlayDebugToolbarState = {
  spawnedLevelCount: number;
  showAddPath: boolean;
  addPathDisabled: boolean;
  autoSpawnEnemies: boolean;
};

export type PlayDebugToolbarHandlers = {
  onSpawnLevel: () => void;
  onAddPath: () => void;
  onSpawnGrunt: () => void;
  onSpawnFlyer: () => void;
  onToggleAutoSpawn: () => void;
};

type PlayDebugToolbarActions = PlayDebugToolbarState & PlayDebugToolbarHandlers;

type PlayDebugToolbarContextValue = {
  actions: PlayDebugToolbarActions | null;
  setActions: (actions: PlayDebugToolbarActions | null) => void;
};

const PlayDebugToolbarContext =
  createContext<PlayDebugToolbarContextValue | null>(null);

export function PlayDebugToolbarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [actions, setActions] = useState<PlayDebugToolbarActions | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);

  return (
    <PlayDebugToolbarContext.Provider value={value}>
      {children}
    </PlayDebugToolbarContext.Provider>
  );
}

function usePlayDebugToolbarContext() {
  const ctx = useContext(PlayDebugToolbarContext);
  if (!ctx) {
    throw new Error(
      "PlayDebugToolbarProvider is required for play debug toolbar",
    );
  }
  return ctx;
}

/** Registers play-scene debug actions into the header subnav; clears on unmount. */
export function useRegisterPlayDebugToolbar(
  state: PlayDebugToolbarState,
  handlers: PlayDebugToolbarHandlers,
) {
  const { setActions } = usePlayDebugToolbarContext();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    setActions({
      spawnedLevelCount: state.spawnedLevelCount,
      showAddPath: state.showAddPath,
      addPathDisabled: state.addPathDisabled,
      autoSpawnEnemies: state.autoSpawnEnemies,
      onSpawnLevel: () => handlersRef.current.onSpawnLevel(),
      onAddPath: () => handlersRef.current.onAddPath(),
      onSpawnGrunt: () => handlersRef.current.onSpawnGrunt(),
      onSpawnFlyer: () => handlersRef.current.onSpawnFlyer(),
      onToggleAutoSpawn: () => handlersRef.current.onToggleAutoSpawn(),
    });

    return () => {
      setActions(null);
    };
  }, [
    setActions,
    state.spawnedLevelCount,
    state.showAddPath,
    state.addPathDisabled,
    state.autoSpawnEnemies,
  ]);
}

export function PlayDebugSubnav() {
  const { actions } = usePlayDebugToolbarContext();

  if (!actions) {
    return null;
  }

  return (
    <div className="pointer-events-none flex w-full justify-center px-4 pb-1">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center gap-2 overflow-x-auto border-t border-white/10 px-3 py-1.5">
        <Button
          size="sm"
          className="min-w-24 shrink-0 bg-white/15 text-white hover:bg-white/25"
          onClick={actions.onSpawnLevel}
        >
          Spawn
          {actions.spawnedLevelCount > 0
            ? ` (${actions.spawnedLevelCount})`
            : ""}
        </Button>
        {actions.showAddPath ? (
          <Button
            size="sm"
            variant="secondary"
            className="min-w-24 shrink-0"
            disabled={actions.addPathDisabled}
            onClick={actions.onAddPath}
          >
            Add Path
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className="min-w-24 shrink-0"
          onClick={actions.onSpawnGrunt}
        >
          Spawn Grunt
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="min-w-24 shrink-0"
          onClick={actions.onSpawnFlyer}
        >
          Spawn Flyer
        </Button>
        <Button
          size="sm"
          variant={actions.autoSpawnEnemies ? "default" : "secondary"}
          className="min-w-24 shrink-0"
          onClick={actions.onToggleAutoSpawn}
        >
          {actions.autoSpawnEnemies ? "Stop Auto" : "Auto Spawn"}
        </Button>
      </div>
    </div>
  );
}
