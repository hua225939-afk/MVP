"use client";

import { Choice } from "@/components/interactions/Choice";
import { CodePreview } from "@/components/interactions/CodePreview";
import { Reveal } from "@/components/interactions/Reveal";
import { RunTest } from "@/components/interactions/RunTest";
import { TextInput } from "@/components/interactions/TextInput";
import type { InteractionBlock } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

export function LessonRenderer({
  blocks,
  progress,
  onChange,
}: {
  blocks: InteractionBlock[];
  progress: Record<string, InteractionProgress>;
  onChange: (blockId: string, next: InteractionProgress) => void;
}) {
  return (
    <div className="lesson-blocks">
      {blocks.map((block) => {
        const shared = {
          progress: progress[block.id],
          onChange: (next: InteractionProgress) => onChange(block.id, next),
        };

        switch (block.type) {
          case "reveal":
            return <Reveal block={block} key={block.id} {...shared} />;
          case "choice":
            return <Choice block={block} key={block.id} {...shared} />;
          case "textInput":
            return <TextInput block={block} key={block.id} {...shared} />;
          case "codePreview":
            return <CodePreview block={block} key={block.id} {...shared} />;
          case "runTest":
            return <RunTest block={block} key={block.id} {...shared} />;
          default: {
            const exhaustive: never = block;
            return exhaustive;
          }
        }
      })}
    </div>
  );
}
