"use client";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A touch-first swipeable stacked card deck. The front card follows the finger
 * (pointer events → works for touch and mouse); swiping past a threshold sends
 * it to the back and reveals the next. A quick tap (no drag) fires `onTap`.
 * Prev/Next buttons + dots provide a non-gesture path for accessibility.
 */
export function SwipeableCardDeck({
  items,
  onTap,
  height = 152,
}: {
  items: ReactNode[];
  onTap?: (index: number) => void;
  height?: number;
}) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [snap, setSnap] = useState(false); // reset front to center without animating back
  const dragging = useRef(false);
  const animating = useRef(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const moved = useRef(false);

  // After advancing, jump the (reused) front node to center with no transition.
  useEffect(() => {
    if (!snap) return;
    const id = requestAnimationFrame(() => setSnap(false));
    return () => cancelAnimationFrame(id);
  }, [snap]);

  if (n === 0) return null;

  const advance = (dir: number) => {
    animating.current = true;
    setDragX(dir * 600);
    window.setTimeout(() => {
      setIndex((i) => (i + dir + n * 10) % n);
      setDragX(0);
      setSnap(true);
      animating.current = false;
    }, 240);
  };

  const onDown = (e: PointerEvent) => {
    if (animating.current || n < 2) {
      if (n < 2) {
        dragging.current = true;
        startX.current = e.clientX;
        moved.current = false;
      }
      return;
    }
    dragging.current = true;
    startX.current = e.clientX;
    dragXRef.current = 0;
    moved.current = false;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer may already be released (e.g. synthetic events) */
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    dragXRef.current = dx;
    if (n >= 2) setDragX(dx);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = dragXRef.current;
    dragXRef.current = 0;
    if (n >= 2 && Math.abs(dx) > 80) {
      advance(dx < 0 ? 1 : -1);
    } else if (!moved.current) {
      onTap?.(index);
      setDragX(0);
    } else {
      setDragX(0);
    }
  };

  const layers = [0, 1, 2].filter((o) => o < n);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm" style={{ height }}>
        {layers
          .slice()
          .reverse()
          .map((offset) => {
            const itemIndex = (index + offset) % n;
            const isFront = offset === 0;
            const style: React.CSSProperties = isFront
              ? {
                  transform: `translateX(${dragX}px) rotate(${dragX / 26}deg)`,
                  transition:
                    dragging.current || snap ? "none" : "transform 220ms ease, opacity 220ms ease",
                  opacity: Math.abs(dragX) > 400 ? 0 : 1,
                  touchAction: "pan-y",
                  cursor: n >= 2 ? "grab" : "pointer",
                }
              : {
                  transform: `translateY(${offset * 9}px) scale(${1 - offset * 0.05})`,
                  transition: "transform 220ms ease, opacity 220ms ease",
                  opacity: 1 - offset * 0.18,
                };
            return (
              <div
                key={offset}
                className="absolute inset-0 select-none"
                style={style}
                onPointerDown={isFront ? onDown : undefined}
                onPointerMove={isFront ? onMove : undefined}
                onPointerUp={isFront ? onUp : undefined}
                onPointerCancel={isFront ? onUp : undefined}
              >
                {items[itemIndex]}
              </div>
            );
          })}
      </div>

      {n > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => advance(-1)}
            aria-label="Previous notification"
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-2 text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to notification ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-border-strong",
                )}
              />
            ))}
          </div>
          <button
            onClick={() => advance(1)}
            aria-label="Next notification"
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-2 text-muted transition-colors hover:text-fg"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
