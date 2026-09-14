import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { PagepulseDataTable } from "./pagepulse-data-table.js";
import { createTracker, setDefaultTracker } from "../core/tracker.js";

const mounted: HTMLElement[] = [];

function mount(el: HTMLElement): HTMLElement {
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}

beforeEach(() => {
  setDefaultTracker(null);
});

afterEach(() => {
  for (const el of mounted) el.remove();
  mounted.length = 0;
  setDefaultTracker(null);
  vi.restoreAllMocks();
});

describe("PagepulseDataTable", () => {
  it("defaults to dark theme and metrics mode", async () => {
    const el = new PagepulseDataTable();
    mount(el);
    await el.updateComplete;
    expect(el.theme).toBe("dark");
    expect(el.getAttribute("theme")).toBe("dark");
    expect(el.mode).toBe("metrics");
  });

  it("renders download buttons and metric rows from a tracker", async () => {
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
    tracker.getStore().setGauge("fps", 60);
    tracker.getStore().push("fps", 60);

    const el = new PagepulseDataTable();
    el.tracker = tracker;
    mount(el);
    await el.updateComplete;

    const root = el.shadowRoot;
    expect(root?.textContent).toContain("Download JSON");
    expect(root?.textContent).toContain("Download CSV");
    expect(root?.textContent).toContain("fps");
    expect(root?.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
  });

  it("switches to resources tab", async () => {
    const el = new PagepulseDataTable();
    mount(el);
    await el.updateComplete;
    const tabs = el.shadowRoot?.querySelectorAll('button.tab') ?? [];
    expect(tabs.length).toBe(2);
    (tabs[1] as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.mode).toBe("resources");
    expect(el.shadowRoot?.textContent).toMatch(/No resource timing rows|initiatorType|Resources/i);
  });

  it("reflects theme attribute", async () => {
    const el = new PagepulseDataTable();
    mount(el);
    el.theme = "light";
    await el.updateComplete;
    expect(el.getAttribute("theme")).toBe("light");
  });
});
