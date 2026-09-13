/** Supported values for the `theme` attribute on pagepulse components. */
export type PagepulseTheme = "dark" | "light" | "auto";

/** CSS custom properties used by dashboard, chart, and canvas drawing. */
export const THEME_VARS = {
  bg: "--pagepulse-bg",
  text: "--pagepulse-text",
  muted: "--pagepulse-muted",
  title: "--pagepulse-title",
  panelBg: "--pagepulse-panel-bg",
  panelBorder: "--pagepulse-panel-border",
  chartBg: "--pagepulse-chart-bg",
  grid: "--pagepulse-grid",
  status: "--pagepulse-status",
  empty: "--pagepulse-empty",
  accent: "--pagepulse-accent"
} as const;

export function readThemeColor(el: Element, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}
