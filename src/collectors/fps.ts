import type { Collector, CollectorContext } from '../core/types.js';

export function createFpsCollector(): Collector {
  let rafId = 0;
  let lastTs = 0;
  let frames = 0;
  let windowStart = 0;
  let ctxRef: CollectorContext | null = null;
  let active = false;

  const loop = (ts: number) => {
    if (!active) return;
    if (!windowStart) windowStart = ts;
    if (lastTs) {
      const delta = ts - lastTs;
      if (delta > 50) {
        // long frame indication (~under 20fps for this frame)
        ctxRef?.push("fps", Math.round(1000 / delta), Date.now());
      }
    }
    lastTs = ts;
    frames++;
    if (ts - windowStart >= 1000) {
      const elapsed = (ts - windowStart) / 1000;
      const fps = Math.round(frames / elapsed);
      ctxRef?.setGauge("fps", fps);
      frames = 0;
      windowStart = ts;
    }
    rafId = requestAnimationFrame(loop);
  };

  return {
    name: "fps",
    start(ctx) {
      ctxRef = ctx;
      if (typeof requestAnimationFrame === "undefined") return;
      active = true;
      lastTs = 0;
      frames = 0;
      windowStart = 0;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      active = false;
      if (rafId && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafId);
      }
      rafId = 0;
      ctxRef = null;
    },
  };
}
