import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import {
  InteractionRegistryCatalog,
} from "@/components/platform/RegistryCatalog";
import { RoleShell } from "@/components/platform/RoleShell";
import { interactionMetadata } from "@/lib/interaction-types";
import { courseToolRegistry } from "@/lib/tools/course-tool-registry";

export default function HeadquartersComponentsPage() {
  return (
    <RoleShell roleId="hq">
      <DashboardHeader
        action={{ label: "返回课程结构", href: "/hq/courses" }}
        description="直接读取 LessonRenderer 互动注册表和 13 课创造工具注册表。"
        eyebrow="总部 · 组件库 · 演示数据"
        title="真实注册能力一览"
      />
      <DemoNotice>
        本页面只读展示实际注册项，不维护第二份手写组件清单，也不提供创建、编辑或删除能力。
      </DemoNotice>
      <DashboardPanel
        description={`${Object.keys(interactionMetadata).length} 类互动原子已接入统一课程渲染链路`}
        title="互动组件注册表"
      >
        <InteractionRegistryCatalog />
      </DashboardPanel>
      <DashboardPanel
        description={`${courseToolRegistry.length} 个工具声明课次、字段权限、测试规则和 React 组件`}
        title="创造工具注册表"
      >
        <div className="component-catalog">
          {courseToolRegistry.map((tool) => (
            <article key={tool.id}>
              <span className="component-mark">
                {String(tool.lessonOrder).padStart(2, "0")}
              </span>
              <div>
                <small>{tool.id} · {tool.reactComponent}</small>
                <h3>{tool.name}</h3>
                <p>{tool.projectMutation}</p>
              </div>
              <span className="component-usage">{tool.testRules.length} 条测试规则</span>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </RoleShell>
  );
}
