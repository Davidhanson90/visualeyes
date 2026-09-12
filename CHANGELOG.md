# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- Theming for `<visualeyes-dashboard>` and `<visualeyes-chart>` via a reflected `theme` attribute (`dark`, `light`, `auto`).
- `--visualeyes-*` CSS custom properties on `:host` (background, text, muted, title, panel, chart, grid, status, empty, accent) with a dark default matching 0.1.0 and a full light palette.
- Chart canvas colors (background, grid, empty text, default series) read from computed CSS variables.
- Harness theme toggle (dark / light / auto).
- README theme previews (dark / light screenshots) and step-by-step enable instructions (attribute, JS property, harness).

## 0.1.0

### Added

- Initial release of `visualeyes`, an ESM TypeScript library for browser performance tracking.
- `createTracker` / `VisualeyesTracker` API with collectors for HTTP, long tasks, DOM complexity, web vitals, memory, FPS, and resource counts.
- Lit web components `<visualeyes-dashboard>` and `<visualeyes-chart>` registered on package import.
- Local Vite harness under `harness/` for interactive demos.
