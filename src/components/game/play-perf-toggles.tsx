"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";

export type PlayPerfFlags = {
  fog: boolean;
  decor: boolean;
  mountains: boolean;
  castle: boolean;
  previewLevels: boolean;
  combat: boolean;
  grass: boolean;
  /** R3F mouse raycasting against scene meshes (clicks). Orbit still works when off. */
  raycast: boolean;
};

const DEFAULT_PERF_FLAGS: PlayPerfFlags = {
  fog: true,
  decor: true,
  mountains: true,
  castle: true,
  previewLevels: true,
  combat: true,
  grass: true,
  raycast: false,
};

const PERF_TOGGLE_LABELS: { key: keyof PlayPerfFlags; label: string }[] = [
  { key: "fog", label: "Fog" },
  { key: "decor", label: "Decor" },
  { key: "mountains", label: "Mtns" },
  { key: "castle", label: "Castle" },
  { key: "previewLevels", label: "Preview" },
  { key: "combat", label: "Combat" },
  { key: "grass", label: "Grass" },
  { key: "raycast", label: "Rays" },
];

type PlayPerfContextValue = {
  flags: PlayPerfFlags;
  toggle: (key: keyof PlayPerfFlags) => void;
  enableAll: () => void;
  disableHeavy: () => void;
};

const PlayPerfContext = createContext<PlayPerfContextValue | null>(null);

export function PlayPerfProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<PlayPerfFlags>(DEFAULT_PERF_FLAGS);

  const toggle = useCallback((key: keyof PlayPerfFlags) => {
    setFlags((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const enableAll = useCallback(() => {
    setFlags({
      fog: true,
      decor: true,
      mountains: true,
      castle: true,
      previewLevels: true,
      combat: true,
      grass: true,
      raycast: true,
    });
  }, []);

  const disableHeavy = useCallback(() => {
    setFlags({
      fog: false,
      decor: false,
      mountains: false,
      castle: false,
      previewLevels: false,
      combat: true,
      grass: true,
      raycast: false,
    });
  }, []);

  const value = useMemo(
    () => ({ flags, toggle, enableAll, disableHeavy }),
    [flags, toggle, enableAll, disableHeavy],
  );

  return (
    <PlayPerfContext.Provider value={value}>{children}</PlayPerfContext.Provider>
  );
}

export function usePlayPerfFlags(): PlayPerfFlags {
  const ctx = useContext(PlayPerfContext);
  return ctx?.flags ?? DEFAULT_PERF_FLAGS;
}

export function PlayPerfToggles() {
  const pathname = usePathname();
  const ctx = useContext(PlayPerfContext);

  if (!ctx || pathname !== "/play") {
    return null;
  }

  const { flags, toggle, enableAll, disableHeavy } = ctx;

  return (
    <div className="pointer-events-none flex w-full justify-center px-4 pb-1">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-1">
        <span className="shrink-0 pr-1 text-[10px] font-medium uppercase tracking-wide text-white/45">
          Perf
        </span>
        {PERF_TOGGLE_LABELS.map(({ key, label }) => {
          const on = flags[key];
          return (
            <Button
              key={key}
              size="sm"
              variant={on ? "secondary" : "ghost"}
              className={`h-7 shrink-0 px-2 text-xs ${
                on
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "text-white/40 line-through hover:bg-white/10 hover:text-white/70"
              }`}
              onClick={() => toggle(key)}
              title={`${on ? "Disable" : "Enable"} ${label} (watch FPS)`}
            >
              {label}
            </Button>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 px-2 text-xs text-emerald-200/80 hover:bg-white/10"
          onClick={enableAll}
        >
          All on
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 px-2 text-xs text-amber-200/80 hover:bg-white/10"
          onClick={disableHeavy}
        >
          Strip heavy
        </Button>
      </div>
    </div>
  );
}
