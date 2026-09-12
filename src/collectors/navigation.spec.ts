import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNavigationCollector } from './navigation.js';
import type { CollectorContext, MetricName } from '../core/types.js';

describe('createNavigationCollector', () => {
  const OriginalPO = globalThis.PerformanceObserver;
  let softHandler: ((list: { getEntries: () => PerformanceEntry[] }) => void) | undefined;

  beforeEach(() => {
    softHandler = undefined;
    // @ts-expect-error mock
    globalThis.PerformanceObserver = class {
      constructor(cb: typeof softHandler) {
        softHandler = cb;
      }
      observe(opts: { type: string }) {
        if (opts.type !== 'soft-navigations' && opts.type !== 'navigation') {
          throw new Error('unsupported');
        }
      }
      disconnect() {}
    };
  });

  afterEach(() => {
    globalThis.PerformanceObserver = OriginalPO;
  });

  function makeCtx() {
    const gauges = new Map<MetricName, number>();
    const pushes: Array<[MetricName, number]> = [];
    const ctx: CollectorContext = {
      push: (name, value) => {
        pushes.push([name, value]);
      },
      setGauge: (name, value) => {
        gauges.set(name, value);
      },
      now: () => Date.now(),
    };
    return { ctx, gauges, pushes };
  }

  it('records hard-nav timing and history soft-navs', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      {
        domContentLoadedEventEnd: 120,
        loadEventEnd: 300,
      } as unknown as PerformanceEntry,
    ]);

    const { ctx, gauges, pushes } = makeCtx();
    const c = createNavigationCollector();
    c.start(ctx);
    expect(gauges.get('navDomContentLoaded')).toBe(120);
    expect(gauges.get('navLoad')).toBe(300);
    expect(gauges.get('softNavCount')).toBe(0);

    history.pushState({}, '', '#soft-1');
    expect(gauges.get('softNavCount')).toBe(1);

    softHandler?.({
      getEntries: () => [
        {
          name: '',
          entryType: 'soft-navigation',
          startTime: 0,
          duration: 45,
          toJSON() {
            return {};
          },
        } as PerformanceEntry,
      ],
    });
    expect(gauges.get('softNavCount')).toBe(2);
    expect(pushes.some(([n, v]) => n === 'softNavDuration' && v === 45)).toBe(true);

    c.stop();
    // restored pushState should not throw
    history.pushState({}, '', '#done');
  });

  it('fails soft without PerformanceObserver', () => {
    // @ts-expect-error delete
    delete globalThis.PerformanceObserver;
    const { ctx } = makeCtx();
    const c = createNavigationCollector();
    expect(() => c.start(ctx)).not.toThrow();
    c.stop();
  });
});
