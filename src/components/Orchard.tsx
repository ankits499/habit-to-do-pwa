import { useEffect, useMemo, useRef, useState } from "react";
import { GrowthTree } from "./GrowthTree";
import type { Habit, HabitLog } from "../data/types";
import { isScheduledOn, todayISO } from "../lib/dates";
import { stageForStreak, type GrowthStage } from "../lib/growth";
import { currentStreak, growthMomentum } from "../lib/streak";
import { layoutOrchard, sceneHeight, treeScale, TREE_H, TREE_W, type Slot } from "../lib/orchardLayout";

const LABEL_MS = 2500;
const STATE_OPACITY = { done: 1, open: 0.6, rest: 0.35 } as const;

type Tree = { habit: Habit; stage: GrowthStage; streak: number; state: keyof typeof STATE_OPACITY };

/** One shared scene: every active habit is a tree standing on the same
 * ground, no names. Tap a tree to see its name; tap again to open it. */
export function Orchard({
  habits,
  logs,
  onOpen,
}: {
  habits: Habit[];
  logs: HabitLog[];
  onOpen: (habit: Habit) => void;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(440);
  const [selected, setSelected] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const empty = habits.length === 0; // the scene element only exists when there are trees
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 440));
    ro.observe(el);
    setWidth(el.clientWidth || 440);
    return () => ro.disconnect();
  }, [empty]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const trees: Tree[] = useMemo(() => {
    const today = todayISO();
    return habits.map((habit) => {
      const scheduled = isScheduledOn(habit.frequency, today);
      const done = logs.some((l) => l.habit_id === habit.id && l.log_date === today);
      return {
        habit,
        stage: stageForStreak(growthMomentum(habit, logs)),
        streak: currentStreak(habit, logs),
        state: !scheduled ? "rest" : done ? "done" : "open",
      };
    });
  }, [habits, logs]);

  const slots = useMemo(() => layoutOrchard(trees.length, width), [trees.length, width]);

  // Only the two tallest front-row trees get critters and weather; the rest just sway.
  const fullIdx = useMemo(() => {
    const front = trees.map((t, i) => ({ i, stage: t.stage, row: slots[i]?.row })).filter((t) => t.row === 0);
    return new Set(front.sort((a, b) => b.stage - a.stage || a.i - b.i).slice(0, 2).map((t) => t.i));
  }, [trees, slots]);

  function tap(habit: Habit) {
    clearTimeout(timer.current);
    if (selected === habit.id) {
      setSelected(null);
      onOpen(habit);
      return;
    }
    setSelected(habit.id);
    timer.current = setTimeout(() => setSelected(null), LABEL_MS);
  }

  if (trees.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <GrowthTree stage={1} ambient="calm" />
        <p className="text-sm text-[var(--ink-muted)]">Plant a habit to start your forest.</p>
      </div>
    );
  }

  const sel = trees.findIndex((t) => t.habit.id === selected);
  const selSlot = sel >= 0 ? slots[sel] : null;
  const selTree = sel >= 0 ? trees[sel] : null;

  return (
    <div ref={sceneRef} className="relative overflow-hidden" style={{ height: sceneHeight(trees.length) }}>
      {/* Ground */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-5"
        style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--ink) 7%, transparent), transparent)" }}
      />
      {/* Wind: two faint streaks crossing the whole scene */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="#f2f0ea" strokeWidth="1.2" strokeLinecap="round">
        <path className="wind-scene" style={{ ["--w" as string]: `${width}px` }} d="M0 60 q10 -7 20 0 t20 0 t20 0" />
        <path className="wind-scene" style={{ ["--w" as string]: `${width}px`, animationDelay: "-7s", animationDuration: "17s" }} d="M0 104 q9 -6 18 0 t18 0" />
      </svg>

      {trees.map((t, i) => (
        <OrchardTree
          key={t.habit.id}
          tree={t}
          slot={slots[i]}
          ambient={fullIdx.has(i) ? "full" : "calm"}
          onTap={() => tap(t.habit)}
        />
      ))}

      {selSlot && selTree && (
        <button
          type="button"
          onClick={() => tap(selTree.habit)}
          style={{
            left: Math.min(Math.max(selSlot.x, 70), width - 70),
            bottom: selSlot.bottom + TREE_H * treeScale(selTree.stage, selSlot) + 6,
          }}
          className="absolute z-[999] max-w-[140px] -translate-x-1/2 truncate rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-[var(--paper)]"
        >
          {selTree.habit.name} ›
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {selTree ? selTree.habit.name : ""}
      </span>
    </div>
  );
}

function OrchardTree({
  tree,
  slot,
  ambient,
  onTap,
}: {
  tree: Tree;
  slot: Slot;
  ambient: "full" | "calm";
  onTap: () => void;
}) {
  const { habit, stage, streak, state } = tree;
  const scale = treeScale(stage, slot);
  const w = Math.max(44, slot.pitch);
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${habit.name}${streak > 0 ? `, ${streak} day streak` : ""}${state === "done" ? ", done today" : ""}`}
      style={{
        left: slot.x - w / 2,
        bottom: slot.bottom,
        width: w,
        height: TREE_H * scale,
        zIndex: slot.z,
        opacity: slot.opacity * STATE_OPACITY[state],
        transition: "left 400ms ease, bottom 400ms ease, height 600ms ease, opacity 400ms ease",
      }}
      className="absolute"
    >
      {/* The tree eases to its new size when it grows a stage. */}
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          width: TREE_W,
          height: TREE_H,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "50% 100%",
          transition: "transform 600ms ease",
        }}
      >
        <GrowthTree stage={stage} ambient={ambient} />
      </div>
      {state === "done" && (
        <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
      )}
    </button>
  );
}
