import type { Collector } from '../core/types.js';

export function createLongTasksCollector(): Collector {
  let observer: PerformanceObserver | null = null;

  return {
    name: "longTasks",
    start(ctx) {
      if (typeof PerformanceObserver === "undefined") return;
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            ctx.push("longTaskDuration", entry.duration, Date.now());
          }
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {
        observer = null;
      }
    },
    stop() {
      observer?.disconnect();
      observer = null;
    },
  };
}
