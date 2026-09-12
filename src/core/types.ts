/** Shared types for visualeyes */

export type MetricName =
  | 'httpInFlight'
  | 'requestSize'
  | 'longTaskDuration'
  | 'domNodeCount'
  | 'domMaxDepth'
  | 'lcp'
  | 'cls'
  | 'inp'
  | 'ttfb'
  | 'jsHeapUsed'
  | 'jsHeapLimit'
  | 'fps'
  | 'resourceScript'
  | 'resourceCss'
  | 'resourceImg'
  | 'resourceFetch'
  | 'loafDuration'
  | 'loafScriptDuration'
  | 'loafStyleDuration'
  | 'connectionRtt'
  | 'connectionDownlink'
  | 'connectionEffectiveType'
  | 'navDomContentLoaded'
  | 'navLoad'
  | 'softNavCount'
  | 'softNavDuration'
  | 'errorCount'
  | 'rejectionCount';

export interface MetricPoint {
  t: number;
  v: number;
}

export type SeriesMap = Partial<Record<MetricName, MetricPoint[]>>;

export interface Snapshot {
  timestamp: number;
  series: SeriesMap;
  latest: Partial<Record<MetricName, number>>;
}

export type SnapshotListener = (snapshot: Snapshot) => void;

export interface CollectorOptions {
  http?: boolean;
  longTasks?: boolean;
  dom?: boolean;
  webVitals?: boolean;
  memory?: boolean;
  fps?: boolean;
  loaf?: boolean;
  connection?: boolean;
  navigation?: boolean;
  errors?: boolean;
}

export interface TrackerOptions {
  sampleIntervalMs?: number;
  retentionMs?: number;
  collectors?: CollectorOptions;
}

export interface CollectorContext {
  push: (name: MetricName, value: number, time?: number) => void;
  setGauge: (name: MetricName, value: number) => void;
  now: () => number;
}

export interface Collector {
  name: string;
  start: (ctx: CollectorContext) => void;
  stop: () => void;
  sample?: (ctx: CollectorContext) => void;
}

export const ALL_METRIC_NAMES: MetricName[] = [
  'httpInFlight',
  'requestSize',
  'longTaskDuration',
  'domNodeCount',
  'domMaxDepth',
  'lcp',
  'cls',
  'inp',
  'ttfb',
  'jsHeapUsed',
  'jsHeapLimit',
  'fps',
  'resourceScript',
  'resourceCss',
  'resourceImg',
  'resourceFetch',
  'loafDuration',
  'loafScriptDuration',
  'loafStyleDuration',
  'connectionRtt',
  'connectionDownlink',
  'connectionEffectiveType',
  'navDomContentLoaded',
  'navLoad',
  'softNavCount',
  'softNavDuration',
  'errorCount',
  'rejectionCount',
];
