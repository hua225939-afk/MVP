"use client";

import type { ReactNode } from "react";
import { Choice } from "@/components/interactions/Choice";
import { CodePreview } from "@/components/interactions/CodePreview";
import { Reveal } from "@/components/interactions/Reveal";
import { RunTest } from "@/components/interactions/RunTest";
import { TaskBuilder } from "@/components/interactions/TaskBuilder";
import { TextInput } from "@/components/interactions/TextInput";
import { CourseToolHost } from "@/components/interactions/CourseToolHost";
import { interactionMetadata, type InteractionType } from "@/lib/interaction-types";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type RegistryProps = {
  block: InteractionAtom;
  progress?: InteractionProgress;
  allProgress: Record<string, InteractionProgress>;
  onChange: (next: InteractionProgress) => void;
  readOnly?: boolean;
};

type RegistryEntry = {
  name: string;
  purpose: string;
  render: (props: RegistryProps) => ReactNode;
};

export const interactionRegistry = {
  reveal: {
    ...interactionMetadata.reveal,
    render: (props) =>
      props.block.type === "reveal" ? <Reveal {...props} block={props.block} /> : null,
  },
  choice: {
    ...interactionMetadata.choice,
    render: (props) =>
      props.block.type === "choice" ? <Choice {...props} block={props.block} /> : null,
  },
  textInput: {
    ...interactionMetadata.textInput,
    render: (props) =>
      props.block.type === "textInput" ? <TextInput {...props} block={props.block} /> : null,
  },
  codePreview: {
    ...interactionMetadata.codePreview,
    render: (props) =>
      props.block.type === "codePreview" ? (
        <CodePreview {...props} block={props.block} />
      ) : null,
  },
  runTest: {
    ...interactionMetadata.runTest,
    render: (props) =>
      props.block.type === "runTest" ? <RunTest {...props} block={props.block} /> : null,
  },
  taskBuilder: {
    ...interactionMetadata.taskBuilder,
    render: (props) =>
      props.block.type === "taskBuilder" ? (
        <TaskBuilder {...props} block={props.block} />
      ) : null,
  },
  courseTool: {
    ...interactionMetadata.courseTool,
    render: (props) =>
      props.block.type === "courseTool" ? (
        <CourseToolHost {...props} block={props.block} />
      ) : null,
  },
} satisfies Record<InteractionType, RegistryEntry>;
