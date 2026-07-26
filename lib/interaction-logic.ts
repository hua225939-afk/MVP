export type TextValidation =
  | {
      mode: "oneOf";
      acceptedAnswers: string[];
      normalize: Array<
        "trim" | "lowercase" | "removeWhitespace" | "removePunctuation"
      >;
    }
  | { mode: "minLength"; minLength: number };

function normalizeText(value: string, rules: Extract<TextValidation, { mode: "oneOf" }>["normalize"]) {
  return rules.reduce((current, rule) => {
    switch (rule) {
      case "trim":
        return current.trim();
      case "lowercase":
        return current.toLowerCase();
      case "removeWhitespace":
        return current.replace(/\s+/g, "");
      case "removePunctuation":
        return current.replace(/[。！？!?,，；;：:“”"'‘’、.]/g, "");
    }
  }, value);
}

export function validateTextInput(value: string, validation: TextValidation) {
  if (validation.mode === "minLength") {
    return value.trim().length >= validation.minLength;
  }
  const normalized = normalizeText(value, validation.normalize);
  return validation.acceptedAnswers.some(
    (answer) => normalizeText(answer, validation.normalize) === normalized,
  );
}

export type ContainsTest = {
  id: string;
  label: string;
  includes: string;
  message: string;
};

export function evaluateContainsTests(code: string, tests: ContainsTest[]) {
  const normalizedCode = code.toLocaleLowerCase();
  return tests.map((test) => ({
    ...test,
    passed: normalizedCode.includes(test.includes.toLocaleLowerCase()),
  }));
}

