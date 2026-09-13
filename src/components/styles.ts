import { css } from 'lit';

/**
 * Dark tokens match the original 0.1.0 look. Light tokens apply for
 * `theme="light"` and, when the OS prefers light, `theme="auto"`.
 */
const lightTokens = css`
  --pagepulse-bg: #f3f5f8;
  --pagepulse-text: #1a2433;
  --pagepulse-muted: #5c6d82;
  --pagepulse-title: #3d5270;
  --pagepulse-panel-bg: #ffffff;
  --pagepulse-panel-border: #d3dce8;
  --pagepulse-chart-bg: #e8eef6;
  --pagepulse-grid: #c9d4e4;
  --pagepulse-status: #5c6d82;
  --pagepulse-empty: #7a8b9e;
  --pagepulse-accent: #2563eb;
`;

export const themeStyles = css`
  :host {
    --pagepulse-bg: #0b1220;
    --pagepulse-text: #e8eef7;
    --pagepulse-muted: #8b9bb0;
    --pagepulse-title: #9fb3c8;
    --pagepulse-panel-bg: #121a2b;
    --pagepulse-panel-border: #243149;
    --pagepulse-chart-bg: #0d1524;
    --pagepulse-grid: #1c2940;
    --pagepulse-status: #9fb3c8;
    --pagepulse-empty: #4a5a70;
    --pagepulse-accent: #5b9cff;
  }

  :host([theme="light"]) {
    ${lightTokens}
  }

  @media (prefers-color-scheme: light) {
    :host([theme="auto"]) {
      ${lightTokens}
    }
  }
`;

export const dashboardStyles = css`
  :host {
    display: block;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    color: var(--pagepulse-text);
    background: var(--pagepulse-bg);
    border-radius: 12px;
    padding: 16px;
    box-sizing: border-box;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  h1 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 650;
    letter-spacing: 0.02em;
  }
  .status {
    font-size: 0.8rem;
    color: var(--pagepulse-status);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .panel {
    background: var(--pagepulse-panel-bg);
    border: 1px solid var(--pagepulse-panel-border);
    border-radius: 10px;
    padding: 10px 12px 8px;
  }
  .panel h2.metric-title {
    margin: 0 0 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--pagepulse-title, #9fb3c8);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    width: fit-content;
    max-width: 100%;
    cursor: help;
    border-bottom: 1px dotted color-mix(in srgb, var(--pagepulse-title, #9fb3c8) 55%, transparent);
    position: relative;
  }
  .panel h2.metric-title:hover::after,
  .panel h2.metric-title:focus-visible::after {
    content: attr(data-tip);
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    z-index: 5;
    min-width: 180px;
    max-width: min(280px, 70vw);
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--pagepulse-panel-bg, #121a2b);
    color: var(--pagepulse-text, #e8eef7);
    border: 1px solid var(--pagepulse-panel-border, #243149);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    line-height: 1.35;
    white-space: normal;
    pointer-events: none;
  }
  .value {
    font-size: 1.25rem;
    font-weight: 650;
    margin-bottom: 6px;
  }
  .muted { color: var(--pagepulse-muted); font-size: 0.75rem; }
  .waterfall {
    margin-top: 12px;
  }
`;

export const chartStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  canvas {
    width: 100%;
    height: 120px;
    display: block;
    border-radius: 6px;
    background: var(--pagepulse-chart-bg);
  }
`;
