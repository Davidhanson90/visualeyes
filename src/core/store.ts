import type { MetricName, MetricPoint, SeriesMap, Snapshot, SnapshotListener } from './types.js';

export class MetricStore {
  private series: SeriesMap = {};
  private gauges: Partial<Record<MetricName, number>> = {};
  private listeners = new Set<SnapshotListener>();
  private retentionMs: number;

  constructor(retentionMs = 5 * 60 * 1000) {
    this.retentionMs = retentionMs;
  }

  setRetention(ms: number): void {
    this.retentionMs = ms;
    this.prune(Date.now());
  }

  push(name: MetricName, value: number, time = Date.now()): void {
    const arr = this.series[name] ?? (this.series[name] = []);
    arr.push({ t: time, v: value });
    this.gauges[name] = value;
    this.prune(time);
  }

  setGauge(name: MetricName, value: number, time = Date.now()): void {
    this.gauges[name] = value;
    this.push(name, value, time);
  }

  getSeries(name: MetricName): MetricPoint[] {
    return [...(this.series[name] ?? [])];
  }

  getLatest(name: MetricName): number | undefined {
    return this.gauges[name];
  }

  snapshot(timestamp = Date.now()): Snapshot {
    const series: SeriesMap = {};
    for (const key of Object.keys(this.series) as MetricName[]) {
      series[key] = [...(this.series[key] ?? [])];
    }
    return {
      timestamp,
      series,
      latest: { ...this.gauges },
    };
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(timestamp = Date.now()): void {
    const snap = this.snapshot(timestamp);
    for (const listener of this.listeners) {
      try {
        listener(snap);
      } catch {
        // listeners must not break the tracker
      }
    }
  }

  clear(): void {
    this.series = {};
    this.gauges = {};
  }

  private prune(now: number): void {
    const cutoff = now - this.retentionMs;
    for (const key of Object.keys(this.series) as MetricName[]) {
      const arr = this.series[key];
      if (!arr || arr.length === 0) continue;
      let i = 0;
      while (i < arr.length && arr[i]!.t < cutoff) i++;
      if (i > 0) this.series[key] = arr.slice(i);
    }
  }
}
