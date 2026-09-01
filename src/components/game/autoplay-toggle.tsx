"use client";

type AutoplayToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
};

export function AutoplayToggle({
  enabled,
  onToggle,
  className = "",
}: AutoplayToggleProps) {
  return (
    <button
      type="button"
      className={`rounded-xl border px-3 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md transition ${
        enabled
          ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-50 hover:bg-emerald-500/40"
          : "border-white/25 bg-[#1a2332]/90 text-white/70 hover:border-white/40 hover:text-white"
      } ${className}`}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn autoplay off" : "Turn autoplay on"}
      onClick={onToggle}
    >
      Autoplay {enabled ? "ON" : "OFF"}
    </button>
  );
}
