import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { courseSchema, lessonSchema } from "../lib/lesson-schema.ts";
import { registeredInteractionTypes } from "../lib/interaction-types.ts";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const root = process.cwd();
const coursePath = resolve(
  root,
  "content/courses/vibe-coding-foundations.json",
);
const lessonsDirectory = resolve(root, "content/lessons");
const lessonFiles = readdirSync(lessonsDirectory)
  .filter((file) => /^lesson-\d{2}\.json$/.test(file))
  .sort();

const course = courseSchema.parse(readJson(coursePath));
const lessons = lessonFiles.map((file) =>
  lessonSchema.parse(readJson(resolve(lessonsDirectory, file))),
);
const unitByLessonId = new Map(
  course.units.flatMap((unit) =>
    unit.lessonIds.map((lessonId) => [lessonId, unit.id] as const),
  ),
);
const registeredTypes = new Set<string>(registeredInteractionTypes);
const seenLessonIds = new Set<string>();

for (const lesson of lessons) {
  if (seenLessonIds.has(lesson.id)) {
    throw new Error(`课次 ID 重复：${lesson.id}`);
  }
  seenLessonIds.add(lesson.id);
  if (lesson.courseId !== course.id) {
    throw new Error(`${lesson.id} 的 courseId 与课程清单不一致`);
  }
  if (unitByLessonId.get(lesson.id) !== lesson.unitId) {
    throw new Error(`${lesson.id} 的 unitId 与课程清单不一致`);
  }
  for (const atom of lesson.steps.flatMap((step) => step.atoms)) {
    if (!registeredTypes.has(atom.type)) {
      throw new Error(`${lesson.id} 使用了未注册互动类型：${atom.type}`);
    }
  }
  const atoms = lesson.steps.flatMap((step) => step.atoms);
  const counts = {
    choices: atoms.filter((atom) => atom.type === "choice").length,
    textInputs: atoms.filter((atom) => atom.type === "textInput").length,
    liveBuilders: atoms.filter(
      (atom) => atom.type === "taskBuilder" && atom.preview.type !== "record",
    ).length,
    tests: atoms.filter((atom) => atom.type === "runTest").length,
    records: atoms.filter(
      (atom) => atom.type === "taskBuilder" && atom.preview.type === "record",
    ).length,
    courseTools: atoms.filter((atom) => atom.type === "courseTool").length,
  };
  const usesFormalCourseTool = counts.courseTools > 0;
  const invalid = usesFormalCourseTool
    ? counts.textInputs < 1 || counts.tests < 1
    : counts.choices < 2 || counts.textInputs < 2 || counts.liveBuilders < 1 ||
      counts.tests < 1 || counts.records < 1;
  if (invalid) {
    throw new Error(
      `${lesson.id} 未达到互动密度：${JSON.stringify(counts)}`,
    );
  }
}

if (Array.from({ length: 13 }, (_, index) => `lesson-${String(index + 1).padStart(2, "0")}`).some((id) => !seenLessonIds.has(id))) {
  throw new Error("正式课程必须包含 lesson-01—13");
}
console.log(
  `内容验证通过：1 门课程、${course.units.length} 个单元、${lessons.length} 节样板课、${registeredTypes.size} 类互动原子。`,
);
