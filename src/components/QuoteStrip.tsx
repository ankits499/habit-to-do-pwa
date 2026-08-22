import { useEffect, useMemo, useState } from "react";
import { pickQuote } from "../lib/quotes";
import { todayISO } from "../lib/dates";

export function QuoteStrip({ seed }: { seed: string }) {
  const [mounted, setMounted] = useState(false);
  const quote = useMemo(() => pickQuote(seed, todayISO()), [seed]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <p
      style={{
        opacity: mounted ? 1 : 0,
        transition: "opacity 400ms ease-out, transform 400ms ease-out",
        transform: mounted ? "translateY(0)" : "translateY(2px)",
      }}
      className="px-5 pt-3 text-sm italic text-[var(--ink-muted)] font-[family-name:var(--font-display)]"
    >
      "{quote.text}"{quote.author && <span className="not-italic"> — {quote.author}</span>}
    </p>
  );
}
