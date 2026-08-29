"use client";

import {
  forwardRef,
  useEffect,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";

import {
  ResourceCostRow,
  type ResourceCostLine,
} from "@/components/game/resource-icon";

export const BUILD_ICON_SIZE = 72;
export const BUILD_RING_RADIUS = 78;

type BuildActionMenuProps = {
  clientX: number;
  clientY: number;
  closeLabel: string;
  onClose: () => void;
  actions: BuildActionItem[];
};

export type BuildActionItem = {
  id: string;
  label: string;
  /** Resource costs / refunds shown on the badge. */
  costs?: ResourceCostLine[];
  /** Non-resource note (e.g. max level). */
  costNote?: string;
  /** `refund` uses a green-tinted badge. */
  costTone?: "spend" | "refund";
  canAfford: boolean;
  disabled?: boolean;
  preview: ReactNode;
  onSelect: () => void;
};

function anglesForCount(count: number): number[] {
  if (count <= 1) {
    return [-90];
  }
  if (count === 2) {
    return [-125, -55];
  }
  if (count === 3) {
    return [-145, -90, -35];
  }

  const start = -150;
  const end = -30;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

function costSummary(action: BuildActionItem): string {
  if (action.costNote) {
    return action.costNote;
  }
  if (!action.costs?.length) {
    return "";
  }
  return action.costs
    .map((cost) => {
      const sign = cost.gain ? "+" : "";
      return `${sign}x${cost.amount} ${cost.resource}`;
    })
    .join(", ");
}

/** Mini R3F viewport for building / obstacle previews inside round icons. */
export function BuildIconPreview({
  children,
  cameraPosition = [1.35, 1.4, 1.35],
}: {
  children: ReactNode;
  cameraPosition?: [number, number, number];
}) {
  return (
    <Canvas
      className="pointer-events-none h-full w-full"
      camera={{ position: cameraPosition, fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.25} />
      {children}
    </Canvas>
  );
}

export const BuildActionMenu = forwardRef<HTMLDivElement, BuildActionMenuProps>(
  function BuildActionMenu(
    { clientX, clientY, closeLabel, onClose, actions },
    ref,
  ) {
    const angles = anglesForCount(actions.length);

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [onClose]);

    return (
      <div
        ref={ref}
        className="pointer-events-none absolute z-30"
        style={{ left: clientX, top: clientY }}
        role="menu"
        aria-label={closeLabel}
      >
        {actions.map((action, index) => {
          const angleRad = ((angles[index] ?? -90) * Math.PI) / 180;
          const x = Math.cos(angleRad) * BUILD_RING_RADIUS;
          const y = Math.sin(angleRad) * BUILD_RING_RADIUS;
          const disabled = action.disabled || !action.canAfford;
          const summary = costSummary(action);
          const multiCost = (action.costs?.length ?? 0) > 1;

          return (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              title={`${action.label}${summary ? ` — ${summary}` : ""}`}
              aria-label={`${action.label}${summary ? ` ${summary}` : ""}`}
              disabled={disabled}
              className={`pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 bg-[#1a2332]/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                disabled
                  ? "cursor-not-allowed border-white/30 opacity-45"
                  : "border-white/80 hover:scale-110 hover:border-sky-300 hover:bg-[#243044]"
              }`}
              style={{
                width: BUILD_ICON_SIZE,
                height: BUILD_ICON_SIZE,
                left: x,
                top: y,
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (disabled) {
                  return;
                }
                action.onSelect();
              }}
            >
              <div className="pointer-events-none h-full w-full">
                {action.preview}
              </div>
              <span
                className={`pointer-events-none absolute bottom-0.5 max-w-[90%] rounded-full bg-black/75 px-1 py-0.5 ${
                  action.costTone === "refund"
                    ? "text-emerald-300"
                    : "text-amber-100"
                }`}
              >
                {action.costNote ? (
                  <span className="text-[10px] font-semibold">
                    {action.costNote}
                  </span>
                ) : (
                  <ResourceCostRow
                    costs={action.costs ?? []}
                    className={multiCost ? "flex-col gap-0.5" : ""}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
