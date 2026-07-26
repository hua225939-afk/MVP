"use client";

import { useEffect, useState } from "react";
import { ToolPanel } from "@/components/workbench/tools/ToolPanel";
import { brand } from "@/config/brand";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { getBrowserProjectRepository } from "@/lib/projects/project-repository";
import {
  getCourseTool,
  isCourseToolUnlocked,
} from "@/lib/tools/course-tool-registry";

const availableLessonIds = Array.from(
  { length: 13 },
  (_, index) => `lesson-${String(index + 1).padStart(2, "0")}`,
);

export function CourseToolHost({
  block,
  progress,
  onChange,
  readOnly = false,
}: {
  block: Extract<InteractionAtom, { type: "courseTool" }>;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
  readOnly?: boolean;
}) {
  const [project, setProject] = useState<ProjectDocument | null>(null);
  const [message, setMessage] = useState("");
  const definition = getCourseTool(block.toolId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const repository = getBrowserProjectRepository();
      setProject(repository?.getActiveProject() ?? null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!definition) return <p>工具注册不存在：{block.toolId}</p>;
  if (!project) return <p>请先在{brand.studentSpaceName}创建或选择当前项目。</p>;
  if (
    !isCourseToolUnlocked(definition, {
      availableLessonIds,
      project,
    })
  ) {
    return (
      <section className="course-tool-locked">
        <span>工具尚未解锁</span>
        <h2>{definition.name}</h2>
        <p>请先完成前序项目成果；本课路由仍可查看，但不会绕过持续项目的数据链。</p>
        <a href={`/student/workbench/${project.projectId}`}>
          返回当前项目检查前序成果 →
        </a>
      </section>
    );
  }

  const save = (next: ProjectDocument) => {
    if (readOnly) return;
    const repository = getBrowserProjectRepository();
    const stored = repository?.get(project.projectId);
    if (!repository || !stored) return;
    try {
      const saved = repository.applyPatch(project.projectId, {
        projectId: project.projectId,
        baseRevision: stored.revision,
        source: "lesson",
        lessonId: definition.lessonId,
        toolId: definition.id,
        allowedFields: definition.outputFields,
        changes: Object.fromEntries(
          definition.outputFields
            .filter((field) => JSON.stringify(stored[field]) !== JSON.stringify(next[field]))
            .map((field) => [field, next[field]]),
        ),
        createdAt: new Date().toISOString(),
      });
      setProject(saved);
      setMessage("已写入当前 ProjectDocument");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <section className="course-tool-host">
      <header><div><small>统一创造工具</small><h2>{definition.name}</h2></div><a href={`/student/workbench/${project.projectId}?tool=${definition.id}`}>在完整创造台打开 ↗</a></header>
      <ToolPanel definition={definition} onChange={save} project={project} />
      <div className="course-tool-complete">
        <span>{message || "工具内每次确认都会保存到同一项目。"}</span>
        <button
          className="button button-primary"
          disabled={readOnly}
          onClick={() => onChange({
            value: JSON.stringify({ projectId: project.projectId, revision: project.revision, toolId: definition.id }),
            completed: true,
            correct: true,
            attempts: (progress?.attempts ?? 0) + 1,
            updatedAt: new Date().toISOString(),
          })}
          type="button"
        >确认本环节成果</button>
      </div>
    </section>
  );
}
