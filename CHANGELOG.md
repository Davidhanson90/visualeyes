# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- **Resource waterfall** — rolling Resource Timing buffer (`getResources` / `subscribeResources` / `clearResources`), `<visualeyes-waterfall>` Lit panel (timeline bars, initiator + 1p/3p + cached legend), embedded under the dashboard grid
- Tracker options `firstPartyDomains`, `maxResourceEntries`; collector flag `collectors.resources` (default on)
- v0.2 collectors (default on, soft-fail when APIs are missing):
  - **LoAF** — `loafDuration`, `loafScriptDuration`, `loafStyleDuration` via `long-animation-frame`
  - **Connection** — `connectionRtt`, `connectionDownlink`, `connectionEffectiveType` from `navigator.connection`
  - **Navigation** — `navDomContentLoaded`, `navLoad`, `softNavCount`, `softNavDuration` (Navigation Timing + soft-nav / history hooks)
  - **Errors** — `errorCount`, `rejectionCount` from `window` `error` / `unhandledrejection`
- Tracker `collectors` flags: `loaf`, `connection`, `navigation`, `errors`
- Dashboard panels for LoAF, connection, navigation, soft-nav, and error metrics
- Harness controls: soft navigation, throw error, unhandled rejection
- Theming for `<visualeyes-dashboard>` and `<visualeyes-chart>` via a reflected `theme` attribute (`dark`, `light`, `auto`).
- `--visualeyes-*` CSS custom properties on `:host` (background, text, muted, title, panel, chart, grid, status, empty, accent) with a dark default matching 0.1.0 and a full light palette.
- Chart canvas colors (background, grid, empty text, default series) read from computed CSS variables.
- Harness theme toggle (dark / light / auto).
- README theme previews (dark / light screenshots) and step-by-step enable instructions (attribute, JS property, harness).

## 0.2.0

### Added

- Same collector set as documented under Unreleased (LoAF, connection, navigation, errors) when this version is published.

## 0.1.0

### Added

- Initial release of `visualeyes`, an ESM TypeScript library for browser performance tracking.
- `createTracker` / `VisualeyesTracker` API with collectors for HTTP, long tasks, DOM complexity, web vitals, memory, FPS, and resource counts.
- Lit web components `<visualeyes-dashboard>` and `<visualeyes-chart>` registered on package import.
- Local Vite harness under `harness/` for interactive demos.
