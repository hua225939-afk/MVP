export type ProjectHistory<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function createHistory<T>(present: T): ProjectHistory<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(
  history: ProjectHistory<T>,
  next: T,
  limit = 50,
): ProjectHistory<T> {
  return {
    past: [...history.past, history.present].slice(-limit),
    present: next,
    future: [],
  };
}

export function undoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const next = history.future[0];
  if (next === undefined) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
