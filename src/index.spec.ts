import { describe, it, expect } from "vitest";
import {
  ALL_METRIC_NAMES,
  MetricStore,
  VisualeyesTracker,
  createTracker,
  VisualeyesChart,
  VisualeyesDashboard,
  VisualeyesWaterfall,
  ResourceStore,
  isFirstParty,
  THEME_VARS
} from "./index.js";

describe("package exports", () => {
  it("exposes public API and metric names", () => {
    expect(ALL_METRIC_NAMES.length).toBeGreaterThan(5);
    expect(ALL_METRIC_NAMES).toContain("fps");
    expect(MetricStore).toBeTypeOf("function");
    expect(VisualeyesTracker).toBeTypeOf("function");
    expect(createTracker).toBeTypeOf("function");
    expect(VisualeyesChart).toBeTypeOf("function");
    expect(VisualeyesDashboard).toBeTypeOf("function");
    expect(VisualeyesWaterfall).toBeTypeOf("function");
    expect(ResourceStore).toBeTypeOf("function");
    expect(isFirstParty).toBeTypeOf("function");
    expect(THEME_VARS.bg).toBe("--visualeyes-bg");
    expect(THEME_VARS.accent).toBe("--visualeyes-accent");
  });

  it("registers custom elements on import", () => {
    expect(customElements.get("visualeyes-chart")).toBe(VisualeyesChart);
    expect(customElements.get("visualeyes-dashboard")).toBe(VisualeyesDashboard);
    expect(customElements.get("visualeyes-waterfall")).toBe(VisualeyesWaterfall);
  });
});
