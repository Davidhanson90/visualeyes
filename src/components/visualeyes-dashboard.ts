import { LitElement, html, nothing } from "lit";
import type { MetricName, MetricPoint, Snapshot } from "../core/types.js";
import type { VisualeyesTracker } from "../core/tracker.js";
import { getDefaultTracker } from "../core/tracker.js";
import { dashboardStyles, themeStyles } from "./styles.js";
import type { VisualeyesTheme } from "./theme.js";
import { describeMetric } from "./metric-info.js";
import "./visualeyes-chart.js";
import "./visualeyes-waterfall.js";

interface Panel {
  title: string;
  metric: MetricName;
  color: string;
  format: (v: number | undefined) => string;
  description: string;
}

const panels: Panel[] = [
  { title: "HTTP in-flight", metric: "httpInFlight", color: "#5b9cff", format: fmtInt, description: describeMetric("httpInFlight") },
  { title: "Request size (bytes)", metric: "requestSize", color: "#7ee0a3", format: fmtBytes, description: describeMetric("requestSize") },
  { title: "Long tasks (ms)", metric: "longTaskDuration", color: "#ff8b6b", format: fmtMs, description: describeMetric("longTaskDuration") },
  { title: "DOM nodes", metric: "domNodeCount", color: "#c79bff", format: fmtInt, description: describeMetric("domNodeCount") },
  { title: "DOM max depth", metric: "domMaxDepth", color: "#9bb6ff", format: fmtInt, description: describeMetric("domMaxDepth") },
  { title: "LCP (ms)", metric: "lcp", color: "#ffd166", format: fmtMs, description: describeMetric("lcp") },
  { title: "CLS", metric: "cls", color: "#ef476f", format: fmtFloat, description: describeMetric("cls") },
  { title: "INP / FID (ms)", metric: "inp", color: "#06d6a0", format: fmtMs, description: describeMetric("inp") },
  { title: "TTFB (ms)", metric: "ttfb", color: "#118ab2", format: fmtMs, description: describeMetric("ttfb") },
  { title: "JS heap used", metric: "jsHeapUsed", color: "#f4a261", format: fmtBytes, description: describeMetric("jsHeapUsed") },
  { title: "FPS", metric: "fps", color: "#2a9d8f", format: fmtInt, description: describeMetric("fps") },
  { title: "Resources (script)", metric: "resourceScript", color: "#8ecae6", format: fmtInt, description: describeMetric("resourceScript") },
  { title: "LoAF duration (ms)", metric: "loafDuration", color: "#e76f51", format: fmtMs, description: describeMetric("loafDuration") },
  { title: "Connection RTT (ms)", metric: "connectionRtt", color: "#457b9d", format: fmtMs, description: describeMetric("connectionRtt") },
  { title: "Downlink (Mb/s)", metric: "connectionDownlink", color: "#1d3557", format: fmtFloat, description: describeMetric("connectionDownlink") },
  { title: "Nav DCL (ms)", metric: "navDomContentLoaded", color: "#a8dadc", format: fmtMs, description: describeMetric("navDomContentLoaded") },
  { title: "Nav load (ms)", metric: "navLoad", color: "#457b9d", format: fmtMs, description: describeMetric("navLoad") },
  { title: "Soft navigations", metric: "softNavCount", color: "#f4a261", format: fmtInt, description: describeMetric("softNavCount") },
  { title: "Errors", metric: "errorCount", color: "#e63946", format: fmtInt, description: describeMetric("errorCount") },
  { title: "Unhandled rejections", metric: "rejectionCount", color: "#d62828", format: fmtInt, description: describeMetric("rejectionCount") }
];

function fmtInt(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  return Math.round(v).toLocaleString();
}
function fmtMs(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  return `${Math.round(v)} ms`;
}
function fmtFloat(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(3);
}
function fmtBytes(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  if (v < 1024) return `${Math.round(v)} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(2)} MB`;
}

export class VisualeyesDashboard extends LitElement {
  static properties = {
    tracker: { attribute: false },
    snapshot: { state: true },
    theme: { type: String, reflect: true }
  };

  declare tracker: VisualeyesTracker | null;
  declare private snapshot: Snapshot | null;
  declare theme: VisualeyesTheme;

  static styles = [themeStyles, dashboardStyles];

  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.tracker = null;
    this.snapshot = null;
    this.theme = "dark";
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.bindTracker();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("tracker")) this.bindTracker();
  }

  private bindTracker(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    const t = this.tracker ?? getDefaultTracker();
    if (!t) return;
    this.snapshot = t.getSnapshot();
    this.unsubscribe = t.subscribe((snap) => {
      this.snapshot = snap;
    });
  }

  private series(metric: MetricName): MetricPoint[] {
    return this.snapshot?.series[metric] ?? [];
  }

  private latest(metric: MetricName): number | undefined {
    return this.snapshot?.latest[metric];
  }

  render() {
    const running = (this.tracker ?? getDefaultTracker())?.isRunning() ?? false;
    return html`
      <header>
        <h1>visualeyes</h1>
        <div class="status">${running ? "live" : "idle"} · ${this.snapshot ? new Date(this.snapshot.timestamp).toLocaleTimeString() : nothing}</div>
      </header>
      <div class="grid">
        ${panels.map(
          (p) => html`
          <div class="panel">
            <h2 class="metric-title" title=${p.description} data-tip=${p.description}>${p.title}</h2>
            <div class="value">${p.format(this.latest(p.metric))}</div>
            <visualeyes-chart .data=${this.series(p.metric)} color=${p.color} theme=${this.theme}></visualeyes-chart>
          </div>
        `
        )}
      </div>
      <div class="waterfall">
        <visualeyes-waterfall
          .tracker=${this.tracker ?? getDefaultTracker()}
          .firstPartyDomains=${(this.tracker ?? getDefaultTracker())?.getFirstPartyDomains() ?? []}
          theme=${this.theme}
        ></visualeyes-waterfall>
      </div>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("visualeyes-dashboard")) {
  customElements.define("visualeyes-dashboard", VisualeyesDashboard);
}

declare global {
  interface HTMLElementTagNameMap {
    "visualeyes-dashboard": VisualeyesDashboard;
  }
}
