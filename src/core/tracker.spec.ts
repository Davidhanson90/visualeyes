import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTracker, getDefaultTracker, setDefaultTracker, PagepulseTracker } from "./tracker.js";
import { MetricStore } from "./store.js";
import type { Collector } from "./types.js";

describe("createTracker", () => {
  beforeEach(() => {
    setDefaultTracker(null);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    setDefaultTracker(null);
  });

  it("starts and stops, registers as default", () => {
    const tracker = createTracker({
      sampleIntervalMs: 1000,
      collectors: { http: false, longTasks: false, dom: true, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    expect(getDefaultTracker()).toBe(tracker);
    tracker.start();
    expect(tracker.isRunning()).toBe(true);
    tracker.stop();
    expect(tracker.isRunning()).toBe(false);
  });

  it("emits snapshots on interval", () => {
    const tracker = createTracker({
      sampleIntervalMs: 500,
      collectors: { http: false, longTasks: false, dom: true, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    const spy = vi.fn();
    tracker.subscribe(spy);
    tracker.start();
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
    const before = spy.mock.calls.length;
    vi.advanceTimersByTime(500);
    expect(spy.mock.calls.length).toBeGreaterThan(before);
    tracker.stop();
  });

  it("getSnapshot returns store data", () => {
    const tracker = createTracker({
      collectors: { http: false, longTasks: false, dom: false, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    tracker.getStore().push("fps", 60);
    const snap = tracker.getSnapshot();
    expect(snap.latest.fps).toBe(60);
    expect(tracker.getStore()).toBeInstanceOf(MetricStore);
  });

  it("start is idempotent", () => {
    const tracker = createTracker({
      collectors: { http: false, longTasks: false, dom: false, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    tracker.start();
    tracker.start();
    expect(tracker.isRunning()).toBe(true);
    tracker.stop();
    tracker.stop();
    expect(tracker.isRunning()).toBe(false);
  });

  it("builds all collectors when flags default on", () => {
    const tracker = createTracker({ sampleIntervalMs: 1000 });
    tracker.start();
    expect(tracker.isRunning()).toBe(true);
    tracker.stop();
  });

  it("dom collector sample path exercises context helpers", () => {
    const tracker = createTracker({
      sampleIntervalMs: 200,
      collectors: { http: false, longTasks: false, dom: true, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    tracker.start();
    vi.advanceTimersByTime(200);
    const snap = tracker.getSnapshot();
    expect(snap.latest.domNodeCount).toBeTypeOf("number");
    tracker.stop();
  });

  it("collector start/sample/stop errors are swallowed", () => {
    const boom: Collector = {
      name: "boom",
      start() {
        throw new Error("start fail");
      },
      stop() {
        throw new Error("stop fail");
      },
      sample() {
        throw new Error("sample fail");
      }
    };
    const tracker = createTracker({
      sampleIntervalMs: 100,
      collectors: { http: false, longTasks: false, dom: false, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    (tracker as unknown as { buildCollectors: () => Collector[] }).buildCollectors = () => [boom];
    expect(() => tracker.start()).not.toThrow();
    expect(() => vi.advanceTimersByTime(100)).not.toThrow();
    expect(() => tracker.stop()).not.toThrow();
  });

  it("context push with explicit time and now() via custom collector", () => {
    const probe: Collector = {
      name: "probe",
      start(ctx) {
        ctx.push("fps", 59, ctx.now());
        ctx.setGauge("cls", 0.01);
      },
      stop() {
        /* noop */
      }
    };
    const tracker = new PagepulseTracker({
      sampleIntervalMs: 1000,
      collectors: { http: false, longTasks: false, dom: false, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    (tracker as unknown as { buildCollectors: () => Collector[] }).buildCollectors = () => [probe];
    tracker.start();
    expect(tracker.getSnapshot().latest.fps).toBe(59);
    expect(tracker.getSnapshot().latest.cls).toBe(0.01);
    tracker.stop();
  });

  it("exposes resource waterfall buffer API", () => {
    const tracker = createTracker({
      firstPartyDomains: ["cdn.example"],
      maxResourceEntries: 50,
      collectors: { http: false, longTasks: false, dom: false, webVitals: false, memory: false, fps: false, loaf: false, connection: false, navigation: false, errors: false, resources: false }
    });
    expect(tracker.getResources()).toEqual([]);
    expect(tracker.getFirstPartyDomains()).toEqual(["cdn.example"]);
    const spy = vi.fn();
    const unsub = tracker.subscribeResources(spy);
    const store = (tracker as unknown as { resourceStore: { add: (r: object) => void } }).resourceStore;
    store.add({
      id: "r1",
      name: "https://cdn.example/a.js",
      initiatorType: "script",
      startTime: 0,
      responseEnd: 10,
      duration: 10,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: true,
      cached: false,
      recordedAt: Date.now()
    });
    expect(spy).toHaveBeenCalled();
    expect(tracker.getResources()).toHaveLength(1);
    tracker.clearResources();
    expect(tracker.getResources()).toHaveLength(0);
    unsub();
  });
});
