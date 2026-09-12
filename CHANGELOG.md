# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0

### Added

- Initial release of `visualeyes`, an ESM TypeScript library for browser performance tracking.
- `createTracker` / `VisualeyesTracker` API with collectors for HTTP, long tasks, DOM complexity, web vitals, memory, FPS, and resource counts.
- Lit web components `<visualeyes-dashboard>` and `<visualeyes-chart>` registered on package import.
- Local Vite harness under `harness/` for interactive demos.
