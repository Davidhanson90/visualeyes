/** Rolling buffer and helpers for Resource Timing waterfall rows. */

export interface ResourceTimingRow {
  /** Stable id for DOM keys */
  id: string;
  /** Resource URL / name from PerformanceResourceTiming */
  name: string;
  initiatorType: string;
  /** performance.now() start */
  startTime: number;
  /** performance.now() response end */
  responseEnd: number;
  /** responseEnd - startTime */
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  firstParty: boolean;
  /** Heuristic: transferSize === 0 with encoded/decoded body present */
  cached: boolean;
  /** Wall-clock ms when the entry was recorded (for time-based prune) */
  recordedAt: number;
}

export type ResourceListener = (rows: ResourceTimingRow[]) => void;

export interface ResourceStoreOptions {
  maxEntries?: number;
  retentionMs?: number;
}

const DEFAULT_MAX = 150;

/**
 * True when the resource host matches the page host or an allow-listed domain
 * (exact or subdomain suffix).
 */
export function isFirstParty(
  url: string,
  firstPartyDomains: string[] = [],
  pageHost?: string
): boolean {
  const resolvedHost =
    pageHost !== undefined && pageHost !== null
      ? pageHost
      : typeof location !== "undefined"
        ? location.hostname
        : "";
  try {
    let base = "http://localhost/";
    if (typeof location !== "undefined" && location.href) {
      base = location.href;
    }
    const host = new URL(url, base).hostname;
    if (!host) return true;
    if (resolvedHost && (host === resolvedHost || host.endsWith(`.${resolvedHost}`))) {
      return true;
    }
    return firstPartyDomains.some(
      (d) => d.length > 0 && (host === d || host.endsWith(`.${d}`))
    );
  } catch {
    return true;
  }
}

/**
 * Cache heuristic from Resource Timing Level 2:
 * transferSize === 0 while a body size is known usually means a cache hit
 * (or opaque cross-origin without Timing-Allow-Origin — callers may still show it).
 */
export function isCachedResource(entry: {
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}): boolean {
  return (
    entry.transferSize === 0 &&
    (entry.decodedBodySize > 0 || entry.encodedBodySize > 0)
  );
}

export function rowFromPerformanceEntry(
  entry: PerformanceResourceTiming,
  firstPartyDomains: string[] = [],
  recordedAt = Date.now()
): ResourceTimingRow {
  const transferSize = entry.transferSize || 0;
  const encodedBodySize = entry.encodedBodySize || 0;
  const decodedBodySize = entry.decodedBodySize || 0;
  const startTime = entry.startTime;
  const responseEnd =
    entry.responseEnd > startTime ? entry.responseEnd : startTime + (entry.duration || 0);
  return {
    id: `${startTime}-${entry.name}-${Math.random().toString(36).slice(2, 8)}`,
    name: entry.name,
    initiatorType: entry.initiatorType || "other",
    startTime,
    responseEnd,
    duration: Math.max(0, responseEnd - startTime),
    transferSize,
    encodedBodySize,
    decodedBodySize,
    firstParty: isFirstParty(entry.name, firstPartyDomains),
    cached: isCachedResource({ transferSize, encodedBodySize, decodedBodySize }),
    recordedAt
  };
}

export class ResourceStore {
  private rows: ResourceTimingRow[] = [];
  private listeners = new Set<ResourceListener>();
  private maxEntries: number;
  private retentionMs: number;

  constructor(options: ResourceStoreOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX;
    this.retentionMs = options.retentionMs ?? 5 * 60 * 1000;
  }

  add(row: ResourceTimingRow): void {
    this.rows.push(row);
    this.prune(row.recordedAt);
    this.notify();
  }

  getResources(): ResourceTimingRow[] {
    return [...this.rows];
  }

  clear(): void {
    if (this.rows.length === 0) return;
    this.rows = [];
    this.notify();
  }

  subscribe(listener: ResourceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setOptions(options: ResourceStoreOptions): void {
    if (options.maxEntries !== undefined) this.maxEntries = options.maxEntries;
    if (options.retentionMs !== undefined) this.retentionMs = options.retentionMs;
    this.prune(Date.now());
  }

  private prune(now: number): void {
    const cutoff = now - this.retentionMs;
    if (cutoff > 0) {
      this.rows = this.rows.filter((r) => r.recordedAt >= cutoff);
    }
    if (this.rows.length > this.maxEntries) {
      this.rows = this.rows.slice(this.rows.length - this.maxEntries);
    }
  }

  private notify(): void {
    const snapshot = this.getResources();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // listeners must not break the tracker
      }
    }
  }
}
