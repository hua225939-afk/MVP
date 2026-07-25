import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  EmptyState,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { interactionCatalog } from "@/data/mock/platform-data";

export default function HeadquartersComponentsPage() {
  return (
    <RoleShell roleId="hq">
      <DashboardHeader
        action={{ label: "返回课程结构", href: "/hq/courses" }}
        description="查看当前 LessonRenderer 已支持的可复用互动原子。"
        eyebrow="总部 · 互动组件库"
        title="组件能力一览"
      />
      <DemoNotice>
        本页面只展示现有组件，不提供创建、编辑或删除能力。新增类型需同步更新 Schema、测试和 LessonRenderer。
      </DemoNotice>
      <DashboardPanel
        description={`${interactionCatalog.length} 类组件已接入统一课程渲染链路`}
        title="已支持组件"
      >
        <div className="component-catalog">
          {interactionCatalog.map((component, index) => (
            <article key={component.id}>
              <span className="component-mark">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <small>{component.id}</small>
                <h3>{component.name}</h3>
                <p>{component.purpose}</p>
              </div>
              <span className="component-usage">{component.usedBy}</span>
            </article>
          ))}
        </div>
      </DashboardPanel>
      <DashboardPanel title="待确认组件">
        <EmptyState
          description="样板课确认前，不为课程大纲中的每个模块名称提前创建新组件。"
          title="暂无待开发组件"
        />
      </DashboardPanel>
    </RoleShell>
  );
}
