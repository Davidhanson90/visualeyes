import { createTracker, type VisualeyesTracker } from "../dist/index.js";

const tracker = createTracker({
  sampleIntervalMs: 1000,
  retentionMs: 5 * 60 * 1000,
  firstPartyDomains: [],
  maxResourceEntries: 150,
  collectors: {
    http: true,
    longTasks: true,
    dom: true,
    webVitals: true,
    memory: true,
    fps: true,
    loaf: true,
    connection: true,
    navigation: true,
    errors: true,
    resources: true
  }
});

const dash = document.getElementById("dash") as (HTMLElement & { tracker?: VisualeyesTracker }) | null;
if (dash) dash.tracker = tracker;

tracker.start();

document.getElementById("btn-start")?.addEventListener("click", () => tracker.start());
document.getElementById("btn-stop")?.addEventListener("click", () => tracker.stop());

document.getElementById("btn-fetch")?.addEventListener("click", async () => {
  const urls = [
    "https://httpbin.org/bytes/1024",
    "https://httpbin.org/bytes/2048",
    "https://httpbin.org/bytes/4096",
    "https://httpbin.org/delay/1",
    "https://httpbin.org/json"
  ];
  await Promise.allSettled(urls.map((u) => fetch(u, { mode: "cors" }).catch(() => null)));
});

document.getElementById("btn-block")?.addEventListener("click", () => {
  const end = performance.now() + 200;
  while (performance.now() < end) {
    // busy wait to create a long task / jank
  }
});

document.getElementById("btn-dom")?.addEventListener("click", () => {
  const noise = document.getElementById("noise");
  if (!noise) return;
  for (let i = 0; i < 200; i++) {
    const el = document.createElement("span");
    el.textContent = "·";
    noise.appendChild(el);
  }
});

document.getElementById("btn-soft-nav")?.addEventListener("click", () => {
  const next = `#soft-${Date.now()}`;
  history.pushState({ visualeyes: true }, "", next);
});

document.getElementById("btn-error")?.addEventListener("click", () => {
  // Fire a caught-by-window error without breaking the harness page.
  setTimeout(() => {
    throw new Error("visualeyes harness deliberate error");
  }, 0);
});

document.getElementById("btn-reject")?.addEventListener("click", () => {
  void Promise.reject(new Error("visualeyes harness deliberate rejection"));
});

const themeSelect = document.getElementById("theme-select") as HTMLSelectElement | null;
const applyTheme = (theme: string): void => {
  dash?.setAttribute("theme", theme);
  document.documentElement.dataset.theme = theme;
};
themeSelect?.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});
applyTheme(themeSelect?.value ?? "dark");

// gentle background load so charts move
setInterval(() => {
  void fetch("data:text/plain,ping").catch(() => undefined);
}, 3000);
