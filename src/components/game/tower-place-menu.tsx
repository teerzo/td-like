"use client";

import { Canvas } from "@react-three/fiber";

import { TowerModel } from "@/components/game/models";
import {
  getTowerStats,
  TOWER_TYPE_IDS,
  type TowerTypeId,
} from "@/lib/tower-types";

export type TowerPlaceMenuState = {
  gx: number;
  gz: number;
  /** Position relative to the play container. */
  clientX: number;
  clientY: number;
};

type TowerPlaceMenuProps = {
  menu: TowerPlaceMenuState;
  gold: number;
  onSelect: (typeId: TowerTypeId) => void;
  onClose: () => void;
};

const ICON_SIZE = 72;
const RING_RADIUS = 78;
/** Fan the three icons in an arc above the click point. */
const ICON_ANGLES_DEG = [-145, -90, -35] as const;

function TowerPreview({ typeId }: { typeId: TowerTypeId }) {
  return (
    <Canvas
      className="pointer-events-none h-full w-full"
      camera={{ position: [1.35, 1.4, 1.35], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.25} />
      <TowerModel typeId={typeId} position={[0, -0.05, 0]} />
    </Canvas>
  );
}

export function TowerPlaceMenu({
  menu,
  gold,
  onSelect,
  onClose,
}: TowerPlaceMenuProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close tower menu"
        className="pointer-events-auto absolute inset-0 z-20 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        className="pointer-events-none absolute z-30"
        style={{ left: menu.clientX, top: menu.clientY }}
        role="menu"
      >
        {TOWER_TYPE_IDS.map((typeId, index) => {
          const stats = getTowerStats(typeId);
          const canAfford = gold >= stats.cost;
          const angleRad = (ICON_ANGLES_DEG[index]! * Math.PI) / 180;
          const x = Math.cos(angleRad) * RING_RADIUS;
          const y = Math.sin(angleRad) * RING_RADIUS;

          return (
            <button
              key={typeId}
              type="button"
              role="menuitem"
              title={`${stats.label} — ${stats.cost} gold`}
              aria-label={`Place ${stats.label} for ${stats.cost} gold`}
              disabled={!canAfford}
              className={`pointer-events-auto absolute flex size-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 bg-[#1a2332]/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                canAfford
                  ? "border-white/80 hover:scale-110 hover:border-sky-300 hover:bg-[#243044]"
                  : "cursor-not-allowed border-white/30 opacity-45"
              }`}
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                left: x,
                top: y,
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (!canAfford) {
                  return;
                }
                onSelect(typeId);
              }}
            >
              <div className="pointer-events-none h-full w-full">
                <TowerPreview typeId={typeId} />
              </div>
              <span className="pointer-events-none absolute bottom-1 rounded-full bg-black/70 px-1.5 text-[10px] font-semibold text-amber-300">
                {stats.cost}g
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
