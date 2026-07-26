"use client";

import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  applyToolChanges,
  type CourseToolDefinition,
} from "@/lib/tools/course-tool-registry";

export function ToolPanel({
  definition,
  project,
  onChange,
}: {
  definition: CourseToolDefinition;
  project: ProjectDocument;
  onChange: (next: ProjectDocument) => void;
}) {
  if (definition.id === "intent-canvas") {
    return (
      <div className="tool-form">
        <label>
          应用名称
          <input
            onChange={(event) =>
              onChange(
                applyToolChanges(project, definition, {
                  title: event.target.value || "未命名应用",
                }),
              )
            }
            value={project.title}
          />
        </label>
        <label>
          服务谁
          <input
            onChange={(event) =>
              onChange(
                applyToolChanges(project, definition, {
                  audience: { ...project.audience, primary: event.target.value },
                }),
              )
            }
            placeholder="例如：经常忘记喝水的同学"
            value={project.audience.primary}
          />
        </label>
        <label>
          生活问题
          <textarea
            onChange={(event) =>
              onChange(
                applyToolChanges(project, definition, {
                  scenario: { ...project.scenario, problem: event.target.value },
                }),
              )
            }
            value={project.scenario.problem}
          />
        </label>
        <label>
          一句话任务
          <textarea
            onChange={(event) =>
              onChange(
                applyToolChanges(project, definition, {
                  intent: { ...project.intent, statement: event.target.value },
                }),
              )
            }
            value={project.intent.statement}
          />
        </label>
      </div>
    );
  }

  if (definition.id === "click-event") {
    const current = project.interactions[0];
    return (
      <div className="tool-form">
        <label>
          点击后的反馈
          <input
            onChange={(event) => {
              const interaction = current ?? {
                id: "interaction-primary-click",
                componentId: "component-action",
                trigger: "click" as const,
                action: "message" as const,
                config: {},
              };
              onChange(
                applyToolChanges(project, definition, {
                  interactions: [
                    {
                      ...interaction,
                      config: {
                        ...interaction.config,
                        feedback: event.target.value,
                      },
                    },
                    ...project.interactions.slice(current ? 1 : 0),
                  ],
                }),
              );
            }}
            placeholder="例如：喝水记录成功"
            value={String(current?.config.feedback ?? "")}
          />
        </label>
        <label>
          起始次数
          <input
            min="0"
            onChange={(event) => {
              const interaction = current ?? {
                id: "interaction-primary-click",
                componentId: "component-action",
                trigger: "click" as const,
                action: "message" as const,
                config: {},
              };
              onChange(
                applyToolChanges(project, definition, {
                  interactions: [
                    {
                      ...interaction,
                      config: {
                        ...interaction.config,
                        startValue: Number(event.target.value) || 0,
                      },
                    },
                    ...project.interactions.slice(current ? 1 : 0),
                  ],
                }),
              );
            }}
            type="number"
            value={Number(current?.config.startValue) || 0}
          />
        </label>
        <p className="tool-note">
          当前工具修改后会使相关测试失效；请在“测试”模式重新运行。
        </p>
      </div>
    );
  }

  return (
    <div className="tool-placeholder">
      <b>{definition.name}的正式入口已登记</b>
      <p>{definition.unlockCondition}。具体能力将在对应单元开发，不在本轮提前生成。</p>
    </div>
  );
}
