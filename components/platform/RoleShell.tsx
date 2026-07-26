"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DemoRoleSwitcher } from "@/components/platform/DemoRoleSwitcher";
import { brand } from "@/config/brand";
import { demoRoles, type DemoRoleId } from "@/data/mock/platform-data";
import { roleMessages, roleProfiles } from "@/data/mock/product-shell-data";

export function RoleShell({
  roleId,
  children,
}: {
  roleId: DemoRoleId;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role = demoRoles.find((item) => item.id === roleId)!;
  const profile = roleProfiles[roleId];
  const messages = roleMessages[roleId];
  const [openPanel, setOpenPanel] = useState<"search" | "messages" | "user" | null>(null);
  const activeNav = role.navigation.find((item) => {
    const itemPath = item.href.split("?")[0];
    return (
      itemPath === pathname ||
      (itemPath !== role.href && pathname.startsWith(`${itemPath}/`))
    );
  });
  const pageName =
    pathname.startsWith("/teacher/students/")
      ? "学生详情"
      : activeNav?.label ?? (pathname === "/help" ? "帮助中心" : role.name);

  const togglePanel = (panel: typeof openPanel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

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
        <div className="topbar-page-context">
          <small>{role.name}端</small>
          <b>{pageName}</b>
        </div>
        <button
          aria-expanded={openPanel === "search"}
          className="global-search-trigger"
          onClick={() => togglePanel("search")}
          type="button"
        >
          <span>⌕</span>
          搜索课程、学生或作品
          <kbd>⌘ K</kbd>
        </button>
        <div className="dashboard-topbar-actions">
          <span className="demo-badge">
            <i />
            演示模式
          </span>
          <Link className="topbar-icon-button" href={`/help?role=${roleId}`} aria-label="帮助中心">?</Link>
          <button
            aria-expanded={openPanel === "messages"}
            aria-label="消息预览"
            className="topbar-icon-button"
            onClick={() => togglePanel("messages")}
            type="button"
          >
            ◇
            <i>{messages.filter((item) => item.unread).length}</i>
          </button>
          <button
            aria-expanded={openPanel === "user"}
            aria-label="打开用户菜单"
            className="topbar-avatar-button"
            onClick={() => togglePanel("user")}
            type="button"
          >
            {profile.avatar}
          </button>
        </div>
        {openPanel === "search" && (
          <div className="topbar-popover topbar-search-panel">
            <div className="popover-heading"><b>全局搜索</b><span>演示功能</span></div>
            <label>
              <span>⌕</span>
              <input autoFocus placeholder="试试“第 06 课”或“安安”" />
            </label>
            <p>搜索结果仅展示静态示例，不连接真实学校数据。</p>
            <div className="search-suggestions">
              <Link href={role.href}>返回{role.name}总览</Link>
              {roleId === "teacher" && <Link href="/teacher/students/student-an">安安 · 当前学生</Link>}
              <Link href={`/help?role=${roleId}`}>查看帮助中心</Link>
            </div>
          </div>
        )}
        {openPanel === "messages" && (
          <div className="topbar-popover message-preview-panel">
            <div className="popover-heading"><b>消息预览</b><Link href={`/messages?role=${roleId}`}>查看全部</Link></div>
            {messages.slice(0, 3).map((message) => (
              <Link href={`/messages?role=${roleId}`} key={message.id}>
                <i className={message.unread ? "is-unread" : ""} />
                <span><b>{message.title}</b><small>{message.time}</small></span>
              </Link>
            ))}
          </div>
        )}
        {openPanel === "user" && (
          <div className="topbar-popover user-menu-panel">
            <div className="user-menu-profile"><span>{profile.avatar}</span><div><b>{profile.name}</b><small>{profile.title} · 演示身份</small></div></div>
            <Link href={`/profile?role=${roleId}`}>我的</Link>
            <Link href={`/messages?role=${roleId}`}>消息</Link>
            <Link href={`/settings?role=${roleId}`}>设置</Link>
            <div className="user-menu-switcher"><DemoRoleSwitcher currentRole={roleId} /></div>
            <Link href="/">返回角色入口</Link>
          </div>
        )}
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
              const itemPath = item.href.split("?")[0];
              const active =
                pathname === itemPath ||
                (itemPath !== role.href && pathname.startsWith(`${itemPath}/`));
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
          <Link className="sidebar-user-card" href={`/profile?role=${roleId}`}>
            <span>{profile.avatar}</span>
            <div><b>{profile.name}</b><small>{profile.organization}</small></div>
            <i>›</i>
          </Link>
        </aside>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
