import { describe, it, expect } from "vitest";
import {
  ALL_METRIC_NAMES,
  MetricStore,
  PagepulseTracker,
  createTracker,
  PagepulseChart,
  PagepulseDashboard,
  PagepulseWaterfall,
  ResourceStore,
  isFirstParty,
  THEME_VARS
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
    expect(ResourceStore).toBeTypeOf("function");
    expect(isFirstParty).toBeTypeOf("function");
    expect(THEME_VARS.bg).toBe("--pagepulse-bg");
    expect(THEME_VARS.accent).toBe("--pagepulse-accent");
  });

  it("registers custom elements on import", () => {
    expect(customElements.get("pagepulse-chart")).toBe(PagepulseChart);
    expect(customElements.get("pagepulse-dashboard")).toBe(PagepulseDashboard);
    expect(customElements.get("pagepulse-waterfall")).toBe(PagepulseWaterfall);
  });
});
