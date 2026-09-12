import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { VisualeyesDashboard } from "./visualeyes-dashboard.js";
import { themeStyles } from "./styles.js";
import { THEME_VARS } from "./theme.js";

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

describe("VisualeyesDashboard theme", () => {
  it("defaults to dark and reflects the theme attribute", async () => {
    const el = new VisualeyesDashboard();
    mount(el);
    await el.updateComplete;
    expect(el.theme).toBe("dark");
    expect(el.getAttribute("theme")).toBe("dark");

    el.theme = "light";
    await el.updateComplete;
    expect(el.getAttribute("theme")).toBe("light");

    el.theme = "auto";
    await el.updateComplete;
    expect(el.getAttribute("theme")).toBe("auto");
  });

  it("passes theme through to child charts", async () => {
    const el = new VisualeyesDashboard();
    mount(el);
    el.theme = "light";
    await el.updateComplete;
    const charts = el.shadowRoot?.querySelectorAll("visualeyes-chart") ?? [];
    expect(charts.length).toBeGreaterThan(0);
    for (const chart of charts) {
      expect(chart.getAttribute("theme")).toBe("light");
    }
  });

  it("defines documented theme tokens for dark, light, and auto", () => {
    const cssText = themeStyles.cssText;
    expect(cssText).toContain(`${THEME_VARS.bg}: #0b1220`);
    expect(cssText).toContain(`${THEME_VARS.accent}: #5b9cff`);
    expect(cssText).toContain(':host([theme="light"])');
    expect(cssText).toContain(`${THEME_VARS.bg}: #f3f5f8`);
    expect(cssText).toContain("prefers-color-scheme: light");
    expect(cssText).toContain(':host([theme="auto"])');
  });
});
