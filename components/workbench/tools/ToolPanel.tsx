"use client";

import type { ProjectDocument } from "@/lib/projects/project-document";
import type { CourseToolDefinition } from "@/lib/tools/course-tool-registry";
import { ProjectBoundaryTool } from "./ProjectBoundaryTool";
import { UnitOneIntentTool } from "./UnitOneIntentTool";
import { PageStructureStudio } from "./PageStructureStudio";
import { MoodboardThemeStudio } from "./MoodboardThemeStudio";
import { ComponentStudio } from "./ComponentStudio";
import {
  ConditionBuilder,
  EventBuilder,
  InputOutputBuilder,
  StateBuilder,
} from "./UnitThreeTools";
import {
  AppFlowComposer,
  BugAnnotationStudio,
  PeerReviewStudio,
} from "./UnitFourTools";

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
    return <UnitOneIntentTool onChange={onChange} project={project} />;
  }

  if (definition.id === "project-boundary") {
    return <ProjectBoundaryTool onChange={onChange} project={project} />;
  }

  if (definition.id === "page-structure") {
    return <PageStructureStudio onChange={onChange} project={project} />;
  }

  if (definition.id === "appearance-theme") {
    return <MoodboardThemeStudio onChange={onChange} project={project} />;
  }

  if (definition.id === "component-center") {
    return <ComponentStudio onChange={onChange} project={project} />;
  }

  if (definition.id === "click-event") {
    return <EventBuilder definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "input-output") {
    return <InputOutputBuilder definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "condition-branch") {
    return <ConditionBuilder definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "state-memory") {
    return <StateBuilder definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "app-composer") {
    return <AppFlowComposer definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "bug-scanner") {
    return <BugAnnotationStudio definition={definition} onChange={onChange} project={project} />;
  }

  if (definition.id === "playtest-feedback") {
    return <PeerReviewStudio definition={definition} onChange={onChange} project={project} />;
  }

  return (
    <div className="tool-placeholder">
      <b>{definition.name}的正式入口已登记</b>
      <p>{definition.unlockCondition}。具体能力将在对应单元开发，不在本轮提前生成。</p>
    </div>
  );
}
