export type {
  MetricName,
  MetricPoint,
  SeriesMap,
  Snapshot,
  SnapshotListener,
  CollectorOptions,
  TrackerOptions,
  Collector,
  CollectorContext
} from "./core/types.js";
export { ALL_METRIC_NAMES } from "./core/types.js";
export { MetricStore } from "./core/store.js";
export {
  VisualeyesTracker,
  createTracker,
  getDefaultTracker,
  setDefaultTracker
} from "./core/tracker.js";
export { VisualeyesChart } from "./components/visualeyes-chart.js";
export { VisualeyesDashboard } from "./components/visualeyes-dashboard.js";

// Register Lit custom elements as a side effect of importing the package.
import "./components/visualeyes-chart.js";
import "./components/visualeyes-dashboard.js";
