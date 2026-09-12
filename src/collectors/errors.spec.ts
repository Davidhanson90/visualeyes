import { describe, it, expect, vi } from 'vitest';
import { createErrorsCollector } from './errors.js';
import type { CollectorContext, MetricName } from '../core/types.js';

describe('createErrorsCollector', () => {
  function makeCtx() {
    const gauges = new Map<MetricName, number>();
    const ctx: CollectorContext = {
      push: vi.fn(),
      setGauge: (name, value) => {
        gauges.set(name, value);
      },
      now: () => Date.now(),
    };
    return { ctx, gauges };
  }

  it('counts window errors and unhandled rejections', () => {
    const { ctx, gauges } = makeCtx();
    const c = createErrorsCollector();
    c.start(ctx);
    expect(gauges.get('errorCount')).toBe(0);
    expect(gauges.get('rejectionCount')).toBe(0);

    window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }));
    window.dispatchEvent(new Event('unhandledrejection'));
    window.dispatchEvent(new Event('unhandledrejection'));

    expect(gauges.get('errorCount')).toBe(1);
    expect(gauges.get('rejectionCount')).toBe(2);

    c.sample?.(ctx);
    expect(gauges.get('errorCount')).toBe(1);

    c.stop();
    window.dispatchEvent(new ErrorEvent('error', { message: 'ignored' }));
    expect(gauges.get('errorCount')).toBe(1);
  });
});
