"use client";

type FreezeMapToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
};

export function FreezeMapToggle({
  enabled,
  onToggle,
  className = "",
}: FreezeMapToggleProps) {
  return (
    <button
      type="button"
      className={`rounded-xl border px-3 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md transition ${
        enabled
          ? "border-violet-400/50 bg-violet-500/25 text-violet-50 hover:bg-violet-500/40"
          : "border-white/25 bg-[#1a2332]/90 text-white/70 hover:border-white/40 hover:text-white"
      } ${className}`}
      aria-pressed={enabled}
      aria-label={enabled ? "Allow map expansion" : "Freeze map expansion"}
      onClick={onToggle}
    >
      Fixed Map {enabled ? "ON" : "OFF"}
    </button>
  );
}
