"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Prominent back-to-home control. Reverses the page zoom (shrinks + fades the
 * current page content) then navigates home, where the orbital hub zooms back in.
 */
export function ZoomBack() {
  const router = useRouter();

  const back = () => {
    const el = document.querySelector(".page-zoom") as HTMLElement | null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el && !reduced) {
      el.style.animation = "none";
      el.style.transition =
        "transform 260ms ease-in, opacity 260ms ease-in";
      el.style.transformOrigin = "center 38%";
      requestAnimationFrame(() => {
        el.style.transform = "scale(0.92)";
        el.style.opacity = "0";
      });
      window.setTimeout(() => router.push("/"), 250);
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={back}
      aria-label="Back to home orbs"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/45 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <ArrowLeft size={16} />
      Home
    </button>
  );
}
