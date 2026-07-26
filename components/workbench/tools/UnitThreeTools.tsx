"use client";

import { useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  applyToolChanges,
  type CourseToolDefinition,
} from "@/lib/tools/course-tool-registry";
import {
  conditionCode,
  evaluateProjectConditions,
  eventCode,
  findConditionProblems,
  resetClickInteraction,
  runClickInteraction,
  updateStateValue,
  validateProjectInput,
  type SafeRuntime,
} from "@/lib/unit-three/interaction-engine";

type ToolProps = {
  definition: CourseToolDefinition;
  project: ProjectDocument;
  onChange: (next: ProjectDocument) => void;
};

const now = () => new Date().toISOString();

function replaceById<T extends { id: string }>(items: T[], next: T) {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next];
}

function testRecord(
  project: ProjectDocument,
  id: string,
  name: string,
  passed: boolean,
  toolId: string,
  message: string,
) {
  const previous = project.tests.find((item) => item.id === id);
  return {
    id,
    name,
    status: passed ? ("pass" as const) : ("fail" as const),
    projectRevision: project.revision,
    toolId,
    message,
    attempts: (previous?.attempts ?? 0) + 1,
    updatedAt: now(),
  };
}

function artifact(
  id: string,
  name: string,
  content: string,
): ProjectDocument["artifacts"][number] {
  const timestamp = now();
  return {
    id,
    type: "document",
    name,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function EventBuilder({ definition, project, onChange }: ToolProps) {
  const buttons = project.components.filter((item) => item.type === "button");
  const existing = project.interactions.find((item) => item.trigger === "click");
  const [componentId, setComponentId] = useState(
    existing?.componentId ?? buttons[0]?.id ?? project.components[0]?.id ?? "",
  );
  const [feedback, setFeedback] = useState(
    String(existing?.config.feedback ?? "任务启动成功！"),
  );
  const [color, setColor] = useState(
    String(existing?.config.color ?? project.styleTokens.primary),
  );
  const [effects, setEffects] = useState<string[]>(
    String(existing?.config.effects ?? "message,color")
      .split(",")
      .filter(Boolean),
  );
  const [increment, setIncrement] = useState(
    Number(existing?.config.increment ?? 0),
  );
  const [resetValue, setResetValue] = useState(
    Number(existing?.config.resetValue ?? 1),
  );
  const baseAccent = project.styleTokens.primary;
  const draft = {
    id: existing?.id ?? "interaction-primary-click",
    componentId,
    trigger: "click" as const,
    action: "message" as const,
    config: { feedback, color, effects: effects.join(","), increment, resetValue, startValue: 0 },
  };
  const [runtime, setRuntime] = useState<SafeRuntime>(() =>
    resetClickInteraction(draft, baseAccent),
  );
  const [clicks, setClicks] = useState(0);

  const toggleEffect = (effect: string) => {
    setEffects((current) =>
      current.includes(effect)
        ? current.filter((item) => item !== effect)
        : [...current, effect],
    );
  };

  const save = () => {
    const validEffects = effects.length >= 2;
    const clickPassed = clicks >= 1;
    const continuousPassed = clicks >= 2 && (!effects.includes("counter") || increment === 1);
    const resetPassed = resetValue === 0;
    const tests = [
      testRecord(project, "event-first-click", "第一次点击", clickPassed, definition.id, clickPassed ? "按钮产生了可见反馈" : "请先点击一次"),
      testRecord(project, "event-continuous-click", "连续点击", continuousPassed, definition.id, continuousPassed ? "连续点击计数正确" : "连续点击仍有计数故障"),
      testRecord(project, "event-reset", "重置", resetPassed, definition.id, resetPassed ? "已回到起点" : "重置值不是 0"),
    ];
    const selected = project.components.find((item) => item.id === componentId);
    onChange(
      applyToolChanges(project, definition, {
        interactions: replaceById(project.interactions, draft),
        components: selected
          ? replaceById(project.components, {
              ...selected,
              props: { ...selected.props, eventEnabled: true },
            })
          : project.components,
        tests: [...project.tests.filter((item) => !tests.some((test) => test.id === item.id)), ...tests],
        decisions: replaceById(project.decisions, {
          id: "decision-event-feedback",
          lessonId: "lesson-06",
          toolId: definition.id,
          title: "点击反馈组合",
          reason: validEffects ? `选择 ${effects.join("、")}，让操作结果看得见` : "还需要至少两个反馈效果",
          suggestedBy: "student",
          createdAt: now(),
        }),
        artifacts: replaceById(
          project.artifacts,
          artifact(
            "artifact-event-map",
            "触发—动作—反馈关系图与修复记录",
            `按钮 ${componentId} → 点击 → ${effects.join(" + ")}；修复：increment=${increment}, reset=${resetValue}`,
          ),
        ),
      }),
    );
  };

  return (
    <div className="unit-three-builder">
      <section className="builder-card">
        <span className="builder-kicker">机关启动任务</span>
        <h3>把自己页面里的按钮接上反馈</h3>
        <div className="builder-fields">
          <label>
            页面按钮
            <select value={componentId} onChange={(event) => setComponentId(event.target.value)}>
              {buttons.map((button) => <option key={button.id} value={button.id}>{button.name}</option>)}
            </select>
          </label>
          <label>
            反馈文字
            <input value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </label>
          <label>
            反馈颜色
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
        </div>
        <div className="effect-picker" aria-label="反馈效果">
          {["message", "color", "counter"].map((effect) => (
            <button
              aria-pressed={effects.includes(effect)}
              key={effect}
              onClick={() => toggleEffect(effect)}
              type="button"
            >
              {effect === "message" ? "文字变化" : effect === "color" ? "颜色变化" : "数字增加"}
            </button>
          ))}
        </div>
        <p className={effects.length >= 2 ? "builder-pass" : "builder-warning"}>
          已选择 {effects.length} 个反馈，任务要求至少 2 个。
        </p>
      </section>

      <section className="builder-card builder-lab">
        <div style={{ "--lab-accent": runtime.accent } as React.CSSProperties}>
          <p>{runtime.message}</p>
          <b>启动次数：{runtime.count}</b>
          <button
            onClick={() => {
              setRuntime((current) => runClickInteraction(draft, current));
              setClicks((current) => current + 1);
            }}
            type="button"
          >
            实际点击
          </button>
          <button
            className="secondary-action"
            onClick={() => setRuntime(resetClickInteraction(draft, baseAccent))}
            type="button"
          >
            重置
          </button>
        </div>
        <div className="bug-repair">
          <b>轻量 Bug 扫描</b>
          <span>连续点击：每次应 +1（当前 +{increment}）</span>
          <button onClick={() => setIncrement(1)} type="button">修复计数</button>
          <span>重置：应回到 0（当前 {resetValue}）</span>
          <button onClick={() => setResetValue(0)} type="button">修复重置</button>
        </div>
      </section>

      <section className="builder-card code-panel">
        <span>安全范围内的 onClick 代码</span>
        <pre>{eventCode(draft)}</pre>
      </section>
      <button className="primary-save" disabled={!componentId || effects.length < 2} onClick={save} type="button">
        保存事件关系图与测试记录
      </button>
    </div>
  );
}

export function InputOutputBuilder({ definition, project, onChange }: ToolProps) {
  const existing = project.inputs[0];
  const [inputType, setInputType] = useState<"text" | "number" | "select">(existing?.inputType ?? "text");
  const [label, setLabel] = useState(existing?.label ?? "告诉我你的选择");
  const [placeholder, setPlaceholder] = useState(existing?.placeholder ?? "在这里输入");
  const [errorMessage, setErrorMessage] = useState(existing?.errorMessage ?? "");
  const [resultTemplate, setResultTemplate] = useState(existing?.resultTemplate ?? "你的结果是：{{value}}");
  const [testValue, setTestValue] = useState("");
  const [lastCheck, setLastCheck] = useState<ReturnType<typeof validateProjectInput> | null>(null);
  const [checks, setChecks] = useState({ normal: false, empty: false, abnormal: false });
  const componentId = existing?.componentId ?? "component-user-input";
  const input = {
    id: existing?.id ?? "input-primary",
    componentId,
    name: "primaryInput",
    value: "",
    inputType,
    label,
    placeholder,
    required: true,
    maxLength: inputType === "text" ? 24 : undefined,
    min: inputType === "number" ? 0 : undefined,
    max: inputType === "number" ? 100 : undefined,
    options: inputType === "select" ? ["学习", "运动", "创作"] : undefined,
    errorMessage,
    resultTemplate,
  };
  const run = (value: string) => {
    const check = validateProjectInput(input, value);
    setTestValue(value);
    setLastCheck(check);
    setChecks((current) => ({ ...current, [check.kind]: check.valid || Boolean(check.message) }));
  };
  const save = () => {
    const testItems = [
      testRecord(project, "input-normal", "正常输入", checks.normal, definition.id, checks.normal ? "正常输入已连接结果" : "请测试正常输入"),
      testRecord(project, "input-empty", "空输入", checks.empty && Boolean(errorMessage), definition.id, checks.empty && errorMessage ? "空输入有错误提示" : "请增加错误提示并测试"),
      testRecord(project, "input-abnormal", "过长或超范围输入", checks.abnormal && Boolean(errorMessage), definition.id, checks.abnormal && errorMessage ? "异常输入被拦截" : "请测试异常输入"),
    ];
    const inputComponent = {
      id: componentId,
      pageId: project.pages[0]?.id ?? "page-home",
      type: "input",
      name: label,
      props: { label, placeholder, inputType },
    };
    const outputInteraction = {
      id: "interaction-input-output",
      componentId,
      trigger: "input" as const,
      action: "message" as const,
      config: { resultTemplate, errorMessage },
    };
    onChange(applyToolChanges(project, definition, {
      inputs: replaceById(project.inputs, input),
      components: replaceById(project.components, inputComponent),
      interactions: replaceById(project.interactions, outputInteraction),
      tests: [...project.tests.filter((item) => !testItems.some((test) => test.id === item.id)), ...testItems],
      artifacts: replaceById(project.artifacts, artifact("artifact-input-route", "输入输出路线图", `${label} → 校验 ${inputType} → ${resultTemplate}`)),
    }));
  };

  return (
    <div className="unit-three-builder">
      <section className="builder-card">
        <span className="builder-kicker">信号接收任务</span>
        <h3>选择信号类型，再连接实时结果</h3>
        <div className="signal-tabs">
          {(["text", "number", "select"] as const).map((type) => (
            <button aria-pressed={inputType === type} key={type} onClick={() => setInputType(type)} type="button">
              {type === "text" ? "文字输入" : type === "number" ? "数字输入" : "选择输入"}
            </button>
          ))}
        </div>
        <div className="builder-fields">
          <label>标签<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
          <label>占位语<input value={placeholder} onChange={(event) => setPlaceholder(event.target.value)} /></label>
          <label>结果表达<input value={resultTemplate} onChange={(event) => setResultTemplate(event.target.value)} /></label>
          <label>错误提示<input value={errorMessage} onChange={(event) => setErrorMessage(event.target.value)} placeholder="先留空，测试后补上" /></label>
        </div>
      </section>
      <section className="builder-card builder-lab">
        <div>
          <label>{label}</label>
          {inputType === "select" ? (
            <select value={testValue} onChange={(event) => run(event.target.value)}>
              <option value="">请选择</option>
              {input.options?.map((option) => <option key={option}>{option}</option>)}
            </select>
          ) : (
            <input
              placeholder={placeholder}
              type={inputType}
              value={testValue}
              onChange={(event) => run(event.target.value)}
            />
          )}
          <output className={lastCheck?.valid ? "builder-pass" : "builder-warning"}>
            {lastCheck?.valid ? lastCheck.result : lastCheck?.message ?? "等待输入"}
          </output>
        </div>
        <div className="test-actions">
          <button onClick={() => run(inputType === "number" ? "25" : inputType === "select" ? "学习" : "今天想完成一个好点子")} type="button">测正常输入</button>
          <button onClick={() => run("")} type="button">测空输入</button>
          <button onClick={() => run(inputType === "number" ? "999" : inputType === "select" ? "无效选项" : "这是一段故意超过二十四个字的异常输入内容用于测试")} type="button">测异常输入</button>
        </div>
      </section>
      <section className="builder-card route-map"><b>路线图</b><span>输入 → Zod 结构校验 → 安全规则处理 → 结果 / 错误提示</span></section>
      <button className="primary-save" onClick={save} type="button">保存输入输出路线图</button>
    </div>
  );
}

export function ConditionBuilder({ definition, project, onChange }: ToolProps) {
  const inputId = project.inputs[0]?.id ?? "input-primary";
  const seed = project.conditions.length >= 2
    ? project.conditions.slice(0, 3)
    : [
        { id: "condition-low", inputId, expression: "value < 50", operator: "lt" as const, compareValue: 50, order: 0, whenTrue: "从轻量路线开始", whenFalse: "继续判断" },
        { id: "condition-high", inputId, expression: "value >= 50", operator: "gte" as const, compareValue: 50, order: 1, whenTrue: "进入进阶路线", whenFalse: "请调整输入" },
      ];
  const [conditions, setConditions] = useState<ProjectDocument["conditions"]>(seed);
  const [testValue, setTestValue] = useState("50");
  const [tested, setTested] = useState<string[]>([]);
  const problems = findConditionProblems(conditions);
  const result = evaluateProjectConditions(conditions, testValue);
  const update = (id: string, patch: Partial<ProjectDocument["conditions"][number]>) =>
    setConditions((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const save = () => {
    const boundaryPassed = tested.includes("49") && tested.includes("50");
    const testItems = [
      testRecord(project, "condition-routes", "不同路线", tested.length >= 2, definition.id, tested.length >= 2 ? "已走过不同路线" : "至少测试两个值"),
      testRecord(project, "condition-boundary", "条件边界", boundaryPassed, definition.id, boundaryPassed ? "49 与 50 的边界已验证" : "请测试 49 和 50"),
      testRecord(project, "condition-coverage", "重复和遗漏", problems.length === 0, definition.id, problems[0] ?? "判断表没有明显重复或遗漏"),
    ];
    const interaction = {
      id: "interaction-condition-output",
      componentId: project.inputs[0]?.componentId ?? "component-user-input",
      trigger: "change" as const,
      action: "message" as const,
      config: { conditionIds: conditions.map((item) => item.id).join(",") },
    };
    onChange(applyToolChanges(project, definition, {
      conditions,
      interactions: replaceById(project.interactions, interaction),
      tests: [...project.tests.filter((item) => !testItems.some((test) => test.id === item.id)), ...testItems],
      decisions: replaceById(project.decisions, {
        id: "decision-condition-rule",
        lessonId: "lesson-08",
        toolId: definition.id,
        title: "条件路线解释",
        reason: conditions.map((item) => `如果 ${item.expression}，那么 ${item.whenTrue}`).join("；否则继续下一条"),
        suggestedBy: "student",
        createdAt: now(),
      }),
      artifacts: replaceById(project.artifacts, artifact("artifact-condition-table", "条件表与修复记录", JSON.stringify({ conditions, problems }, null, 2))),
    }));
  };

  return (
    <div className="unit-three-builder">
      <section className="builder-card">
        <span className="builder-kicker">路线分岔任务</span>
        <h3>制作两至三个条件的判断表</h3>
        <div className="condition-table">
          {conditions.map((condition, index) => (
            <article key={condition.id}>
              <b>路线 {index + 1}</b>
              <select value={condition.operator ?? "eq"} onChange={(event) => update(condition.id, { operator: event.target.value as NonNullable<typeof condition.operator> })}>
                <option value="lt">小于</option><option value="lte">小于等于</option><option value="eq">等于</option><option value="gte">大于等于</option><option value="gt">大于</option><option value="includes">包含</option>
              </select>
              <input value={String(condition.compareValue ?? "")} onChange={(event) => {
                const compareValue = condition.operator === "includes" ? event.target.value : Number(event.target.value);
                update(condition.id, { compareValue, expression: `value ${condition.operator === "lt" ? "<" : condition.operator === "lte" ? "<=" : condition.operator === "gte" ? ">=" : condition.operator === "gt" ? ">" : condition.operator === "includes" ? "includes" : "==="} ${event.target.value}` });
              }} />
              <input value={condition.whenTrue} onChange={(event) => update(condition.id, { whenTrue: event.target.value })} />
              <button disabled={conditions.length <= 2} onClick={() => setConditions((current) => current.filter((item) => item.id !== condition.id))} type="button">删除</button>
            </article>
          ))}
        </div>
        <button
          disabled={conditions.length >= 3}
          onClick={() => setConditions((current) => [...current, { id: `condition-${current.length + 1}`, inputId, expression: "value === 75", operator: "eq", compareValue: 75, order: current.length, whenTrue: "进入特别路线", whenFalse: "请调整输入" }])}
          type="button"
        >
          + 添加路线
        </button>
        <p className={problems.length ? "builder-warning" : "builder-pass"}>{problems[0] ?? "没有发现重复或遗漏"}</p>
      </section>
      <section className="builder-card builder-lab">
        <div>
          <label>实时测试值<input value={testValue} onChange={(event) => setTestValue(event.target.value)} /></label>
          <output>{result}</output>
          <button onClick={() => setTested((current) => [...new Set([...current, testValue])])} type="button">记录这条路线</button>
        </div>
        <div className="test-actions">
          {["20", "49", "50", "80"].map((value) => <button key={value} onClick={() => { setTestValue(value); setTested((current) => [...new Set([...current, value])]); }} type="button">测试 {value}</button>)}
        </div>
      </section>
      <section className="builder-card code-panel"><span>半成品逻辑已补全</span><pre>{conditionCode(conditions)}</pre></section>
      <button className="primary-save" onClick={save} type="button">保存条件表与修复记录</button>
    </div>
  );
}

export function StateBuilder({ definition, project, onChange }: ToolProps) {
  const stored = project.state[0];
  const [kind, setKind] = useState<NonNullable<ProjectDocument["state"][number]["kind"]>>(stored?.kind ?? "counter");
  const [label, setLabel] = useState(stored?.label ?? "我的操作进度");
  const initialValue = kind === "counter" ? 0 : kind === "recent-result" ? "" : false;
  const seed: ProjectDocument["state"][number] = { id: stored?.id ?? "state-primary", key: stored?.key ?? "primaryMemory", value: stored?.value ?? initialValue, persistence: "local", kind, label };
  const [trial, setTrial] = useState<ProjectDocument["state"][number]>(seed);
  const [storageReady, setStorageReady] = useState(false);
  const [refreshTested, setRefreshTested] = useState(false);
  const [clearTested, setClearTested] = useState(false);

  const act = () => {
    const action = kind === "counter" ? "increase" : kind === "recent-result" ? "set" : "toggle";
    setTrial((current) => updateStateValue({ ...current, kind, label }, action, "最近完成：路线测试"));
  };
  const clear = () => {
    setTrial((current) => updateStateValue({ ...current, kind, label }, "clear"));
    setClearTested(true);
  };
  const save = () => {
    const nextState = { ...trial, kind, label };
    const testItems = [
      testRecord(project, "state-save", "保存状态", storageReady, definition.id, storageReady ? "保存通道已修复" : "模拟保存失败：请先修复"),
      testRecord(project, "state-refresh", "刷新恢复", refreshTested, definition.id, refreshTested ? "从当前项目恢复成功" : "请执行刷新模拟"),
      testRecord(project, "state-clear", "清空状态", clearTested, definition.id, clearTested ? "状态可以回到空值" : "请测试清空"),
    ];
    onChange(applyToolChanges(project, definition, {
      state: replaceById(project.state, nextState),
      interactions: replaceById(project.interactions, {
        id: "interaction-state-update",
        componentId: project.components[0]?.id ?? "component-action",
        trigger: "click",
        action: "counter",
        config: { stateKey: nextState.key, stateKind: kind },
      }),
      tests: [...project.tests.filter((item) => !testItems.some((test) => test.id === item.id)), ...testItems],
      decisions: replaceById(project.decisions, {
        id: "decision-state-memory",
        lessonId: "lesson-09",
        toolId: definition.id,
        title: "需要记住的数据",
        reason: `${label}需要在刷新后保留，并且只属于项目 ${project.projectId}`,
        suggestedBy: "student",
        createdAt: now(),
      }),
      artifacts: replaceById(project.artifacts, artifact("artifact-state-journey", "数据旅程与记忆测试记录", `操作 → 更新 ${nextState.key} → 保存到当前 ProjectDocument → 刷新恢复 → 可清空；测试状态与正式值分离`)),
    }));
  };
  const memoryTypes = [
    ["counter", "计数"], ["check", "勾选"], ["favorite", "收藏"], ["recent-result", "最近结果"],
  ] as const;

  return (
    <div className="unit-three-builder">
      <section className="builder-card">
        <span className="builder-kicker">记忆核心任务</span>
        <h3>选择这个项目需要记住的数据</h3>
        <div className="signal-tabs">
          {memoryTypes.map(([value, name]) => <button aria-pressed={kind === value} key={value} onClick={() => { setKind(value); setTrial({ ...seed, kind: value, value: value === "counter" ? 0 : value === "recent-result" ? "" : false }); }} type="button">{name}</button>)}
        </div>
        <label className="wide-field">状态名称<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
      </section>
      <section className="builder-card memory-compare">
        <article>
          <b>试运行状态（尚未保存）</b>
          <strong>{String(trial.value)}</strong>
          <button onClick={act} type="button">更新状态</button>
          <button onClick={clear} type="button">删除 / 重置</button>
        </article>
        <article>
          <b>当前项目正式状态</b>
          <strong>{String(stored?.value ?? "尚未保存")}</strong>
          <span>项目：{project.projectId}</span>
          <button onClick={() => { setTrial({ ...seed, value: stored?.value ?? initialValue, kind, label }); setRefreshTested(true); }} type="button">模拟刷新并恢复</button>
        </article>
      </section>
      <section className="builder-card bug-repair">
        <b>保存失败演练</b>
        <span>{storageReady ? "保存通道已连接到当前 ProjectDocument" : "故障：保存通道尚未连接"}</span>
        <button onClick={() => setStorageReady(true)} type="button">修复保存失败</button>
      </section>
      <section className="builder-card route-map"><b>数据旅程</b><span>组件操作 → 受控状态更新 → 当前项目保存 → 刷新恢复 / 清空</span></section>
      <button className="primary-save" disabled={!storageReady} onClick={save} type="button">保存记忆核心与测试记录</button>
    </div>
  );
}
