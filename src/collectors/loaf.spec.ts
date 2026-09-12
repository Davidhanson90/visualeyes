import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLoafCollector } from './loaf.js';
import type { CollectorContext, MetricName } from '../core/types.js';

describe('createLoafCollector', () => {
  const OriginalPO = globalThis.PerformanceObserver;
  let observeType: string | undefined;
  let handler: ((list: { getEntries: () => PerformanceEntry[] }) => void) | undefined;

  beforeEach(() => {
    observeType = undefined;
    handler = undefined;
    // @ts-expect-error mock
    globalThis.PerformanceObserver = class {
      constructor(cb: typeof handler) {
        handler = cb;
      }
      observe(opts: { type: string }) {
        observeType = opts.type;
      }
      disconnect() {}
    };
  });

  afterEach(() => {
    globalThis.PerformanceObserver = OriginalPO;
  });

  function ctx(): CollectorContext & { pushes: Array<[MetricName, number]> } {
    const pushes: Array<[MetricName, number]> = [];
    return {
      pushes,
      push: (name, value) => {
        pushes.push([name, value]);
      },
      setGauge: vi.fn(),
      now: () => Date.now(),
    };
  }

  it('observes long-animation-frame and records durations', () => {
    const c = createLoafCollector();
    const context = ctx();
    c.start(context);
    expect(observeType).toBe('long-animation-frame');
    handler?.({
      getEntries: () => [
        {
          name: '',
          entryType: 'long-animation-frame',
          startTime: 0,
          duration: 120,
          toJSON() {
            return {};
          },
          scripts: [{ duration: 40 }, { duration: 20 }],
          styleAndLayoutStart: 10,
          renderStart: 35,
        } as PerformanceEntry,
      ],
    });
    expect(context.pushes).toContainEqual(['loafDuration', 120]);
    expect(context.pushes).toContainEqual(['loafScriptDuration', 60]);
    expect(context.pushes).toContainEqual(['loafStyleDuration', 25]);
    c.stop();
  });

  it('fails soft when PerformanceObserver is missing', () => {
    // @ts-expect-error delete
    delete globalThis.PerformanceObserver;
    const c = createLoafCollector();
    expect(() => c.start(ctx())).not.toThrow();
    expect(() => c.stop()).not.toThrow();
  });

  it('fails soft when observe throws', () => {
    // @ts-expect-error mock
    globalThis.PerformanceObserver = class {
      observe() {
        throw new Error('unsupported');
      }
      disconnect() {}
    };
    const c = createLoafCollector();
    expect(() => c.start(ctx())).not.toThrow();
    c.stop();
  });
});
