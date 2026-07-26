import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  ALLOWS_ARBITRARY_CODE_EXECUTION,
  PREVIEW_RENDERER_MODE,
  WORKBENCH_BREAKPOINTS,
} from "../../lib/workbench-config.ts";

test("应用预览使用受控渲染且不允许任意代码执行", () => {
  const source = readFileSync(
    resolve(process.cwd(), "components/workbench/ControlledProjectPreview.tsx"),
    "utf8",
  );
  assert.equal(PREVIEW_RENDERER_MODE, "controlled-react");
  assert.equal(ALLOWS_ARBITRARY_CODE_EXECUTION, false);
  assert.equal(/\beval\s*\(/.test(source), false);
  assert.equal(/\bFunction\s*\(/.test(source), false);
  assert.equal(/dangerouslySetInnerHTML/.test(source), false);
});

test("创造台声明电脑和平板断点，样式包含对应布局", () => {
  const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
  assert.equal(WORKBENCH_BREAKPOINTS.desktop, 1180);
  assert.equal(WORKBENCH_BREAKPOINTS.tablet, 768);
  assert.match(css, /@media \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.workbench-body/);
});

test("教师只读预览不会触发项目同步写入", () => {
  const source = readFileSync(
    resolve(process.cwd(), "components/lesson/LessonExperience.tsx"),
    "utf8",
  );
  assert.match(source, /if \(!readOnly\) \{[\s\S]*writeProgress[\s\S]*syncLessonProgressToProject/);
});
