import type { Collector, CollectorContext } from '../core/types.js';

export function createErrorsCollector(): Collector {
  let errorCount = 0;
  let rejectionCount = 0;
  let ctxRef: CollectorContext | null = null;
  let onError: ((ev: ErrorEvent) => void) | null = null;
  let onRejection: ((ev: PromiseRejectionEvent) => void) | null = null;

  const publish = () => {
    ctxRef?.setGauge('errorCount', errorCount);
    ctxRef?.setGauge('rejectionCount', rejectionCount);
  };

  return {
    name: 'errors',
    start(ctx) {
      ctxRef = ctx;
      errorCount = 0;
      rejectionCount = 0;
      publish();

      if (typeof window === 'undefined') return;

      onError = () => {
        errorCount += 1;
        publish();
      };
      onRejection = () => {
        rejectionCount += 1;
        publish();
      };

      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
    },
    sample(ctx) {
      ctx.setGauge('errorCount', errorCount);
      ctx.setGauge('rejectionCount', rejectionCount);
    },
    stop() {
      if (typeof window !== 'undefined') {
        if (onError) window.removeEventListener('error', onError);
        if (onRejection) window.removeEventListener('unhandledrejection', onRejection);
      }
      onError = null;
      onRejection = null;
      ctxRef = null;
    },
  };
}
