/** Geometry for the shared orchard scene (pure, so it can be checked).
 *
 * Trees occupy *slots* in creation order: the front row holds 7, each row
 * behind holds 6 and is offset half a pitch so trees fill the gaps between
 * the ones in front. A tree's slot never depends on its size, so growing
 * never moves its neighbours. */

export const TREE_W = 56; // tree svg box at scale 1
export const TREE_H = 102;
export const FRONT_COLS = 7;
export const BACK_COLS = 6;
const MAX_ROWS = 3;
const MAX_PITCH = 92;
const OVERLAP = 1.15; // canopies may overlap up to 15% of the pitch
const ROW_SCALE = [1, 0.82, 0.68];
const ROW_OPACITY = [1, 0.88, 0.76];
const ROW_LIFT = 14; // px each row sits higher (further back)
const GROUND = 14; // px between scene bottom and front-row trunks

export type Slot = {
  row: number;
  x: number; // centre, px from scene left
  bottom: number; // px from scene bottom
  pitch: number;
  cap: number; // largest scale this slot allows (before row scale)
  rowScale: number;
  opacity: number;
  z: number;
};

export function rowCount(n: number): number {
  if (n <= FRONT_COLS) return n > 0 ? 1 : 0;
  return Math.min(MAX_ROWS, 1 + Math.ceil((n - FRONT_COLS) / BACK_COLS));
}

export function layoutOrchard(n: number, width: number): Slot[] {
  const slots: Slot[] = [];
  let placed = 0;
  for (let row = 0; row < rowCount(n); row++) {
    const capacity = row === 0 ? FRONT_COLS : BACK_COLS;
    const last = row === MAX_ROWS - 1;
    const m = last ? n - placed : Math.min(capacity, n - placed);
    // The last row takes any overflow and tightens instead of adding a 4th row.
    const base = width / (FRONT_COLS + 0.15);
    const p =
      row === 0
        ? Math.min(MAX_PITCH, width / (m + 0.15))
        : m > BACK_COLS
          ? width / (m + 0.65)
          : base;
    const half = row > 0 && m <= BACK_COLS && m % 2 === 1 ? p / 2 : 0; // odd groups shift into the gaps
    for (let col = 0; col < m; col++) {
      slots.push({
        row,
        x: width / 2 + (col - (m - 1) / 2) * p + half,
        bottom: GROUND + row * ROW_LIFT,
        pitch: p,
        cap: (p * OVERLAP) / TREE_W,
        rowScale: ROW_SCALE[row],
        opacity: ROW_OPACITY[row],
        z: (MAX_ROWS - row) * 100 + col,
      });
    }
    placed += m;
  }
  return slots;
}

/** Drawn scale of a tree at `stage` in `slot`: bigger stages draw bigger, but never past what the slot allows. */
export function treeScale(stage: number, slot: Slot): number {
  return Math.min(0.75 + stage * 0.06, slot.cap) * slot.rowScale;
}

export function sceneHeight(n: number): number {
  return 196 + ROW_LIFT * Math.max(0, rowCount(n) - 1);
}
