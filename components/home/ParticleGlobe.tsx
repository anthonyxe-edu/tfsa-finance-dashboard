"use client";
import { useEffect, useRef } from "react";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Evenly distribute N points on a unit sphere (Fibonacci spiral). */
function makePoints(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = phi * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return pts;
}

/**
 * Cheap smooth pseudo-noise (sum of orthogonal sin·cos waves), continuous in
 * x/y/z/time. Returns ~[-1, 1]. No noise lib needed — keeps the orb dependency-free.
 */
function flow(x: number, y: number, z: number, t: number): number {
  return (
    (Math.sin(x * 1.7 + t * 0.9) * Math.cos(y * 1.3 - t * 0.7) +
      Math.sin(y * 2.1 - t * 0.6) * Math.cos(z * 1.9 + t * 0.8) +
      Math.sin(z * 1.5 + t * 1.1) * Math.cos(x * 2.3 - t * 0.5)) /
    3
  );
}

/**
 * "Anomalous matter" energy orb rendered on canvas. A point cloud whose surface
 * warps and breathes against a flowing noise field, with rippling bright energy
 * streaks, white-hot flares, and a glowing core haze — a turbulent neon plasma
 * mass rather than a rigid globe. Depth-sorted + additive blend for bloom.
 * `intensity` (0–1) raises brightness, turbulence and core glow; `color` is hex.
 */
export function ParticleGlobe({
  color,
  intensity = 0.5,
  sphereScale = 0.62,
  count = 1050,
}: {
  color: string;
  intensity?: number;
  sphereScale?: number;
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [r, g, b] = hexToRgb(color);
    const points = makePoints(count);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let raf = 0;

    const resize = () => {
      const s = wrap.clientWidth;
      W = s;
      canvas.width = Math.round(s * dpr);
      canvas.height = Math.round(s * dpr);
      canvas.style.width = `${s}px`;
      canvas.style.height = `${s}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const frontBoost = 0.45 + intensity * 0.55;
    const turb = 0.13 + intensity * 0.08; // radial displacement amplitude

    const draw = (a: number, t: number) => {
      if (W === 0) return;
      ctx.clearRect(0, 0, W, W);
      ctx.globalCompositeOperation = "lighter";
      const cx = W / 2;
      const cy = W / 2;
      const R = (W / 2) * sphereScale;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Tumbling tilt so the mass never reads as a rigid sphere.
      const tilt = 0.42 + 0.1 * Math.sin(t * 0.5);
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);

      // Core glow haze behind the particles, gently pulsing.
      const coreA = (0.05 + intensity * 0.11) * (0.82 + 0.18 * Math.sin(t * 1.2));
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
      grad.addColorStop(0, `rgba(${r},${g},${b},${coreA})`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},${coreA * 0.4})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, W);

      const projected = points.map(([x, y, z]) => {
        // Warp the surface in/out along its radius with the flow field.
        const d = 1 + turb * flow(x * 1.6, y * 1.6, z * 1.6, t * 0.6);
        const px = x * d;
        const py = y * d;
        const pz = z * d;
        // Spin around Y, then apply the tumbling tilt.
        const x1 = px * ca + pz * sa;
        const z1 = -px * sa + pz * ca;
        const y2 = py * ct - z1 * st;
        const z2 = py * st + z1 * ct;
        // Independent brightness field → rippling hot energy streaks.
        const bn = (flow(x * 2.4 + 5, y * 2.4 - 3, z * 2.4 + 7, t * 0.8) + 1) / 2;
        return { sx: cx + x1 * R, sy: cy + y2 * R, depth: (z2 + 1) / 2, bn };
      });
      projected.sort((p, q) => p.depth - q.depth); // back to front

      for (const p of projected) {
        const streak = p.bn * p.bn; // emphasise the bright streaks
        const rad = (0.5 + 1.5 * p.depth) * (0.7 + 0.7 * streak);
        const op = (0.06 + 0.9 * p.depth) * frontBoost * (0.35 + 0.8 * streak);
        // Hottest points flare toward white for a plasma core feel.
        const hot = streak * streak * streak * (0.5 + 0.4 * intensity);
        const rr = Math.round(r + (255 - r) * hot);
        const gg = Math.round(g + (255 - g) * hot);
        const bb = Math.round(b + (255 - b) * hot);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${op})`;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    if (reduced) {
      draw(0.6, 0);
      return () => ro.disconnect();
    }

    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      draw(t * 0.24, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, intensity, sphereScale, count]);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
