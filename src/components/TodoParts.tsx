import { useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { KindSwitch } from "./KindSwitch";
import { CalendarIcon, TrashIcon, XIcon } from "./icons";
import {
  useAddTodo,
  useDeleteTodo,
  useEditTodo,
  useToggleTodo,
} from "../features/todos/hooks";
import type { Todo } from "../data/types";
import { addDays, formatDueDate, todayISO } from "../lib/dates";

export function TodoGroup({
  label,
  items,
  muted,
  danger,
}: {
  label: string;
  items: Todo[];
  muted?: boolean;
  danger?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6 first:mt-4">
      <h2 className={`mb-1 text-xs ${danger ? "text-[var(--danger)]" : "text-[var(--ink-muted)]"}`}>
        {danger ? `${label} · ${items.length}` : label}
      </h2>
      <ul className="flex flex-col">
        {items.map((todo) => (
          <TodoRow key={todo.id} todo={todo} muted={muted} />
        ))}
      </ul>
    </section>
  );
}

function TodoRow({ todo, muted }: { todo: Todo; muted?: boolean }) {
  const toggle = useToggleTodo();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditTodoRow todo={todo} onDone={() => setEditing(false)} />;
  }

  return (
    <li className="group flex items-center gap-3 py-3">
      <button
        type="button"
        aria-label={todo.done ? "Mark not done" : "Mark done"}
        onClick={() => toggle.mutate({ id: todo.id, done: !todo.done })}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
          todo.done
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
            : "border-[var(--line)] text-transparent"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <button type="button" onClick={() => setEditing(true)} className="min-w-0 flex-1 text-left">
        <p
          className={`truncate text-[15px] ${
            todo.done || muted ? "text-[var(--ink-muted)] line-through" : "text-[var(--ink)]"
          }`}
        >
          {todo.text}
        </p>
        {todo.due_date && (
          <p className="text-xs text-[var(--ink-muted)]">{formatDueDate(todo.due_date)}</p>
        )}
      </button>

    </li>
  );
}

function EditTodoRow({ todo, onDone }: { todo: Todo; onDone: () => void }) {
  const edit = useEditTodo();
  const remove = useDeleteTodo();
  const [text, setText] = useState(todo.text);
  const [dueDate, setDueDate] = useState(todo.due_date ?? "");

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return onDone();
    edit.mutate({ id: todo.id, patch: { text: trimmed, due_date: dueDate || null } });
    onDone();
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-[15px] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm text-[var(--ink)]"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Delete todo"
            onClick={() => remove.mutate(todo.id)}
            className="p-1.5 text-[var(--ink-muted)] transition-colors hover:text-[var(--danger)]"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Cancel" onClick={onDone} className="p-1.5 text-[var(--ink-muted)]">
            <XIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)]"
          >
            Save
          </button>
        </div>
      </div>
    </li>
  );
}

export function AddTodoSheet({ onDone, onSwitch }: { onDone: () => void; onSwitch?: () => void }) {
  const add = useAddTodo();
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const isNoDate = dueDate === "";
  const isToday = dueDate === today;
  const isTomorrow = dueDate === tomorrow;
  const isCustom = !isNoDate && !isToday && !isTomorrow;

  function submit(close: () => void) {
    const trimmed = text.trim();
    if (!trimmed) return close();
    add.mutate({ text: trimmed, due_date: dueDate || null });
    close();
  }

  return (
    <BottomSheet onClose={onDone} initialFocus={inputRef}>
      {(close) => (
        <div className="flex flex-col gap-5">
          {onSwitch ? (
            <KindSwitch kind="todo" onSwitch={onSwitch} />
          ) : (
            <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
              New todo
            </h2>
          )}

          <input
            ref={inputRef}
            placeholder="What needs doing?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(close);
              if (e.key === "Escape") close();
            }}
            className="w-full border-b border-[var(--line)] bg-transparent pb-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus-visible:border-[var(--accent)]"
          />

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              Due
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <DateChip active={isNoDate} onClick={() => setDueDate("")}>
                No date
              </DateChip>
              <DateChip active={isToday} onClick={() => setDueDate(today)}>
                Today
              </DateChip>
              <DateChip active={isTomorrow} onClick={() => setDueDate(tomorrow)}>
                Tomorrow
              </DateChip>
              <div className="relative shrink-0">
                <DateChip active={isCustom} onClick={() => {}}>
                  {isCustom ? (
                    formatDueDate(dueDate)
                  ) : (
                    <CalendarIcon className="h-4 w-4" />
                  )}
                </DateChip>
                <input
                  type="date"
                  aria-label="Pick a date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => submit(close)}
            className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-ink)]"
          >
            Add todo
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function DateChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-ink)]"
          : "border border-[var(--line)] text-[var(--ink-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
