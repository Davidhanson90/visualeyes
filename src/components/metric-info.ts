/** Short hover descriptions for dashboard metric panels. */
import type { MetricName } from "../core/types.js";

export const METRIC_DESCRIPTIONS: Partial<Record<MetricName, string>> = {
  httpInFlight: "Number of fetch/XHR requests currently in flight.",
  requestSize: "Transfer or encoded size of recently observed network resources (bytes).",
  longTaskDuration: "Duration of main-thread long tasks that can block input and rendering.",
  domNodeCount: "Total DOM nodes under documentElement; higher counts cost more layout and style work.",
  domMaxDepth: "Deepest nesting level in the DOM tree; extreme depth can hurt style and layout.",
  lcp: "Largest Contentful Paint — when the main content likely finished painting.",
  cls: "Cumulative Layout Shift — unexpected movement of visible content.",
  inp: "Interaction to Next Paint (or FID fallback) — input responsiveness.",
  ttfb: "Time to First Byte for the navigation response.",
  jsHeapUsed: "JS heap memory in use (Chromium performance.memory when available).",
  jsHeapLimit: "JS heap size limit reported by the browser.",
  fps: "Approximate frames per second from requestAnimationFrame timing.",
  resourceScript: "Count of script resources observed via Resource Timing.",
  resourceCss: "Count of stylesheet resources observed via Resource Timing.",
  resourceImg: "Count of image resources observed via Resource Timing.",
  resourceFetch: "Count of fetch/XHR resources observed via Resource Timing.",
  loafDuration: "Long Animation Frame total duration (Chromium LoAF API).",
  loafScriptDuration: "Script time attributed inside a Long Animation Frame.",
  loafStyleDuration: "Style/layout time attributed inside a Long Animation Frame.",
  connectionRtt: "Estimated round-trip time from the Network Information API.",
  connectionDownlink: "Estimated downlink bandwidth (Mb/s) from the Network Information API.",
  connectionEffectiveType: "Effective connection type as an ordinal (e.g. 2g→4g).",
  navDomContentLoaded: "Time from navigation start to DOMContentLoaded.",
  navLoad: "Time from navigation start to the window load event.",
  softNavCount: "Count of soft (SPA) navigations detected since tracking started.",
  softNavDuration: "Duration associated with the latest soft navigation when available.",
  errorCount: "Cumulative window error events since the tracker started.",
  rejectionCount: "Cumulative unhandled promise rejections since the tracker started."
};

export function describeMetric(metric: MetricName): string {
  return METRIC_DESCRIPTIONS[metric] ?? `Metric: ${metric}`;
}
