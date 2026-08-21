import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const DISMISS_THRESHOLD = 80;
const FOCUS_FALLBACK_MS = 300;

/** iOS-style modal sheet: slides up on mount, swipe-down or backdrop-tap to
 * dismiss (animates out before calling onClose). `children` receives a
 * `close` callback so in-sheet Cancel/Done buttons animate out the same way.
 *
 * `initialFocus`, if given, is focused only once the open transition has
 * actually finished (via `transitionend`, with a timeout fallback) rather
 * than immediately on mount — focusing while the sheet is still sliding in
 * makes iOS compute the keyboard's scroll-into-view against stale geometry,
 * leaving the input hidden behind the keyboard. */
export function BottomSheet({
  onClose,
  initialFocus,
  children,
}: {
  onClose: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
  children: (close: () => void) => ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const closingRef = useRef(false);
  closingRef.current = closing;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function focusInitial() {
    if (focused.current || closingRef.current) return;
    focused.current = true;
    initialFocus?.current?.focus();
  }

  // Fallback in case transitionend never fires (e.g. the panel was already
  // at its resting transform for some reason). Reads closingRef rather than
  // the `closing` state directly since this timeout is scheduled once on
  // mount and would otherwise see a stale, always-false `closing`.
  useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(focusInitial, FOCUS_FALLBACK_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // While open, if the keyboard's appearance/dismissal resizes the visual
  // viewport, keep whatever's focused inside the sheet actually in view —
  // covers the keyboard animating after focus already landed.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function onResize() {
      const active = document.activeElement;
      if (active instanceof HTMLElement && panelRef.current?.contains(active)) {
        active.scrollIntoView({ block: "nearest" });
      }
    }
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
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
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") focusInitial();
        }}
        style={{
          transform: `translateY(${translateY})`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }}
        className="flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl border-t border-[var(--line)] bg-[var(--paper)]"
      >
        {/* Only the handle bar is a drag target, so dragging inside the
         * scrollable content below (where a focused input needs to be
         * scrolled into view above the iOS keyboard) never gets hijacked
         * as a dismiss gesture. */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="shrink-0 pb-3 pt-2"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-[var(--line)]" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          {children(close)}
        </div>
      </div>
    </div>
  );
}
