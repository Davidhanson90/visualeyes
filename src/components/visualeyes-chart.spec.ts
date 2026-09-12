import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { VisualeyesChart } from "./visualeyes-chart.js";
import { readThemeColor, THEME_VARS } from "./theme.js";

const mounted: HTMLElement[] = [];

function mount(el: HTMLElement): HTMLElement {
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  for (const el of mounted) el.remove();
  mounted.length = 0;
  vi.restoreAllMocks();
});

describe("VisualeyesChart theme", () => {
  it("defaults to dark and reflects the theme attribute", async () => {
    const el = new VisualeyesChart();
    mount(el);
    await el.updateComplete;
    expect(el.theme).toBe("dark");
    expect(el.getAttribute("theme")).toBe("dark");

    el.theme = "light";
    await el.updateComplete;
    expect(el.getAttribute("theme")).toBe("light");
  });

  it("readThemeColor falls back when a variable is missing", () => {
    const el = document.createElement("div");
    mount(el);
    expect(readThemeColor(el, "--visualeyes-missing", "#abc")).toBe("#abc");
  });

  it("readThemeColor uses a set custom property", () => {
    const el = document.createElement("div");
    el.style.setProperty(THEME_VARS.grid, " #112233 ");
    mount(el);
    expect(readThemeColor(el, THEME_VARS.grid, "#000")).toBe("#112233");
  });
});
