// Run: npx tsx src/lib/orchardLayout.check.ts
import assert from "node:assert/strict";
import { layoutOrchard, rowCount, treeScale, TREE_W } from "./orchardLayout";

const W = 440;
for (let n = 0; n <= 25; n++) {
  const slots = layoutOrchard(n, W);
  assert.equal(slots.length, n);
  assert.ok(rowCount(n) <= 3);
  for (const s of slots) {
    // Every tree, at its largest possible size, stays inside the scene.
    const half = (TREE_W / 2) * treeScale(10, s);
    assert.ok(s.x - half >= -0.5, `n=${n} left edge ${s.x - half}`);
    assert.ok(s.x + half <= W + 0.5, `n=${n} right edge ${s.x + half}`);
  }
  // Same-row neighbours keep at least 0.6 pitch between centres.
  for (let r = 0; r < 3; r++) {
    const row = slots.filter((s) => s.row === r).sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) assert.ok(row[i].x - row[i - 1].x >= 0.6 * row[i].pitch - 1e-6, `n=${n} row ${r} crowded`);
  }
  // Rows fill front-first and z paints front over back.
  const rows = slots.map((s) => s.row);
  assert.deepEqual(rows, [...rows].sort((a, b) => a - b));
  for (const a of slots) for (const b of slots) if (a.row < b.row) assert.ok(a.z > b.z);
  // Adding a habit appends: earlier slots keep their row.
  if (n > 0) assert.deepEqual(layoutOrchard(n - 1, W).map((s) => s.row), rows.slice(0, n - 1));
}
// A tree growing changes only its scale, not its slot.
const s = layoutOrchard(5, W)[2];
assert.ok(treeScale(9, s) > treeScale(2, s));
// Big trees never exceed what a crowded slot allows.
const crowded = layoutOrchard(19, W)[0];
assert.ok(treeScale(10, crowded) <= crowded.cap * crowded.rowScale + 1e-9);
console.log("orchard layout checks passed");
