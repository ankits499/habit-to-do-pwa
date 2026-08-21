import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-[var(--ink)]">
        {title}
      </h1>
      <div className="flex items-center gap-1">
        {action}
        <ThemeToggle />
      </div>
    </header>
  );
}
