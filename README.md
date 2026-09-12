# visualeyes

[![npm version](https://img.shields.io/npm/v/visualeyes.svg)](https://www.npmjs.com/package/visualeyes)
[![npm downloads](https://img.shields.io/npm/dm/visualeyes.svg)](https://www.npmjs.com/package/visualeyes)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-%233178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/github/license/Davidhanson90/visualeyes.svg)](LICENSE)
[![verify](https://github.com/Davidhanson90/visualeyes/actions/workflows/verify-main.yml/badge.svg)](https://github.com/Davidhanson90/visualeyes/actions/workflows/verify-main.yml)

`visualeyes` is an ESM TypeScript library for capturing browser performance metrics and rendering live Lit dashboard charts.

## Try the Demo

To run the harness locally:

```bash
npm install
npm start
```

Then open the local URL shown in your terminal (Vite default is usually `http://localhost:5173`).

## Features

- ESM package output with TypeScript declarations
- Tracker API for HTTP, long tasks, DOM, web vitals, memory, FPS, and resources
- Reusable `<visualeyes-dashboard>` and `<visualeyes-chart>` web components
- Dark / light / auto theming via a `theme` attribute and `--visualeyes-*` CSS variables
- Soft-failing collectors when browser APIs are unavailable

## Installation

```bash
npm install visualeyes
```

## Usage

### 1. Import the library

```ts
import { createTracker } from "visualeyes";
```

Importing `visualeyes` registers the Lit custom elements.

### 2. Create and start a tracker

```ts
const tracker = createTracker({
  sampleIntervalMs: 1000,
  retentionMs: 5 * 60 * 1000,
  collectors: {
    http: true,
    longTasks: true,
    dom: true,
    webVitals: true,
    memory: true,
    fps: true
  }
});

tracker.start();
tracker.subscribe((snapshot) => {
  console.log(snapshot.latest);
});
```

### 3. Render the dashboard

```html
<visualeyes-dashboard id="dash" theme="dark"></visualeyes-dashboard>
```

`theme` accepts `dark` (default), `light`, or `auto` (follow `prefers-color-scheme`).

```ts
const dash = document.getElementById("dash");
if (dash) {
  dash.tracker = tracker;
}
```

If you do not set `.tracker`, the dashboard uses the default tracker from the latest `createTracker()` call.

### 4. Stop tracking

```ts
tracker.stop();
```


## Theming

Both `<visualeyes-dashboard>` and `<visualeyes-chart>` accept a reflected `theme` attribute/property:

| Value | Result |
| --- | --- |
| unset / `dark` | Dark palette (original 0.1.0 look) |
| `light` | Full light palette |
| `auto` | Light palette when `@media (prefers-color-scheme: light)` matches, otherwise dark |

```html
<visualeyes-dashboard theme="light"></visualeyes-dashboard>
<visualeyes-chart theme="auto"></visualeyes-chart>
```

```ts
const dash = document.querySelector("visualeyes-dashboard");
if (dash) dash.theme = "auto";
```

The dashboard forwards `theme` to each nested chart so canvas colors stay in sync. Canvas drawing reads computed CSS variables via `getComputedStyle` (background, grid, empty-state text, and the default series color when `color` is unset).

Tokens live on `:host` and can be overridden per instance:

```html
<visualeyes-dashboard
  theme="light"
  style="--visualeyes-accent: #c026d3; --visualeyes-bg: #faf6ff;">
</visualeyes-dashboard>
```

| Variable | Role | Dark default | Light default |
| --- | --- | --- | --- |
| `--visualeyes-bg` | Host background | `#0b1220` | `#f3f5f8` |
| `--visualeyes-text` | Primary text | `#e8eef7` | `#1a2433` |
| `--visualeyes-muted` | Secondary text | `#8b9bb0` | `#5c6d82` |
| `--visualeyes-title` | Panel titles | `#9fb3c8` | `#3d5270` |
| `--visualeyes-panel-bg` | Panel surface | `#121a2b` | `#ffffff` |
| `--visualeyes-panel-border` | Panel border | `#243149` | `#d3dce8` |
| `--visualeyes-chart-bg` | Chart / canvas background | `#0d1524` | `#e8eef6` |
| `--visualeyes-grid` | Chart grid lines | `#1c2940` | `#c9d4e4` |
| `--visualeyes-status` | Header status text | `#9fb3c8` | `#5c6d82` |
| `--visualeyes-empty` | Empty-chart label | `#4a5a70` | `#7a8b9e` |
| `--visualeyes-accent` | Default series color | `#5b9cff` | `#2563eb` |

The local harness (`npm start`) has a Dark / Light / Auto theme toggle that sets `theme` on the dashboard.

## Metrics

- `httpInFlight` — fetch / XHR wrappers
- `requestSize` — Resource Timing transfer/encoded size
- `longTaskDuration` — PerformanceObserver longtask
- `domNodeCount` / `domMaxDepth` — periodic DOM walk
- `lcp` / `cls` / `inp` / `ttfb` — web vitals
- `jsHeapUsed` / `jsHeapLimit` — `performance.memory` when present
- `fps` — requestAnimationFrame
- `resourceScript` / `resourceCss` / `resourceImg` / `resourceFetch` — resource counts

## Scripts

- `npm run build` - compile library to `dist/`
- `npm run test` - run Vitest tests
- `npm run test:coverage` - run tests with coverage reports in `coverage/`
- `npm run build:verify` - run coverage, lint, harness build, and typecheck
- `npm run pack:check` - show package contents using `npm pack --dry-run`

## Development

```bash
npm install
npm start
```

## License

MIT
