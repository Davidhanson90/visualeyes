import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { PagepulseWaterfall } from "./pagepulse-waterfall.js";
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

describe("PagepulseWaterfall theme", () => {
  it("defaults to dark and reflects theme", async () => {
    const el = new PagepulseWaterfall();
    mount(el);
    await el.updateComplete;
    expect(el.theme).toBe("dark");
    expect(el.getAttribute("theme")).toBe("dark");

    el.theme = "light";
    await el.updateComplete;
    expect(el.getAttribute("theme")).toBe("light");
  });

  it("renders legend and empty state", async () => {
    const el = new PagepulseWaterfall();
    mount(el);
    await el.updateComplete;
    const root = el.shadowRoot!;
    expect(root.querySelector(".legend")?.textContent).toMatch(/script/);
    expect(root.querySelector(".empty")?.textContent).toMatch(/No resource timing/);
  });

  it("shows rows from tracker resource store", async () => {
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
    // Manually inject a row via clear/get path: start resources-less and push through public API
    // Use internal store by adding via a temporary collector path — push through ResourceStore via clearResources + start with mock
    const store = (
      tracker as unknown as { resourceStore: { add: (r: unknown) => void } }
    ).resourceStore;
    store.add({
      id: "1",
      name: "https://example.com/app.js",
      initiatorType: "script",
      startTime: 10,
      responseEnd: 50,
      duration: 40,
      transferSize: 100,
      encodedBodySize: 100,
      decodedBodySize: 100,
      firstParty: true,
      cached: false,
      recordedAt: Date.now()
    });

    const el = new PagepulseWaterfall();
    el.tracker = tracker;
    mount(el);
    await el.updateComplete;
    const root = el.shadowRoot!;
    expect(root.querySelectorAll(".row").length).toBe(1);
    expect(root.querySelector(".bar")).toBeTruthy();
  });
});
