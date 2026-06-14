"use client";

/**
 * Re-mounts on every navigation, so its zoom-in animation plays on each page
 * change — making navigation a cohesive zoom rather than a flash. The back
 * button (ZoomBack) reverses it. Disabled under prefers-reduced-motion (handled
 * globally in globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-zoom">{children}</div>;
}
