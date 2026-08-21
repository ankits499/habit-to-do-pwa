import { useEffect, useRef, useState, type ReactNode } from "react";

const DISMISS_THRESHOLD = 80;

/** iOS-style modal sheet: slides up on mount, swipe-down or backdrop-tap to
 * dismiss (animates out before calling onClose). `children` receives a
 * `close` callback so in-sheet Cancel/Done buttons animate out the same way. */
export function BottomSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function close() {
    setClosing(true);
    setTimeout(onClose, 200);
  }

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  }

  function onTouchEnd() {
    dragging.current = false;
    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD) {
      close();
    } else {
      setDragY(0);
    }
  }

  const translateY = closing ? "100%" : mounted ? `${dragY}px` : "100%";

  return (
    <div
      className={`fixed inset-0 z-30 flex items-end justify-center bg-black/30 transition-opacity duration-200 ${
        mounted && !closing ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateY(${translateY})`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }}
        className="w-full max-w-[480px] rounded-t-2xl border-t border-[var(--line)] bg-[var(--paper)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--line)]" />
        <div className="px-5">{children(close)}</div>
      </div>
    </div>
  );
}
