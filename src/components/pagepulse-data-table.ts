import { LitElement, html, nothing, css } from "lit";
import type { Snapshot } from "../core/types.js";
import type { PagepulseTracker } from "../core/tracker.js";
import { getDefaultTracker } from "../core/tracker.js";
import type { ResourceTimingRow } from "../core/resources.js";
import {
  snapshotToTable,
  resourcesToTable,
  downloadData,
  type DataTable
} from "../core/data-table.js";
import { themeStyles } from "./styles.js";
import type { PagepulseTheme } from "./theme.js";

type TableMode = "metrics" | "resources";

const dataTableStyles = css`
  :host {
    display: block;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
      sans-serif;
    color: var(--pagepulse-text);
    background: var(--pagepulse-bg);
    border-radius: 12px;
    padding: 16px;
    box-sizing: border-box;
  }
  .panel {
    background: var(--pagepulse-panel-bg);
    border: 1px solid var(--pagepulse-panel-border);
    border-radius: 10px;
    padding: 10px 12px 12px;
  }
  header.dt-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
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
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .tabs {
    display: inline-flex;
    gap: 4px;
    background: var(--pagepulse-chart-bg);
    border-radius: 8px;
    padding: 2px;
  }
  button {
    font: inherit;
    font-size: 0.78rem;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--pagepulse-panel-border);
    background: var(--pagepulse-chart-bg);
    color: var(--pagepulse-text);
    cursor: pointer;
  }
  button:hover {
    border-color: var(--pagepulse-accent);
  }
  button.primary {
    background: color-mix(in srgb, var(--pagepulse-accent) 22%, var(--pagepulse-chart-bg));
    border-color: var(--pagepulse-accent);
  }
  button.tab {
    border: none;
    background: transparent;
    color: var(--pagepulse-muted);
  }
  button.tab[aria-selected="true"] {
    background: var(--pagepulse-panel-bg);
    color: var(--pagepulse-text);
    box-shadow: 0 0 0 1px var(--pagepulse-panel-border);
  }
  .scroll {
    max-height: 360px;
    overflow: auto;
    border: 1px solid var(--pagepulse-panel-border);
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--pagepulse-panel-border);
    vertical-align: top;
  }
  th {
    position: sticky;
    top: 0;
    background: var(--pagepulse-panel-bg);
    color: var(--pagepulse-title);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.7rem;
    z-index: 1;
  }
  tr:last-child td {
    border-bottom: none;
  }
  td.num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  td.desc {
    color: var(--pagepulse-muted);
    max-width: 280px;
  }
  td.series {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.7rem;
    color: var(--pagepulse-muted);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    padding: 18px 12px;
    text-align: center;
    color: var(--pagepulse-empty);
    font-size: 0.85rem;
  }
`;

function formatCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "—";
    return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return value;
}

export class PagepulseDataTable extends LitElement {
  static properties = {
    tracker: { attribute: false },
    theme: { type: String, reflect: true },
    mode: { type: String, reflect: true },
    snapshot: { state: true },
    resources: { state: true }
  };

  declare tracker: PagepulseTracker | null;
  declare theme: PagepulseTheme;
  declare mode: TableMode;
  declare private snapshot: Snapshot | null;
  declare private resources: ResourceTimingRow[];

  static styles = [themeStyles, dataTableStyles];

  private unsubscribe: (() => void) | null = null;
  private unsubscribeResources: (() => void) | null = null;

  constructor() {
    super();
    this.tracker = null;
    this.theme = "dark";
    this.mode = "metrics";
    this.snapshot = null;
    this.resources = [];
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.bindTracker();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeResources?.();
    this.unsubscribeResources = null;
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("tracker")) this.bindTracker();
  }

  private bindTracker(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeResources?.();
    this.unsubscribeResources = null;
    const t = this.tracker ?? getDefaultTracker();
    if (!t) {
      this.snapshot = null;
      this.resources = [];
      return;
    }
    this.snapshot = t.getSnapshot();
    this.resources = t.getResources();
    this.unsubscribe = t.subscribe((snap) => {
      this.snapshot = snap;
    });
    this.unsubscribeResources = t.subscribeResources((rows) => {
      this.resources = rows;
    });
  }

  private currentTable(): DataTable {
    if (this.mode === "resources") {
      return resourcesToTable(this.resources);
    }
    if (!this.snapshot) {
      return { columns: ["metric", "latest", "description", "pointCount", "series"], rows: [] };
    }
    return snapshotToTable(this.snapshot);
  }

  private onDownload(format: "json" | "csv"): void {
    const table = this.currentTable();
    const prefix = this.mode === "resources" ? "pagepulse-resources" : "pagepulse-metrics";
    downloadData(table, { format, filename: `${prefix}.${format}` });
  }

  private setMode(mode: TableMode): void {
    this.mode = mode;
  }

  private renderMetricsRows(table: DataTable) {
    if (table.rows.length === 0) {
      return html`<div class="empty">No metrics yet — start the tracker to collect data.</div>`;
    }
    return html`
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Latest</th>
              <th>Description</th>
              <th>Points</th>
              <th>Series</th>
            </tr>
          </thead>
          <tbody>
            ${table.rows.map(
              (row) => html`
                <tr>
                  <td>${formatCell(row.metric)}</td>
                  <td class="num">${formatCell(row.latest)}</td>
                  <td class="desc" title=${String(row.description ?? "")}>${formatCell(row.description)}</td>
                  <td class="num">${formatCell(row.pointCount)}</td>
                  <td class="series" title=${String(row.series ?? "")}>${formatCell(row.series)}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderResourceRows(table: DataTable) {
    if (table.rows.length === 0) {
      return html`<div class="empty">No resource timing rows yet.</div>`;
    }
    const cols = ["name", "initiatorType", "duration", "transferSize", "firstParty", "cached"];
    return html`
      <div class="scroll">
        <table>
          <thead>
            <tr>
              ${cols.map((c) => html`<th>${c}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${table.rows.map(
              (row) => html`
                <tr title=${String(row.name ?? "")}>
                  ${cols.map(
                    (c) => html`<td class=${c === "duration" || c === "transferSize" ? "num" : nothing}>
                      ${formatCell(row[c])}
                    </td>`
                  )}
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const table = this.currentTable();
    const running = (this.tracker ?? getDefaultTracker())?.isRunning() ?? false;
    return html`
      <div class="panel">
        <header class="dt-head">
          <div>
            <h2>Raw data</h2>
            <div class="meta">
              ${running ? "live" : "idle"} · ${table.rows.length} row${table.rows.length === 1 ? "" : "s"}
              ${this.snapshot
                ? html` · ${new Date(this.snapshot.timestamp).toLocaleTimeString()}`
                : nothing}
            </div>
          </div>
          <div class="actions">
            <div class="tabs" role="tablist" aria-label="Data table mode">
              <button
                type="button"
                class="tab"
                role="tab"
                aria-selected=${this.mode === "metrics"}
                @click=${() => this.setMode("metrics")}
              >
                Metrics
              </button>
              <button
                type="button"
                class="tab"
                role="tab"
                aria-selected=${this.mode === "resources"}
                @click=${() => this.setMode("resources")}
              >
                Resources
              </button>
            </div>
            <button type="button" class="primary" @click=${() => this.onDownload("json")}>
              Download JSON
            </button>
            <button type="button" class="primary" @click=${() => this.onDownload("csv")}>
              Download CSV
            </button>
          </div>
        </header>
        ${this.mode === "resources" ? this.renderResourceRows(table) : this.renderMetricsRows(table)}
      </div>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("pagepulse-data-table")) {
  customElements.define("pagepulse-data-table", PagepulseDataTable);
}

declare global {
  interface HTMLElementTagNameMap {
    "pagepulse-data-table": PagepulseDataTable;
  }
}
