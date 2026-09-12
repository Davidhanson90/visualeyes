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
<visualeyes-dashboard id="dash"></visualeyes-dashboard>
```

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
