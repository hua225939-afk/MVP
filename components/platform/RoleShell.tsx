"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoRoleSwitcher } from "@/components/platform/DemoRoleSwitcher";
import { brand } from "@/config/brand";
import { demoRoles, type DemoRoleId } from "@/data/mock/platform-data";

export function RoleShell({
  roleId,
  children,
}: {
  roleId: DemoRoleId;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role = demoRoles.find((item) => item.id === roleId)!;

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>
            {brand.platformName}
            <small>{brand.platformSubtitle}</small>
          </span>
        </Link>
        <div className="dashboard-topbar-actions">
          <span className="demo-badge">
            <i />
            模拟数据
          </span>
          <DemoRoleSwitcher currentRole={roleId} />
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="role-identity">
            <span className="role-identity-mark">{role.symbol}</span>
            <div>
              <small>当前演示身份</small>
              <b>{role.name}</b>
            </div>
          </div>
          <nav aria-label={`${role.name}端导航`}>
            {role.navigation.map((item) => {
              const active = !item.href.includes("#") && pathname === item.href;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={active ? "sidebar-link sidebar-link-active" : "sidebar-link"}
                  href={item.href}
                  key={item.href}
                >
                  <span>{item.symbol}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span>演示模式</span>
            <p>角色切换只用于体验不同视图，不代表真实身份认证。</p>
          </div>
          <Link className="back-to-roles" href="/">
            ← 返回角色入口
          </Link>
        </aside>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
