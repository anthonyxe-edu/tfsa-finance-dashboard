"use client";
import { useRouter } from "next/navigation";

/**
 * Navigate with a zoom that reads as diving INTO the orb (mode "in": the current
 * page scales up from the orb's position and fades, then the next page zooms in)
 * or collapsing back into it (mode "out": the page shrinks toward center). Falls
 * back to a plain push under prefers-reduced-motion.
 */
export function useZoomNavigate() {
  const router = useRouter();

  return (href: string, mode: "in" | "out" = "in") => {
    const el = document.querySelector(".page-zoom") as HTMLElement | null;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!el || reduced) {
      router.push(href);
      return;
    }

    el.style.animation = "none";
    el.style.transformOrigin = "center 40%";
    el.style.willChange = "transform, opacity";
    el.style.transition =
      "transform 300ms cubic-bezier(0.6, 0, 0.9, 0.2), opacity 280ms ease-in";
    requestAnimationFrame(() => {
      el.style.transform = mode === "in" ? "scale(3)" : "scale(0.2)";
      el.style.opacity = "0";
    });
    window.setTimeout(() => router.push(href), 285);
  };
}
