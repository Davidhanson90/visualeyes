import { css } from 'lit';

export const dashboardStyles = css`
  :host {
    display: block;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    color: #e8eef7;
    background: #0b1220;
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
    opacity: 0.75;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .panel {
    background: #121a2b;
    border: 1px solid #243149;
    border-radius: 10px;
    padding: 10px 12px 8px;
  }
  .panel h2 {
    margin: 0 0 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #9fb3c8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .value {
    font-size: 1.25rem;
    font-weight: 650;
    margin-bottom: 6px;
  }
  .muted { opacity: 0.55; font-size: 0.75rem; }
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
    background: #0d1524;
  }
`;
