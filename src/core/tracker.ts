import type { Collector, CollectorOptions, SnapshotListener, TrackerOptions } from './types.js';
import { MetricStore } from './store.js';
import { createHttpCollector } from '../collectors/http.js';
import { createLongTasksCollector } from '../collectors/long-tasks.js';
import { createDomCollector } from '../collectors/dom.js';
import { createWebVitalsCollector } from '../collectors/web-vitals.js';
import { createMemoryCollector } from '../collectors/memory.js';
import { createFpsCollector } from '../collectors/fps.js';

const DEFAULT_COLLECTORS: Required<CollectorOptions> = {
  http: true,
  longTasks: true,
  dom: true,
  webVitals: true,
  memory: true,
  fps: true,
};

export class VisualeyesTracker {
  private store: MetricStore;
  private collectors: Collector[] = [];
  private sampleIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private options: TrackerOptions;

  constructor(options: TrackerOptions = {}) {
    this.options = options;
    this.sampleIntervalMs = options.sampleIntervalMs ?? 1000;
    this.store = new MetricStore(options.retentionMs ?? 5 * 60 * 1000);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.collectors = this.buildCollectors();
    const ctx = this.createContext();
    for (const c of this.collectors) {
      try {
        c.start(ctx);
      } catch {
        // fail soft
      }
    }
    this.timer = setInterval(() => this.tick(), this.sampleIntervalMs);
    this.tick();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const c of this.collectors) {
      try {
        c.stop();
      } catch {
        // fail soft
      }
    }
    this.collectors = [];
  }

  isRunning(): boolean {
    return this.running;
  }

  subscribe(listener: SnapshotListener): () => void {
    return this.store.subscribe(listener);
  }

  getSnapshot() {
    return this.store.snapshot();
  }

  getStore(): MetricStore {
    return this.store;
  }

  private tick(): void {
    const ctx = this.createContext();
    for (const c of this.collectors) {
      if (c.sample) {
        try {
          c.sample(ctx);
        } catch {
          // fail soft
        }
      }
    }
    this.store.notify();
  }

  private createContext() {
    return {
      push: (name: Parameters<MetricStore["push"]>[0], value: number, time?: number) =>
        this.store.push(name, value, time),
      setGauge: (name: Parameters<MetricStore["setGauge"]>[0], value: number) =>
        this.store.setGauge(name, value),
      now: () => Date.now(),
    };
  }

  private buildCollectors(): Collector[] {
    const flags = { ...DEFAULT_COLLECTORS, ...this.options.collectors };
    const list: Collector[] = [];
    if (flags.http) list.push(createHttpCollector());
    if (flags.longTasks) list.push(createLongTasksCollector());
    if (flags.dom) list.push(createDomCollector());
    if (flags.webVitals) list.push(createWebVitalsCollector());
    if (flags.memory) list.push(createMemoryCollector());
    if (flags.fps) list.push(createFpsCollector());
    return list;
  }
}

let defaultTracker: VisualeyesTracker | null = null;

export function createTracker(options?: TrackerOptions): VisualeyesTracker {
  const tracker = new VisualeyesTracker(options);
  defaultTracker = tracker;
  return tracker;
}

export function getDefaultTracker(): VisualeyesTracker | null {
  return defaultTracker;
}

export function setDefaultTracker(tracker: VisualeyesTracker | null): void {
  defaultTracker = tracker;
}
