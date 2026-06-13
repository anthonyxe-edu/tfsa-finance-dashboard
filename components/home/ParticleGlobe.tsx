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
 * A rotating point-cloud sphere rendered on canvas — the "globe" shape with no
 * world map. Front-facing dots are brighter (depth-sorted, additive blend) for a
 * neon bloom. `intensity` (0–1) brightens the cloud; `color` is a hex string.
 */
export function ParticleGlobe({
  color,
  intensity = 0.5,
  sphereScale = 0.62,
  count = 820,
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
    const tilt = 0.42;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
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

    const draw = (a: number) => {
      if (W === 0) return;
      ctx.clearRect(0, 0, W, W);
      ctx.globalCompositeOperation = "lighter";
      const cx = W / 2;
      const cy = W / 2;
      const R = (W / 2) * sphereScale;
      const ca = Math.cos(a);
      const sa = Math.sin(a);

      const projected = points.map(([x, y, z]) => {
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        return { sx: cx + x1 * R, sy: cy + y2 * R, t: (z2 + 1) / 2 };
      });
      projected.sort((p, q) => p.t - q.t); // back to front

      for (const p of projected) {
        const rad = 0.5 + 1.5 * p.t;
        const op = (0.08 + 0.92 * p.t) * frontBoost;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    if (reduced) {
      draw(0.6);
      return () => ro.disconnect();
    }

    const start = performance.now();
    const loop = (now: number) => {
      draw(((now - start) / 1000) * 0.24);
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
