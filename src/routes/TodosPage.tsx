import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { BottomSheet } from "../components/BottomSheet";
import { CalendarIcon, PlusIcon, TrashIcon, XIcon } from "../components/icons";
import {
  useAddTodo,
  useDeleteTodo,
  useEditTodo,
  useTodos,
  useToggleTodo,
} from "../features/todos/hooks";
import type { Todo } from "../data/types";
import { addDays, formatDueDate, todayISO } from "../lib/dates";

export function TodosPage() {
  const { data: todos = [], isLoading } = useTodos();
  const [composing, setComposing] = useState(false);

  const groups = useMemo(() => {
    const today = todayISO();
    const active = todos.filter((t) => !t.done);
    const done = todos.filter((t) => t.done);
    active.sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
    return {
      today: active.filter((t) => t.due_date === today),
      upcoming: active.filter((t) => t.due_date && t.due_date > today),
      noDate: active.filter((t) => !t.due_date),
      done: done.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  }, [todos]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Todos"
        action={
          <button
            type="button"
            aria-label="Add todo"
            onClick={() => setComposing(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[480px] px-5 pb-8">
          {!isLoading && todos.length === 0 && (
            <EmptyState onAdd={() => setComposing(true)} />
          )}

          <TodoGroup label="Today" items={groups.today} />
          <TodoGroup label="Upcoming" items={groups.upcoming} />
          <TodoGroup label="No date" items={groups.noDate} />
          <TodoGroup label="Done" items={groups.done} muted />
        </div>
      </div>

      {composing && <ComposeTodoSheet onDone={() => setComposing(false)} />}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
        Nothing on your list
      </p>
      <p className="max-w-[30ch] text-sm text-[var(--ink-muted)]">
        Add the first thing you need to get done today.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
      >
        Add a todo
      </button>
    </div>
  );
}

function TodoGroup({ label, items, muted }: { label: string; items: Todo[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6 first:mt-4">
      <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </h2>
      <ul className="flex flex-col divide-y divide-[var(--line)]">
        {items.map((todo) => (
          <TodoRow key={todo.id} todo={todo} muted={muted} />
        ))}
      </ul>
    </section>
  );
}

function TodoRow({ todo, muted }: { todo: Todo; muted?: boolean }) {
  const toggle = useToggleTodo();
  const remove = useDeleteTodo();
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

      <button
        type="button"
        aria-label="Delete todo"
        onClick={() => remove.mutate(todo.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[var(--danger)]"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

function EditTodoRow({ todo, onDone }: { todo: Todo; onDone: () => void }) {
  const edit = useEditTodo();
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
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onDone} className="p-1.5 text-[var(--ink-muted)]">
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

function ComposeTodoSheet({ onDone }: { onDone: () => void }) {
  const add = useAddTodo();
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

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
    <BottomSheet onClose={onDone}>
      {(close) => (
        <div className="flex flex-col gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            New Todo
          </h2>

          <input
            placeholder="What needs doing?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(close)}
            className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2.5 text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />

          <div className="flex items-center gap-2 overflow-x-auto">
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

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="p-1.5 text-[var(--ink-muted)]">
              <XIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => submit(close)}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-ink)]"
            >
              Add
            </button>
          </div>
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
      className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-ink)]"
          : "border border-[var(--line)] text-[var(--ink-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
