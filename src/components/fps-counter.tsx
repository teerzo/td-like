"use client";

import { useEffect, useState } from "react";

export function FpsCounter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let frames = 0;
    let lastSample = performance.now();

    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - lastSample;

      if (elapsed >= 500) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastSample = now;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <span
      className="font-mono text-sm tabular-nums text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-base"
      aria-label={`${fps} frames per second`}
    >
      {fps} FPS
    </span>
  );
}
