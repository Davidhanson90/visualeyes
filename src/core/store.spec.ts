import { describe, it, expect, vi } from "vitest";
import { MetricStore } from "./store.js";

describe("MetricStore", () => {
  it("pushes points and exposes latest", () => {
    const store = new MetricStore(60_000);
    store.push("fps", 60, 1000);
    store.push("fps", 55, 2000);
    expect(store.getLatest("fps")).toBe(55);
    expect(store.getSeries("fps")).toHaveLength(2);
  });

  it("prunes points older than retention", () => {
    const store = new MetricStore(1000);
    store.push("cls", 0.1, 1000);
    store.push("cls", 0.2, 2500);
    // trigger prune with a new push at t=2500; retention 1000 => cutoff 1500
    expect(store.getSeries("cls").map((p) => p.v)).toEqual([0.2]);
  });

  it("notifies subscribers with snapshot", () => {
    const store = new MetricStore();
    const spy = vi.fn();
    const unsub = store.subscribe(spy);
    store.setGauge("domNodeCount", 42, 5000);
    store.notify(5000);
    expect(spy).toHaveBeenCalledTimes(1);
    const snap = spy.mock.calls[0]![0];
    expect(snap.latest.domNodeCount).toBe(42);
    expect(snap.series.domNodeCount).toHaveLength(1);
    unsub();
    store.notify(6000);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("isolates listener errors", () => {
    const store = new MetricStore();
    store.subscribe(() => {
      throw new Error("boom");
    });
    const ok = vi.fn();
    store.subscribe(ok);
    expect(() => store.notify()).not.toThrow();
    expect(ok).toHaveBeenCalled();
  });

  it("clear empties series", () => {
    const store = new MetricStore();
    store.push("lcp", 1200);
    store.clear();
    expect(store.getSeries("lcp")).toEqual([]);
    expect(store.getLatest("lcp")).toBeUndefined();
  });

  it("setRetention prunes existing points", () => {
    const store = new MetricStore(60_000);
    store.push("fps", 60, 1000);
    store.push("fps", 50, 5000);
    store.setRetention(1000);
    store.push("fps", 40, Date.now());
    expect(store.getLatest("fps")).toBe(40);
    expect(store.getSeries("fps").length).toBeGreaterThanOrEqual(1);
  });

  it("snapshot copies empty series keys safely", () => {
    const store = new MetricStore();
    store.push("fps", 1, 1000);
    (store as unknown as { series: Record<string, unknown[]> }).series.cls = [];
    const snap = store.snapshot(1000);
    expect(snap.series.cls).toEqual([]);
    expect(snap.series.fps).toHaveLength(1);
  });

  it("prune skips empty series arrays", () => {
    const store = new MetricStore(10);
    store.push("fps", 1, 1000);
    (store as unknown as { series: Record<string, unknown[]> }).series.cls = [];
    store.push("fps", 2, 2000);
    expect(store.getSeries("cls")).toEqual([]);
  });
});
