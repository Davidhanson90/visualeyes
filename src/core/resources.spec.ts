import { describe, it, expect } from "vitest";
import {
  isFirstParty,
  isCachedResource,
  rowFromPerformanceEntry,
  ResourceStore
} from "./resources.js";

describe("isFirstParty", () => {
  it("matches page host and subdomains", () => {
    expect(isFirstParty("https://example.com/a.js", [], "example.com")).toBe(true);
    expect(isFirstParty("https://cdn.example.com/a.js", [], "example.com")).toBe(true);
    expect(isFirstParty("https://other.com/a.js", [], "example.com")).toBe(false);
  });

  it("matches allow-listed firstPartyDomains", () => {
    expect(
      isFirstParty("https://static.cdn.net/x.js", ["cdn.net"], "app.example.com")
    ).toBe(true);
    expect(
      isFirstParty("https://evil.com/x.js", ["cdn.net"], "app.example.com")
    ).toBe(false);
  });

  it("treats unparseable URLs as first-party", () => {
    expect(isFirstParty("http://[", [], "example.com")).toBe(true);
  });

  it("matches empty pageHost via domain list and ignores empty allow-list entries", () => {
    expect(isFirstParty("https://cdn.net/x.js", [""], "app.example.com")).toBe(false);
    expect(isFirstParty("https://cdn.net/x.js", ["cdn.net"], "")).toBe(true);
  });

  it("treats empty hostname as first-party", () => {
    expect(isFirstParty("blob:http://localhost/abc-def", [], "example.com")).toBe(true);
  });

  it("defaults pageHost from location when omitted", () => {
    const host = typeof location !== "undefined" ? location.hostname : "localhost";
    expect(isFirstParty(`https://${host}/local.js`)).toBe(true);
    expect(isFirstParty("https://totally-other-party.test/x.js")).toBe(false);
  });
});

describe("isCachedResource", () => {
  it("detects cache hit when transferSize is 0 with body size", () => {
    expect(
      isCachedResource({ transferSize: 0, encodedBodySize: 1200, decodedBodySize: 0 })
    ).toBe(true);
    expect(
      isCachedResource({ transferSize: 0, encodedBodySize: 0, decodedBodySize: 800 })
    ).toBe(true);
  });

  it("is false when bytes were transferred or sizes unknown", () => {
    expect(
      isCachedResource({ transferSize: 400, encodedBodySize: 400, decodedBodySize: 400 })
    ).toBe(false);
    expect(
      isCachedResource({ transferSize: 0, encodedBodySize: 0, decodedBodySize: 0 })
    ).toBe(false);
  });
});

describe("rowFromPerformanceEntry", () => {
  it("falls back when responseEnd/sizes/initiator missing", () => {
    const entry = {
      name: "https://cdn.example/x",
      initiatorType: "",
      startTime: 100,
      responseEnd: 50,
      duration: 12,
      transferSize: 0,
      encodedBodySize: 0,
      decodedBodySize: 0
    } as PerformanceResourceTiming;
    const row = rowFromPerformanceEntry(entry, ["cdn.example"]);
    expect(row.responseEnd).toBe(112);
    expect(row.duration).toBe(12);
    expect(row.initiatorType).toBe("other");
    expect(row.transferSize).toBe(0);
    expect(row.cached).toBe(false);
  });

  it("maps PerformanceResourceTiming fields", () => {
    const entry = {
      name: "https://example.com/app.js",
      initiatorType: "script",
      startTime: 10,
      responseEnd: 40,
      duration: 30,
      transferSize: 0,
      encodedBodySize: 1000,
      decodedBodySize: 2000
    } as PerformanceResourceTiming;

    const row = rowFromPerformanceEntry(entry, ["example.com"], 1_700_000_000_000);
    expect(row.name).toBe(entry.name);
    expect(row.initiatorType).toBe("script");
    expect(row.startTime).toBe(10);
    expect(row.responseEnd).toBe(40);
    expect(row.duration).toBe(30);
    expect(row.cached).toBe(true);
    expect(row.firstParty).toBe(true);
    expect(row.recordedAt).toBe(1_700_000_000_000);
    expect(row.id).toBeTruthy();
  });
});

describe("ResourceStore", () => {
  it("prunes by maxEntries (FIFO)", () => {
    const store = new ResourceStore({ maxEntries: 3, retentionMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      store.add({
        id: String(i),
        name: `/r${i}`,
        initiatorType: "fetch",
        startTime: i,
        responseEnd: i + 1,
        duration: 1,
        transferSize: 1,
        encodedBodySize: 1,
        decodedBodySize: 1,
        firstParty: true,
        cached: false,
        recordedAt: Date.now()
      });
    }
    const rows = store.getResources();
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.id)).toEqual(["2", "3", "4"]);
  });

  it("prunes by retentionMs", () => {
    const store = new ResourceStore({ maxEntries: 100, retentionMs: 1000 });
    store.add({
      id: "old",
      name: "/old",
      initiatorType: "fetch",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: true,
      cached: false,
      recordedAt: Date.now() - 5000
    });
    store.add({
      id: "new",
      name: "/new",
      initiatorType: "fetch",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: true,
      cached: false,
      recordedAt: Date.now()
    });
    expect(store.getResources().map((r) => r.id)).toEqual(["new"]);
  });

  it("subscribe / clear / setOptions notify listeners", () => {
    const store = new ResourceStore({ maxEntries: 10 });
    const seen: number[] = [];
    const unsub = store.subscribe((rows) => seen.push(rows.length));
    store.add({
      id: "a",
      name: "/a",
      initiatorType: "css",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 0,
      encodedBodySize: 10,
      decodedBodySize: 10,
      firstParty: true,
      cached: true,
      recordedAt: Date.now()
    });
    expect(seen.at(-1)).toBe(1);
    store.clear();
    expect(seen.at(-1)).toBe(0);
    store.clear();
    store.setOptions({ maxEntries: 1, retentionMs: 60_000 });
    unsub();
    store.add({
      id: "b",
      name: "/b",
      initiatorType: "img",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: false,
      cached: false,
      recordedAt: Date.now()
    });
    expect(store.getResources()).toHaveLength(1);
  });

  it("setOptions updates maxEntries and retention independently", () => {
    const store = new ResourceStore({ maxEntries: 10, retentionMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      store.add({
        id: String(i),
        name: `/r${i}`,
        initiatorType: "fetch",
        startTime: i,
        responseEnd: i + 1,
        duration: 1,
        transferSize: 1,
        encodedBodySize: 1,
        decodedBodySize: 1,
        firstParty: true,
        cached: false,
        recordedAt: Date.now()
      });
    }
    store.setOptions({ maxEntries: 2 });
    expect(store.getResources()).toHaveLength(2);
    store.setOptions({ retentionMs: 1 });
    // recordedAt is "now" so retention 1ms may or may not prune; force old via add
    store.add({
      id: "ancient",
      name: "/ancient",
      initiatorType: "fetch",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: true,
      cached: false,
      recordedAt: Date.now() - 10_000
    });
    store.setOptions({ retentionMs: 100 });
    expect(store.getResources().every((r) => r.id !== "ancient" || r.recordedAt >= Date.now() - 100)).toBe(true);
  });

  it("prune with huge retention skips time filter", () => {
    const store = new ResourceStore({ maxEntries: 10, retentionMs: Number.MAX_SAFE_INTEGER });
    store.add({
      id: "keep",
      name: "/k",
      initiatorType: "fetch",
      startTime: 0,
      responseEnd: 1,
      duration: 1,
      transferSize: 1,
      encodedBodySize: 1,
      decodedBodySize: 1,
      firstParty: true,
      cached: false,
      recordedAt: 1
    });
    expect(store.getResources()).toHaveLength(1);
  });

  it("swallows listener errors", () => {
    const store = new ResourceStore();
    store.subscribe(() => {
      throw new Error("boom");
    });
    expect(() =>
      store.add({
        id: "x",
        name: "/x",
        initiatorType: "other",
        startTime: 0,
        responseEnd: 1,
        duration: 1,
        transferSize: 0,
        encodedBodySize: 0,
        decodedBodySize: 0,
        firstParty: true,
        cached: false,
        recordedAt: Date.now()
      })
    ).not.toThrow();
  });
});
