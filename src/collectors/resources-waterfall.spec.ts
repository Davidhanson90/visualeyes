import { describe, it, expect, vi, afterEach } from 'vitest';
import { createResourcesWaterfallCollector } from './resources-waterfall.js';
import { ResourceStore } from '../core/resources.js';
import type { CollectorContext } from '../core/types.js';

describe('createResourcesWaterfallCollector', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeCtx() {
    const ctx: CollectorContext = {
      push: vi.fn(),
      setGauge: vi.fn(),
      now: () => Date.now(),
    };
    return ctx;
  }

  it('soft-fails when PerformanceObserver is missing', () => {
    const original = globalThis.PerformanceObserver;
    // @ts-expect-error test override
    delete globalThis.PerformanceObserver;
    const store = new ResourceStore();
    const c = createResourcesWaterfallCollector({ store });
    expect(() => c.start(makeCtx())).not.toThrow();
    c.stop();
    globalThis.PerformanceObserver = original;
  });

  it('ingests resource entries from observer callbacks', () => {
    const callbacks: Array<(list: { getEntries: () => PerformanceEntry[] }) => void> = [];
    class FakePO {
      cb: (list: { getEntries: () => PerformanceEntry[] }) => void;
      constructor(cb: (list: { getEntries: () => PerformanceEntry[] }) => void) {
        this.cb = cb;
        callbacks.push(cb);
      }
      observe() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    }
    vi.stubGlobal('PerformanceObserver', FakePO);
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);

    const store = new ResourceStore();
    const c = createResourcesWaterfallCollector({
      store,
      firstPartyDomains: ['cdn.test'],
      clearOnSoftNav: false,
    });
    c.start(makeCtx());
    expect(callbacks.length).toBeGreaterThanOrEqual(1);

    const entry = {
      name: 'https://cdn.test/app.js',
      initiatorType: 'script',
      startTime: 5,
      responseEnd: 25,
      duration: 20,
      transferSize: 0,
      encodedBodySize: 500,
      decodedBodySize: 1000,
    } as PerformanceResourceTiming;

    callbacks[0]!({ getEntries: () => [entry] });
    const rows = store.getResources();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.cached).toBe(true);
    expect(rows[0]!.firstParty).toBe(true);

    // duplicate key ignored
    callbacks[0]!({ getEntries: () => [entry] });
    expect(store.getResources()).toHaveLength(1);

    c.stop();
  });
});
