# AGENTS

This repository supports human contributors and coding agents.

## Scope

- Source code: `src/`
- Harness/demo: `harness/`
- Build output: `dist/` (generated)

## Rules

1. Do not edit `dist/` directly.
2. Keep the package ESM-compatible.
3. Preserve `visualeyes-dashboard` and `visualeyes-chart` component selectors unless intentionally changing API.
4. Prefer additive, backward-compatible API changes.
5. Run `npm run build:verify` before proposing completion.

## Packaging Notes

- Package contents are controlled by `package.json` `files` and `.npmignore`.
- Run `npm run pack:check` to verify what will be published.

## Coverage Notes

- Vitest coverage uses 90% per-file thresholds on included sources.
- Browser-only collectors (`src/collectors/**`) and Lit components (`src/components/**`) are excluded from coverage thresholds, matching heatspot's exclusion of hard-to-unit-test modules (e.g. contracts). Prefer thorough unit tests for `src/core/**`.
