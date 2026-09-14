import { describe, it, expect, afterEach, vi } from "vitest";
import type { Snapshot } from "./types.js";
import type { ResourceTimingRow } from "./resources.js";
import {
  snapshotToTable,
  seriesToTable,
  resourcesToTable,
  gaugesToTable,
  tableToCsv,
  tableToJson,
  escapeCsvCell,
  downloadData
} from "./data-table.js";

function sampleSnapshot(): Snapshot {
  return {
    timestamp: 1_700_000_000_000,
    latest: {
      fps: 60,
      lcp: 1200,
      cls: 0.05
    },
    series: {
      fps: [
        { t: 1_700_000_000_000, v: 58 },
        { t: 1_700_000_001_000, v: 60 }
      ],
      lcp: [{ t: 1_700_000_000_500, v: 1200 }]
    }
  };
}

const sampleResource = (): ResourceTimingRow => ({
  id: "r1",
  name: "https://example.com/app.js",
  initiatorType: "script",
  startTime: 10,
  responseEnd: 40,
  duration: 30,
  transferSize: 1024,
  encodedBodySize: 1000,
  decodedBodySize: 2000,
  firstParty: true,
  cached: false,
  recordedAt: 1_700_000_000_000
});

describe("snapshotToTable", () => {
  it("builds gauge rows with description and series JSON", () => {
    const table = snapshotToTable(sampleSnapshot());
    expect(table.columns).toEqual(["metric", "latest", "description", "pointCount", "series"]);
    const fps = table.rows.find((r) => r.metric === "fps");
    expect(fps?.latest).toBe(60);
    expect(fps?.pointCount).toBe(2);
    expect(typeof fps?.description).toBe("string");
    expect(String(fps?.description).length).toBeGreaterThan(5);
    expect(fps?.series).toContain('"v":60');
    const cls = table.rows.find((r) => r.metric === "cls");
    expect(cls?.latest).toBe(0.05);
    expect(cls?.pointCount).toBe(0);
    expect(cls?.series).toBeNull();
  });

  it("gaugesToTable matches snapshotToTable shape", () => {
    const snap = sampleSnapshot();
    const a = gaugesToTable(snap.latest, snap.series, snap.timestamp);
    const b = snapshotToTable(snap);
    expect(a).toEqual(b);
  });
});

describe("seriesToTable", () => {
  it("flattens series to metric/t/v and uses latest when series empty", () => {
    const table = seriesToTable(sampleSnapshot());
    expect(table.columns).toEqual(["metric", "t", "v"]);
    const fpsRows = table.rows.filter((r) => r.metric === "fps");
    expect(fpsRows).toHaveLength(2);
    expect(fpsRows[1]?.v).toBe(60);
    const cls = table.rows.find((r) => r.metric === "cls");
    expect(cls).toEqual({ metric: "cls", t: 1_700_000_000_000, v: 0.05 });
  });
});

describe("resourcesToTable", () => {
  it("maps resource rows to columns", () => {
    const table = resourcesToTable([sampleResource()]);
    expect(table.columns).toContain("name");
    expect(table.columns).toContain("duration");
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]?.name).toBe("https://example.com/app.js");
    expect(table.rows[0]?.firstParty).toBe(true);
  });
});

describe("CSV serialization", () => {
  it("escapes quotes commas and newlines", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(12)).toBe("12");
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell("a\nb")).toBe('"a\nb"');
  });

  it("serializes header and rows", () => {
    const csv = tableToCsv({
      columns: ["metric", "latest"],
      rows: [
        { metric: "fps", latest: 60 },
        { metric: "note", latest: 'x,y' }
      ]
    });
    expect(csv).toBe('metric,latest\nfps,60\nnote,"x,y"');
  });

  it("tableToJson pretty-prints", () => {
    const json = tableToJson({ columns: ["a"], rows: [{ a: 1 }] });
    expect(json).toContain('"columns"');
    expect(json.endsWith("\n")).toBe(true);
  });
});

describe("downloadData", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a blob download in the browser", () => {
    const createObjectURL = vi.fn(() => "blob:pagepulse-test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click,
      remove
    } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);

    const table = snapshotToTable(sampleSnapshot());
    const ok = downloadData(table, { format: "csv", filename: "metrics.csv" });
    expect(ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe("metrics.csv");
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(createElement).toHaveBeenCalledWith("a");
    expect(appendChild).toHaveBeenCalled();
  });

  it("throws when CSV is requested for non-table data", () => {
    expect(() => downloadData({ foo: 1 }, { format: "csv" })).toThrow(/DataTable/);
  });

  it("downloads JSON for arbitrary payloads", () => {
    const createObjectURL = vi.fn(() => "blob:json");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click: vi.fn(),
      remove: vi.fn()
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
    expect(downloadData({ hello: "world" }, { format: "json" })).toBe(true);
    expect(anchor.download).toBe("pagepulse-data.json");
  });

  it("soft-fails when createObjectURL is missing", () => {
    vi.stubGlobal("URL", {});
    const table = snapshotToTable(sampleSnapshot());
    expect(downloadData(table, { format: "json" })).toBe(false);
  });

  it("returns false when click throws", () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:x"),
      revokeObjectURL: vi.fn()
    });
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click: () => {
        throw new Error("blocked");
      },
      remove: vi.fn()
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
    expect(downloadData({ a: 1 }, { format: "json" })).toBe(false);
  });
});
