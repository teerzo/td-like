import { useCallback, useEffect, useState } from "react";

export const GAME_SETTINGS_KEYS = {
  autoplay: "td-like-autoplay",
  fixedMap: "td-like-fixed-map",
} as const;

export function readGameSetting(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw === "true") {
      return true;
    }
    if (raw === "false") {
      return false;
    }
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }

  return defaultValue;
}

export function writeGameSetting(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors.
  }
}

export function usePersistedBoolean(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(readGameSetting(key, defaultValue));
  }, [key, defaultValue]);

  const setPersistedValue = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setValue((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        writeGameSetting(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setPersistedValue] as const;
}
