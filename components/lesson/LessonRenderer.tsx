"use client";

import { interactionRegistry } from "@/components/interactions/registry";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

export function LessonRenderer({
  atoms,
  progress,
  onChange,
  readOnly = false,
}: {
  atoms: InteractionAtom[];
  progress: Record<string, InteractionProgress>;
  onChange: (atomId: string, next: InteractionProgress) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="lesson-blocks">
      {atoms.map((atom) => {
        const entry = interactionRegistry[atom.type];
        const sourceUpdatedAt =
          "sourceAtomId" in atom && atom.sourceAtomId
            ? progress[atom.sourceAtomId]?.updatedAt
            : undefined;
        return (
          <div key={`${atom.id}:${sourceUpdatedAt ?? "static"}`}>
            {entry.render({
              block: atom,
              progress: progress[atom.id],
              allProgress: progress,
              onChange: (next) => onChange(atom.id, next),
              readOnly,
            })}
          </div>
        );
      })}
    </div>
  );
}
