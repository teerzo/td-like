"use client";

import {
  forwardRef,
  useEffect,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { X } from "lucide-react";

import {
  ResourceCostRow,
  type ResourceCostLine,
} from "@/components/game/resource-icon";

export const BUILD_ICON_SIZE = 72;
export const BUILD_RING_RADIUS = 78;
const CLOSE_BUTTON_SIZE = 40;
const CLOSE_BUTTON_OFFSET = BUILD_RING_RADIUS;

type BuildActionMenuProps = {
  clientX: number;
  clientY: number;
  closeLabel: string;
  onClose: () => void;
  actions: BuildActionItem[];
  onActionHover?: (actionId: string | null) => void;
  /** Evenly space portraits across the upper semicircle (tower menus). */
  portraitArc?: "topHalf";
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
  /** Hide the inline badge on the circular icon. */
  showCostBadge?: boolean;
  /** Shown in a floating panel while hovering the icon. */
  hoverContent?: ReactNode;
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

/** Even spacing from left through top to right on the upper semicircle. */
function anglesForTopHalf(count: number): number[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [-90];
  }
  if (count === 2) {
    return [-135, -45];
  }

  const start = -180;
  const end = 0;
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

/** Floating detail card for icon-only build / tower menu buttons. */
export function MenuHoverCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-max max-w-[240px] rounded-lg border border-white/20 bg-[#1a2332]/98 px-3 py-2 text-left text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${className}`}
    >
      {children}
    </div>
  );
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
    { clientX, clientY, closeLabel, onClose, actions, onActionHover, portraitArc },
    ref,
  ) {
    const angles =
      portraitArc === "topHalf"
        ? anglesForTopHalf(actions.length)
        : anglesForCount(actions.length);

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
          const showCostBadge = action.showCostBadge ?? !action.hoverContent;

          return (
            <div
              key={action.id}
              className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                width: BUILD_ICON_SIZE,
                height: BUILD_ICON_SIZE,
                left: x,
                top: y,
              }}
            >
              {action.hoverContent ? (
                <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-50 -translate-x-1/2 scale-95 opacity-0 transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100">
                  {action.hoverContent}
                </div>
              ) : null}
              <button
                type="button"
                role="menuitem"
                title={`${action.label}${summary ? ` — ${summary}` : ""}`}
                aria-label={`${action.label}${summary ? ` ${summary}` : ""}`}
                disabled={disabled}
                className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-[#1a2332]/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  disabled
                    ? "cursor-not-allowed border-white/30 opacity-45"
                    : "border-white/80 hover:scale-110 hover:border-sky-300 hover:bg-[#243044]"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (disabled) {
                    return;
                  }
                  action.onSelect();
                }}
                onPointerEnter={() => {
                  onActionHover?.(action.id);
                }}
                onPointerLeave={() => {
                  onActionHover?.(null);
                }}
              >
                <div className="pointer-events-none h-full w-full">
                  {action.preview}
                </div>
                {showCostBadge ? (
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
                ) : null}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-[#1a2332]/95 text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition hover:scale-110 hover:border-sky-300 hover:bg-[#243044] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          style={{
            width: CLOSE_BUTTON_SIZE,
            height: CLOSE_BUTTON_SIZE,
            left: 0,
            top: CLOSE_BUTTON_OFFSET,
          }}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <X className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    );
  },
);
