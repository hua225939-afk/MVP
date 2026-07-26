"use client";

import { interactionRegistry } from "@/components/interactions/registry";

export function InteractionRegistryCatalog() {
  const interactions = Object.entries(interactionRegistry);
  return (
    <div className="component-catalog">
      {interactions.map(([id, component], index) => (
        <article key={id}>
          <span className="component-mark">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <small>{id}</small>
            <h3>{component.name}</h3>
            <p>{component.purpose}</p>
          </div>
          <span className="component-usage">LessonRenderer 已注册</span>
        </article>
      ))}
    </div>
  );
}

export const INTERACTION_REGISTRY_COUNT =
  Object.keys(interactionRegistry).length;

