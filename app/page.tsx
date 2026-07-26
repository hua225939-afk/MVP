import Link from "next/link";
import { brand } from "@/config/brand";
import { demoRoles } from "@/data/mock/platform-data";

export default function Home() {
  return (
    <main className="role-entry">
      <header className="role-entry-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>
            {brand.platformName}
            <small>{brand.platformSubtitle}</small>
          </span>
        </Link>
        <span className="entry-demo-label">
          <i />
          第一阶段演示平台
        </span>
      </header>

      <section className="role-entry-hero">
        <div className="role-entry-copy">
          <span className="eyebrow">✦ 五种角色 · 一套课程数据</span>
          <h1>
            从一个入口，看见
            <br />
            <span>创意编程学习全景</span>
          </h1>
          <p>
            选择一个演示身份进入平台。当前使用集中管理的模拟数据，
            不包含真实登录、数据库或 AI 接口。
          </p>
          <div className="entry-highlights">
            <span>5 个角色视图</span>
            <span>13 节贯通课程</span>
            <span>电脑与平板适配</span>
          </div>
        </div>
        <div className="entry-visual" aria-label="课程平台数据关系示意">
          <div className="entry-orbit">
            <span className="entry-orbit-core">V</span>
            {demoRoles.map((role, index) => (
              <span className={`orbit-role orbit-role-${index + 1}`} key={role.id}>
                {role.symbol}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="role-picker" aria-labelledby="role-picker-title">
        <div className="role-picker-heading">
          <div>
            <span>演示身份入口</span>
            <h2 id="role-picker-title">今天想从哪个视角体验？</h2>
          </div>
          <p>角色切换仅用于产品演示，不构成真实权限认证。</p>
        </div>
        <div className="role-card-grid">
          {demoRoles.map((role) => (
            <Link className={`role-card role-card-${role.id}`} href={role.href} key={role.id}>
              <span className="role-card-symbol">{role.symbol}</span>
              <div>
                <small>{role.audience}</small>
                <h3>{role.name}</h3>
                <p>{role.description}</p>
              </div>
              <span className="role-card-action">进入演示端口 →</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="role-entry-footer">
        <span>{brand.platformName} · {brand.platformSubtitle}</span>
        <p>浅灰白 · 紫色主调 · 模拟数据</p>
      </footer>
    </main>
  );
}
