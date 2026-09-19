import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Toast = { message: string; onUndo: () => void };
const ToastContext = createContext<(message: string, onUndo: () => void) => void>(() => {});

/** `const undoable = useUndoToast(); undoable("Todo deleted", () => restore())` */
export function useUndoToast() {
  return useContext(ToastContext);
}

const VISIBLE_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string, onUndo: () => void) => {
    clearTimeout(timer.current);
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 flex justify-center px-5"
      >
        {toast && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-[var(--ink)] py-2 pl-4 pr-2 text-sm text-[var(--paper)] shadow-lg">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => {
                toast.onUndo();
                clearTimeout(timer.current);
                setToast(null);
              }}
              className="rounded-full px-3 py-1 font-medium text-[var(--accent-ink)] bg-[var(--accent)]"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
