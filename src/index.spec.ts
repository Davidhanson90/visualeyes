import { describe, it, expect } from "vitest";
import {
  ALL_METRIC_NAMES,
  MetricStore,
  PagepulseTracker,
  createTracker,
  PagepulseChart,
  PagepulseDashboard,
  PagepulseWaterfall,
  PagepulseDataTable,
  ResourceStore,
  isFirstParty,
  THEME_VARS,
  snapshotToTable,
  seriesToTable,
  resourcesToTable,
  downloadData,
  tableToCsv
} from "./index.js";

describe("package exports", () => {
  it("exposes public API and metric names", () => {
    expect(ALL_METRIC_NAMES.length).toBeGreaterThan(5);
    expect(ALL_METRIC_NAMES).toContain("fps");
    expect(MetricStore).toBeTypeOf("function");
    expect(PagepulseTracker).toBeTypeOf("function");
    expect(createTracker).toBeTypeOf("function");
    expect(PagepulseChart).toBeTypeOf("function");
    expect(PagepulseDashboard).toBeTypeOf("function");
    expect(PagepulseWaterfall).toBeTypeOf("function");
    expect(PagepulseDataTable).toBeTypeOf("function");
    expect(ResourceStore).toBeTypeOf("function");
    expect(isFirstParty).toBeTypeOf("function");
    expect(snapshotToTable).toBeTypeOf("function");
    expect(seriesToTable).toBeTypeOf("function");
    expect(resourcesToTable).toBeTypeOf("function");
    expect(downloadData).toBeTypeOf("function");
    expect(tableToCsv).toBeTypeOf("function");
    expect(THEME_VARS.bg).toBe("--pagepulse-bg");
    expect(THEME_VARS.accent).toBe("--pagepulse-accent");
  });

  it("registers custom elements on import", () => {
    expect(customElements.get("pagepulse-chart")).toBe(PagepulseChart);
    expect(customElements.get("pagepulse-dashboard")).toBe(PagepulseDashboard);
    expect(customElements.get("pagepulse-waterfall")).toBe(PagepulseWaterfall);
    expect(customElements.get("pagepulse-data-table")).toBe(PagepulseDataTable);
  });

  it("tracker exposes getDataTable helpers", () => {
    const tracker = createTracker({
      collectors: {
        http: false,
        longTasks: false,
        dom: false,
        webVitals: false,
        memory: false,
        fps: false,
        loaf: false,
        connection: false,
        navigation: false,
        errors: false,
        resources: false
      }
    });
    tracker.getStore().setGauge("fps", 55);
    const table = tracker.getDataTable();
    expect(table.columns).toContain("metric");
    expect(table.rows.some((r) => r.metric === "fps")).toBe(true);
    expect(tracker.getSeriesTable().columns).toEqual(["metric", "t", "v"]);
    expect(tracker.getResourcesTable().rows).toEqual([]);
  });
});
