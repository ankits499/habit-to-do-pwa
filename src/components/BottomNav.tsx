import { NavLink } from "react-router-dom";
import { FlameIcon, ListIcon } from "./icons";

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 border-t border-[var(--line)] bg-[var(--paper)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[480px]">
        <NavTab to="/" label="Todos" icon={<ListIcon className="h-5 w-5" />} end />
        <NavTab to="/habits" label="Habits" icon={<FlameIcon className="h-5 w-5" />} />
      </div>
    </nav>
  );
}

function NavTab({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
          isActive ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
