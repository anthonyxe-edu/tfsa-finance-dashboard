"use client";
import { ArrowLeft } from "lucide-react";
import { useZoomNavigate } from "@/hooks/useZoomNavigate";

/**
 * Prominent back-to-home control. Collapses the current page back toward the
 * orb (reverse zoom), then lands on the home orbital hub.
 */
export function ZoomBack() {
  const zoomNavigate = useZoomNavigate();
  return (
    <button
      onClick={() => zoomNavigate("/", "out")}
      aria-label="Back to home orbs"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/45 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <ArrowLeft size={16} />
      Home
    </button>
  );
}
