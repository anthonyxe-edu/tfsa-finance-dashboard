"use client";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type DeckItem = { id: string; node: ReactNode };

/**
 * Touch-first stacked card deck. Every card keeps a stable identity and animates
 * to its relative slot (front / 2nd / 3rd / hidden) via CSS transitions, so
 * advancing glides the front card smoothly back behind the stack — like a
 * flashcard being passed to the back. The front card also follows the pointer.
 */
export function SwipeableCardDeck({
  items,
  onTap,
  height = 152,
}: {
  items: DeckItem[];
  onTap?: (id: string) => void;
  height?: number;
}) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const moved = useRef(false);

  if (n === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + n) % n);

  const onDown = (e: PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    dragXRef.current = 0;
    moved.current = false;
    if (n >= 2) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* synthetic events */
      }
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    dragXRef.current = dx;
    if (n >= 2) setDrag(dx);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = dragXRef.current;
    dragXRef.current = 0;
    if (n >= 2 && Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    else if (!moved.current) onTap?.(items[index].id);
    setDrag(0);
  };

  // Per-slot resting transform (relative position from the front).
  const slot = (rel: number) => {
    if (rel === 0) return { y: 0, scale: 1, op: 1 };
    if (rel === 1) return { y: 9, scale: 0.95, op: 0.85 };
    if (rel === 2) return { y: 18, scale: 0.9, op: 0.55 };
    return { y: 24, scale: 0.87, op: 0 };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm" style={{ height }}>
        {items.map((item, i) => {
          const rel = (i - index + n) % n; // 0 = front
          const isFront = rel === 0;
          const { y, scale, op } = slot(rel);
          const tx = isFront && dragging.current ? drag : 0;
          const rot = isFront && dragging.current ? drag / 28 : 0;
          return (
            <div
              key={item.id}
              className="absolute inset-0 select-none"
              style={{
                transform: `translateX(${tx}px) translateY(${y}px) scale(${scale}) rotate(${rot}deg)`,
                opacity: op,
                zIndex: n - rel,
                transition:
                  isFront && dragging.current
                    ? "none"
                    : "transform 430ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease",
                touchAction: "pan-y",
                pointerEvents: isFront ? "auto" : "none",
                cursor: n >= 2 ? "grab" : "pointer",
                willChange: "transform, opacity",
              }}
              onPointerDown={isFront ? onDown : undefined}
              onPointerMove={isFront ? onMove : undefined}
              onPointerUp={isFront ? onUp : undefined}
              onPointerCancel={isFront ? onUp : undefined}
            >
              {item.node}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Previous notification"
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-2 text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
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
            onClick={() => go(1)}
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
