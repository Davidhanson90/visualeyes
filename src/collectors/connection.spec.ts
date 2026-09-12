import { describe, it, expect, vi, afterEach } from 'vitest';
import { createConnectionCollector } from './connection.js';
import type { CollectorContext, MetricName } from '../core/types.js';

describe('createConnectionCollector', () => {
  afterEach(() => {
    delete (navigator as Navigator & { connection?: unknown }).connection;
  });

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

  it('reads navigator.connection and listens for change', () => {
    const listeners = new Set<() => void>();
    const conn = {
      rtt: 50,
      downlink: 10,
      effectiveType: '4g',
      addEventListener: (_t: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_t: string, fn: () => void) => listeners.delete(fn),
    };
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: conn,
    });

    const { ctx, gauges } = makeCtx();
    const c = createConnectionCollector();
    c.start(ctx);
    expect(gauges.get('connectionRtt')).toBe(50);
    expect(gauges.get('connectionDownlink')).toBe(10);
    expect(gauges.get('connectionEffectiveType')).toBe(4);

    conn.rtt = 80;
    conn.effectiveType = '3g';
    for (const fn of listeners) fn();
    expect(gauges.get('connectionRtt')).toBe(80);
    expect(gauges.get('connectionEffectiveType')).toBe(3);

    c.sample?.(ctx);
    expect(gauges.get('connectionDownlink')).toBe(10);

    c.stop();
    expect(listeners.size).toBe(0);
  });

  it('maps unknown effectiveType to 0 and soft-fails without connection', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: undefined,
    });
    const { ctx, gauges } = makeCtx();
    const c = createConnectionCollector();
    expect(() => c.start(ctx)).not.toThrow();
    expect(gauges.size).toBe(0);
    c.stop();
  });
});
