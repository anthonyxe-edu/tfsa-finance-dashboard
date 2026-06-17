"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Load-in animation: lime "matter" streaks in from all around the screen and
 * fuses into a rotating point-cloud orb with a fusion bloom, then the whole
 * screen zooms into the orb and clears to reveal the live app. Canvas-only.
 * Shows once per session (sessionStorage); skipped under reduced-motion.
 */
export function BootSplash() {
  const [phase, setPhase] = useState<"run" | "out" | "done">("run");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("booted")) {
      setPhase("done");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("booted", "1");
      setPhase("done");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Sphere targets (Fibonacci) + scattered off-center starts ("from all around").
    const N = 170;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const R = Math.min(W, H) * 0.17;
    const parts = Array.from({ length: N }, (_, i) => {
      const uy = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - uy * uy);
      const th = phi * i;
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.max(W, H) * (0.55 + Math.random() * 0.6);
      return {
        ux: Math.cos(th) * r,
        uy,
        uz: Math.sin(th) * r,
        sx: W / 2 + Math.cos(ang) * rad,
        sy: H / 2 + Math.sin(ang) * rad,
      };
    });

    const lime = "157,255,60";
    const DUR = 1350;
    const start = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DUR);
      const e = ease(t);
      const cx = W / 2;
      const cy = H / 2;
      const rot = now * 0.0007;
      const ca = Math.cos(rot);
      const sa = Math.sin(rot);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Fusion bloom grows as the matter coalesces.
      const bloom = Math.max(0, (t - 0.5) / 0.5);
      if (bloom > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (1.1 + bloom * 1.4));
        g.addColorStop(0, `rgba(${lime},${0.28 * bloom})`);
        g.addColorStop(0.5, `rgba(${lime},${0.1 * bloom})`);
        g.addColorStop(1, `rgba(${lime},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      const drawn = parts
        .map((p) => {
          const x1 = p.ux * ca + p.uz * sa;
          const z1 = -p.ux * sa + p.uz * ca;
          const tx = cx + x1 * R;
          const ty = cy + p.uy * R;
          const x = p.sx + (tx - p.sx) * e;
          const y = p.sy + (ty - p.sy) * e;
          return { x, y, tx, ty, sx: p.sx, sy: p.sy, depth: (z1 + 1) / 2 };
        })
        .sort((a, b) => a.depth - b.depth);

      for (const p of drawn) {
        // Incoming streak: a faint tail trailing back toward where it came from.
        if (e < 0.98) {
          const dx = p.tx - p.sx;
          const dy = p.ty - p.sy;
          const len = Math.hypot(dx, dy) || 1;
          const tail = 16 * (1 - e);
          ctx.strokeStyle = `rgba(${lime},${0.18 * (1 - e)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - (dx / len) * tail, p.y - (dy / len) * tail);
          ctx.stroke();
        }
        const rad = 0.6 + 1.7 * p.depth;
        const op = (0.12 + 0.88 * p.depth) * (0.35 + 0.65 * e);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lime},${op})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const t1 = setTimeout(() => setPhase("out"), 1650);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("booted", "1");
      setPhase("done");
    }, 2250);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`boot-splash${phase === "out" ? " boot-out" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="boot-canvas" />
      <div className="boot-title font-title">Finance</div>
    </div>
  );
}
