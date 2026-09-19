import { NavLink } from "react-router-dom";
import { ListIcon, SproutIcon } from "./icons";
import { useTodos } from "../features/todos/hooks";
import { todayISO } from "../lib/dates";

export function BottomNav() {
  const { data: todos = [] } = useTodos();
  const today = todayISO();
  const overdue = todos.filter((t) => !t.done && t.due_date && t.due_date < today).length;
  return (
    <nav className="shrink-0 bg-[var(--paper)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[480px]">
        <NavTab to="/" label="Today" icon={<ListIcon className="h-5 w-5" />} end badge={overdue} />
        <NavTab to="/garden" label="Garden" icon={<SproutIcon className="h-5 w-5" />} />
      </div>
    </nav>
  );
}

function NavTab({
  to,
  label,
  icon,
  end,
  badge,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
          isActive ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
        }`
      }
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span
            aria-label={`${badge} overdue`}
            className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-[var(--danger)] px-1 text-center text-[10px] font-semibold leading-4 text-[var(--accent-ink)]"
          >
            {badge}
          </span>
        )}
      </span>
      {label}
    </NavLink>
  );
}
