import { useEffect, useState, type ReactNode } from "react";

const CLOSE_MS = 160;

/** iOS list-insert idiom (Reminders/Notes "+"): renders in place at the top
 * of a list, sliding/fading in rather than rising from the screen edge like
 * a sheet. `children` receives `close` so in-card Cancel/Add both collapse
 * it the same way before the parent unmounts it. */
export function InlineComposer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function close() {
    setClosing(true);
    setTimeout(onClose, CLOSE_MS);
  }

  const open = mounted && !closing;

  return (
    <div
      style={{
        transform: open ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.98)",
        opacity: open ? 1 : 0,
        transition: `transform ${CLOSE_MS}ms ease-out, opacity ${CLOSE_MS}ms ease-out`,
        transformOrigin: "top center",
      }}
      className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
    >
      {children(close)}
    </div>
  );
}
