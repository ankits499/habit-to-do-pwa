import { useState } from "react";
import type { GrowthStage } from "./growth";

const KEY = "last-seen-stage";

function read(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

function write(stage: number) {
  try {
    localStorage.setItem(KEY, String(stage));
  } catch {
    /* storage unavailable: worst case the message shows again */
  }
}

/** Returns the new stage when the tree has grown since the user last saw it
 * (and `dismiss` to acknowledge). Silent on first run and when the stage
 * drops. `ready` must be false until data has loaded, else the empty-state
 * stage 1 would overwrite the stored value. */
export function useStageUp(stage: GrowthStage, ready: boolean) {
  const [dismissed, setDismissed] = useState(false);
  if (!ready) return { grewTo: null, dismiss: () => {} };

  const seen = read();
  if (seen === null || stage < seen) write(stage);

  const grewTo = !dismissed && seen !== null && stage > seen ? stage : null;
  return {
    grewTo,
    dismiss: () => {
      write(stage);
      setDismissed(true);
    },
  };
}
