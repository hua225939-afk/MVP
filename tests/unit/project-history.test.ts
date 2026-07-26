import assert from "node:assert/strict";
import test from "node:test";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../lib/projects/project-history.ts";

test("撤销、重做与新分支符合编辑历史语义", () => {
  const first = pushHistory(createHistory("A"), "B");
  const second = pushHistory(first, "C");
  const undone = undoHistory(second);
  assert.equal(undone.present, "B");
  assert.equal(redoHistory(undone).present, "C");
  const branched = pushHistory(undone, "D");
  assert.deepEqual(branched.future, []);
  assert.equal(branched.present, "D");
});
