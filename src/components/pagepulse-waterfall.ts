import { LitElement, html, nothing, css } from "lit";
import type { ResourceTimingRow } from "../core/resources.js";
import type { PagepulseTracker } from "../core/tracker.js";
import { getDefaultTracker } from "../core/tracker.js";
import { themeStyles } from "./styles.js";
import type { PagepulseTheme } from "./theme.js";

/** Colors by initiator type (legend). */
const INITIATOR_COLORS: Record<string, string> = {
  script: "#5b9cff",
  link: "#c79bff",
  css: "#c79bff",
  img: "#7ee0a3",
  image: "#7ee0a3",
  cssfont: "#ffd166",
  font: "#ffd166",
  fetch: "#ff8b6b",
  xmlhttprequest: "#ff8b6b",
  other: "#8b9bb0"
};

const LEGEND_ITEMS: { key: string; label: string; color: string }[] = [
  { key: "script", label: "script", color: INITIATOR_COLORS.script! },
  { key: "css", label: "css / link", color: INITIATOR_COLORS.css! },
  { key: "img", label: "img", color: INITIATOR_COLORS.img! },
  { key: "fetch", label: "fetch / xhr", color: INITIATOR_COLORS.fetch! },
  { key: "font", label: "font", color: INITIATOR_COLORS.font! },
  { key: "other", label: "other", color: INITIATOR_COLORS.other! }
];

function colorFor(row: ResourceTimingRow): string {
  const t = row.initiatorType.toLowerCase();
  return INITIATOR_COLORS[t] ?? INITIATOR_COLORS.other!;
}

function shortName(url: string): string {
  try {
    const u = new URL(url, typeof location !== "undefined" ? location.href : undefined);
    const path = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    return path.length > 40 ? `${path.slice(0, 37)}…` : path;
  } catch {
    return url.length > 40 ? `${url.slice(0, 37)}…` : url;
  }
}

function fmtBytes(v: number): string {
  if (!v) return "0 B";
  if (v < 1024) return `${Math.round(v)} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(2)} MB`;
}

function tooltipFor(row: ResourceTimingRow): string {
  const size = row.transferSize || row.encodedBodySize || row.decodedBodySize;
  return [
    row.name,
    `type: ${row.initiatorType}`,
    `duration: ${Math.round(row.duration)} ms`,
    `size: ${fmtBytes(size)}`,
    row.firstParty ? "1st party" : "3rd party",
    row.cached ? "cached" : "network"
  ].join(" · ");
}

const waterfallStyles = css`
  :host {
    display: block;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
      sans-serif;
    color: var(--pagepulse-text);
  }
  .panel {
    background: var(--pagepulse-panel-bg);
    border: 1px solid var(--pagepulse-panel-border);
    border-radius: 10px;
    padding: 10px 12px 12px;
  }
  header.wf-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--pagepulse-title);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .meta {
    font-size: 0.75rem;
    color: var(--pagepulse-muted);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-bottom: 10px;
    font-size: 0.72rem;
    color: var(--pagepulse-muted);
  }
  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .swatch.third {
    outline: 1px dashed var(--pagepulse-muted);
    outline-offset: 1px;
    opacity: 0.85;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-height: 320px;
    overflow: auto;
    background: var(--pagepulse-chart-bg);
    border-radius: 6px;
    padding: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(80px, 160px) 1fr;
    gap: 8px;
    align-items: center;
    min-height: 18px;
  }
  .label {
    font-size: 0.7rem;
    color: var(--pagepulse-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track {
    position: relative;
    height: 14px;
    background: transparent;
  }
  .bar {
    position: absolute;
    top: 1px;
    height: 12px;
    border-radius: 3px;
    min-width: 2px;
    box-sizing: border-box;
  }
  .bar.third-party {
    opacity: 0.75;
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      rgba(0, 0, 0, 0.18) 3px,
      rgba(0, 0, 0, 0.18) 4px
    );
  }
  .bar.cached {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  }
  .empty {
    font-size: 0.8rem;
    color: var(--pagepulse-empty);
    padding: 16px 8px;
    text-align: center;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: var(--pagepulse-muted);
    margin-top: 4px;
    padding-left: calc(160px + 8px);
  }
  @media (max-width: 600px) {
    .row {
      grid-template-columns: minmax(60px, 100px) 1fr;
    }
    .axis {
      padding-left: calc(100px + 8px);
    }
  }
`;

export class PagepulseWaterfall extends LitElement {
  static properties = {
    tracker: { attribute: false },
    resources: { state: true },
    theme: { type: String, reflect: true },
    firstPartyDomains: { attribute: false }
  };

  declare tracker: PagepulseTracker | null;
  declare private resources: ResourceTimingRow[];
  declare theme: PagepulseTheme;
  declare firstPartyDomains: string[];

  static styles = [themeStyles, waterfallStyles];

  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.tracker = null;
    this.resources = [];
    this.theme = "dark";
    this.firstPartyDomains = [];
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
    if (!t) {
      this.resources = [];
      return;
    }
    this.resources = t.getResources();
    this.unsubscribe = t.subscribeResources((rows) => {
      this.resources = rows;
    });
  }

  private windowBounds(rows: ResourceTimingRow[]): { t0: number; t1: number } {
    if (!rows.length) return { t0: 0, t1: 1 };
    let t0 = Infinity;
    let t1 = -Infinity;
    for (const r of rows) {
      if (r.startTime < t0) t0 = r.startTime;
      if (r.responseEnd > t1) t1 = r.responseEnd;
    }
    if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) {
      return { t0: 0, t1: Math.max(1, t1 || 1) };
    }
    return { t0, t1 };
  }

  render() {
    const rows = this.resources;
    const { t0, t1 } = this.windowBounds(rows);
    const span = Math.max(1, t1 - t0);

    return html`
      <div class="panel">
        <header class="wf-head">
          <h2>Resource waterfall</h2>
          <div class="meta">${rows.length} resource${rows.length === 1 ? "" : "s"}</div>
        </header>
        <div class="legend" aria-label="Waterfall legend">
          ${LEGEND_ITEMS.map(
            (item) => html`
              <span class="legend-item">
                <span class="swatch" style="background:${item.color}"></span>
                ${item.label}
              </span>
            `
          )}
          <span class="legend-item">
            <span class="swatch third" style="background:var(--pagepulse-muted)"></span>
            3rd party (striped)
          </span>
          <span class="legend-item">
            <span
              class="swatch cached"
              style="background:var(--pagepulse-accent);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.5)"
            ></span>
            cached (outline)
          </span>
        </div>
        ${rows.length === 0
          ? html`<div class="empty">No resource timing entries yet — try a fetch burst.</div>`
          : html`
              <div class="rows" role="list">
                ${rows.map((row) => {
                  const left = ((row.startTime - t0) / span) * 100;
                  const width = Math.max(0.4, ((row.responseEnd - row.startTime) / span) * 100);
                  const barClass = [
                    "bar",
                    row.firstParty ? "" : "third-party",
                    row.cached ? "cached" : ""
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return html`
                    <div class="row" role="listitem" title=${tooltipFor(row)}>
                      <div class="label">${shortName(row.name)}</div>
                      <div class="track">
                        <div
                          class=${barClass}
                          style="left:${left}%;width:${width}%;background-color:${colorFor(row)}"
                        ></div>
                      </div>
                    </div>
                  `;
                })}
              </div>
              <div class="axis">
                <span>${Math.round(t0)} ms</span>
                <span>${Math.round(t1)} ms</span>
              </div>
            `}
        ${this.firstPartyDomains?.length
          ? html`<div class="meta" style="margin-top:6px">
              1st-party domains: ${this.firstPartyDomains.join(", ")}
            </div>`
          : nothing}
      </div>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("pagepulse-waterfall")) {
  customElements.define("pagepulse-waterfall", PagepulseWaterfall);
}

declare global {
  interface HTMLElementTagNameMap {
    "pagepulse-waterfall": PagepulseWaterfall;
  }
}
