import { LitElement, html } from "lit";
import type { MetricPoint } from "../core/types.js";
import { chartStyles } from "./styles.js";

export class VisualeyesChart extends LitElement {
  static properties = {
    data: { attribute: false },
    color: { type: String },
    height: { type: Number }
  };

  declare data: MetricPoint[];
  declare color: string;
  declare height: number;

  static styles = chartStyles;

  constructor() {
    super();
    this.data = [];
    this.color = "#5b9cff";
    this.height = 120;
  }

  protected updated(): void {
    this.draw();
  }

  private draw(): void {
    const canvas = this.renderRoot.querySelector("canvas");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 260;
    const height = this.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pts = this.data;
    if (!pts.length) {
      ctx.fillStyle = "#4a5a70";
      ctx.font = "12px sans-serif";
      ctx.fillText("No data yet", 10, height / 2);
      return;
    }

    const pad = 6;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const values = pts.map((p) => p.v);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const t0 = pts[0]!.t;
    const t1 = pts[pts.length - 1]!.t;
    const span = Math.max(1, t1 - t0);

    // grid
    ctx.strokeStyle = "#1c2940";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = pad + (h * i) / 2;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + w, y);
      ctx.stroke();
    }

    // area fill
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = pad + ((p.t - t0) / span) * w;
      const y = pad + h - ((p.v - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const last = pts[pts.length - 1]!;
    const first = pts[0]!;
    ctx.lineTo(pad + ((last.t - t0) / span) * w, pad + h);
    ctx.lineTo(pad + ((first.t - t0) / span) * w, pad + h);
    ctx.closePath();
    ctx.fillStyle = this.color + "33";
    ctx.fill();

    // line
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = pad + ((p.t - t0) / span) * w;
      const y = pad + h - ((p.v - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  render() {
    return html`<canvas style="height: ${this.height}px"></canvas>`;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("visualeyes-chart")) {
  customElements.define("visualeyes-chart", VisualeyesChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "visualeyes-chart": VisualeyesChart;
  }
}
