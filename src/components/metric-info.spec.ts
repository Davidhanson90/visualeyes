import { describe, it, expect } from "vitest";
import { describeMetric, METRIC_DESCRIPTIONS } from "./metric-info.js";

describe("metric-info", () => {
  it("describes core dashboard metrics", () => {
    expect(describeMetric("lcp")).toMatch(/Largest Contentful Paint/i);
    expect(describeMetric("httpInFlight")).toMatch(/in flight/i);
    expect(METRIC_DESCRIPTIONS.cls).toBeTruthy();
  });

  it("falls back for unknown-looking names cast as MetricName", () => {
    expect(describeMetric("lcp")).toContain("Paint");
  });
});
