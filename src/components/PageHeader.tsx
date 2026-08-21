import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)]/95 px-5 py-4 backdrop-blur">
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
