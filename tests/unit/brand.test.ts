import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { brand } from "../../config/brand.ts";

const workspaceRoot = join(import.meta.dirname, "../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|json)$/.test(entry.name) ? [path] : [];
  });
}

test("品牌配置集中声明全部用户可见名称", () => {
  assert.deepEqual(brand, {
    platformName: "Vibe Coding Lab",
    platformSubtitle: "AI创意编程实验室",
    courseSeriesName: "从灵感到App",
    studentSpaceName: "Vibe创作基地",
    workbenchName: "创造台",
    learningCenterName: "学习中心",
    projectLibraryName: "我的作品",
    galleryName: "作品广场",
  });
});

test("用户界面与正式课程内容不再包含旧品牌名称", () => {
  const paths = [
    ...sourceFiles(join(workspaceRoot, "app")),
    ...sourceFiles(join(workspaceRoot, "components")),
    ...sourceFiles(join(workspaceRoot, "data")),
    ...sourceFiles(join(workspaceRoot, "content/courses")),
    ...sourceFiles(join(workspaceRoot, "content/lessons")),
  ];

  for (const path of paths) {
    const content = readFileSync(path, "utf8");
    assert.doesNotMatch(content, /造物星球/, path);
    assert.doesNotMatch(content, /Vibe Coding(?! Lab)/, path);
  }
});
