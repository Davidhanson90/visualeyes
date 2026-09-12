/** Supported values for the `theme` attribute on visualeyes components. */
export type VisualeyesTheme = "dark" | "light" | "auto";

/** CSS custom properties used by dashboard, chart, and canvas drawing. */
export const THEME_VARS = {
  bg: "--visualeyes-bg",
  text: "--visualeyes-text",
  muted: "--visualeyes-muted",
  title: "--visualeyes-title",
  panelBg: "--visualeyes-panel-bg",
  panelBorder: "--visualeyes-panel-border",
  chartBg: "--visualeyes-chart-bg",
  grid: "--visualeyes-grid",
  status: "--visualeyes-status",
  empty: "--visualeyes-empty",
  accent: "--visualeyes-accent"
} as const;

export function readThemeColor(el: Element, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}
