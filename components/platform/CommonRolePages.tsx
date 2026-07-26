"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { demoRoles, type DemoRoleId } from "@/data/mock/platform-data";
import {
  helpTopics,
  roleMessages,
  roleProfiles,
} from "@/data/mock/product-shell-data";

type CommonPageKind = "profile" | "messages" | "settings" | "help";

function isRole(value: string | null): value is DemoRoleId {
  return demoRoles.some((role) => role.id === value);
}

export function CommonRolePage({ kind }: { kind: CommonPageKind }) {
  const params = useSearchParams();
  const requestedRole = params.get("role");
  const roleId: DemoRoleId = isRole(requestedRole) ? requestedRole : "student";

  return (
    <RoleShell roleId={roleId}>
      <nav aria-label="面包屑" className="dashboard-breadcrumb">
        <Link href={demoRoles.find((role) => role.id === roleId)!.href}>角色首页</Link>
        <span>›</span>
        <b>{kind === "profile" ? "我的" : kind === "messages" ? "消息" : kind === "settings" ? "设置" : "帮助中心"}</b>
      </nav>
      {kind === "profile" && <ProfilePage roleId={roleId} />}
      {kind === "messages" && <MessagesPage roleId={roleId} />}
      {kind === "settings" && <SettingsPage roleId={roleId} />}
      {kind === "help" && <HelpPage roleId={roleId} />}
    </RoleShell>
  );
}

function ProfilePage({ roleId }: { roleId: DemoRoleId }) {
  const profile = roleProfiles[roleId];
  return (
    <>
      <DashboardHeader
        description="查看当前演示身份、组织关系与近期活动。"
        eyebrow={`${profile.title} · 我的 · 演示资料`}
        title="我的资料与工作摘要"
      />
      <DemoNotice>本页不连接真实账号系统；资料编辑、头像上传和密码修改不在本阶段范围。</DemoNotice>
      <section className="profile-hero-card">
        <span className="profile-avatar">{profile.avatar}</span>
        <div>
          <span className="status-chip status-active">{profile.status}</span>
          <h2>{profile.name}</h2>
          <p>{profile.intro}</p>
          <div className="profile-meta">
            <span>角色 <b>{profile.title}</b></span>
            <span>用户编号 <b>{profile.userNumber}</b></span>
            <span>所属 <b>{profile.organization}</b></span>
            <span>最近访问 <b>{profile.recentVisit}</b></span>
          </div>
        </div>
        <button className="button button-secondary" disabled type="button">编辑资料 · 演示</button>
      </section>
      <div className="profile-metric-grid">
        {profile.metrics.map((metric) => (
          <article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.detail}</p></article>
        ))}
      </div>
      <div className="dashboard-columns">
        <DashboardPanel description="由当前角色演示视图生成" title="最近活动">
          <div className="timeline-list">
            {profile.activities.map((activity, index) => (
              <article key={activity}><span>{index + 1}</span><div><b>{activity}</b><small>{index === 0 ? "今天" : "最近 7 天"}</small></div></article>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel description="第一阶段产品边界" title="演示模式说明">
          <ul className="plain-check-list">
            <li>不使用真实登录或实名资料</li>
            <li>项目与学习记录保存在当前浏览器</li>
            <li>消息、通知与编辑资料均为静态演示</li>
          </ul>
          <Link className="button button-secondary" href={`/help?role=${roleId}`}>查看使用帮助</Link>
        </DashboardPanel>
      </div>
    </>
  );
}

function MessagesPage({ roleId }: { roleId: DemoRoleId }) {
  const messages = roleMessages[roleId];
  const [selected, setSelected] = useState(messages[0].id);
  const active = messages.find((message) => message.id === selected)!;
  return (
    <>
      <DashboardHeader
        description="集中查看当前角色会收到的课程、项目与平台消息示例。"
        eyebrow={`${roleProfiles[roleId].title} · 消息中心`}
        title="消息与提醒"
      />
      <DemoNotice>消息内容来自集中演示数据，不提供真实已读同步、推送、回复或删除。</DemoNotice>
      <div className="message-center">
        <section className="message-list-panel" aria-label="消息列表">
          <div className="message-filter-row">
            <button className="is-active" type="button">全部 {messages.length}</button>
            <button type="button">未读 {messages.filter((message) => message.unread).length}</button>
          </div>
          {messages.map((message) => (
            <button
              aria-pressed={selected === message.id}
              className={selected === message.id ? "message-list-item is-selected" : "message-list-item"}
              key={message.id}
              onClick={() => setSelected(message.id)}
              type="button"
            >
              <i className={message.unread ? "is-unread" : ""} />
              <span><small>{message.type} · {message.time}</small><b>{message.title}</b><p>{message.summary}</p></span>
            </button>
          ))}
        </section>
        <article className="message-detail-panel">
          <span className="status-chip">{active.type}</span>
          <h2>{active.title}</h2>
          <small>{active.time} · 演示消息</small>
          <p>{active.summary}</p>
          <div className="message-demo-note">此消息仅用于高保真原型展示，不会发送回复或改变真实已读状态。</div>
          <button className="button button-secondary" disabled type="button">回复 · 演示功能</button>
        </article>
      </div>
    </>
  );
}

const settingGroups = [
  ["账号信息", "演示账号与当前组织", "账号资料由演示身份固定提供"],
  ["外观", "浅色主题 · 标准字号", "主题和字号切换暂不生效"],
  ["通知偏好", "课程、项目与反馈提醒", "不连接真实通知推送"],
  ["学习或教学偏好", "自动保存 · 动效提示", "只展示当前建议状态"],
  ["隐私与数据", "本地项目与学习记录", "数据导出与清除不在本页执行"],
  ["演示模式", "统一演示数据已开启", "角色切换不会模拟真实授权"],
] as const;

function SettingsPage({ roleId }: { roleId: DemoRoleId }) {
  return (
    <>
      <DashboardHeader
        description="查看账号、外观、通知、偏好与本地数据边界。"
        eyebrow={`${roleProfiles[roleId].title} · 设置`}
        title="设置与演示偏好"
      />
      <DemoNotice>控件为静态选中或禁用状态，不修改浏览器设置，也不执行清除数据等危险操作。</DemoNotice>
      <div className="settings-layout">
        <nav aria-label="设置分组">
          {settingGroups.map(([title], index) => <a href={`#setting-${index}`} key={title}>{title}</a>)}
          <a href="#setting-about">关于 Vibe Coding Lab</a>
        </nav>
        <div>
          {settingGroups.map(([title, value, detail], index) => (
            <DashboardPanel description={detail} id={`setting-${index}`} key={title} title={title}>
              <div className="setting-row">
                <div><b>{value}</b><small>演示设置</small></div>
                <label className="static-switch"><input checked disabled readOnly type="checkbox" /><span /></label>
              </div>
            </DashboardPanel>
          ))}
          <DashboardPanel description="当前高保真可交互 HTML 原型" id="setting-about" title="关于 Vibe Coding Lab">
            <div className="metric-notes">
              <p><span>产品版本</span><b>Prototype 0.1</b></p>
              <p><span>课程内容</span><b>5 单元 · 13 课</b></p>
              <p><span>数据模式</span><b>集中演示数据 + 当前浏览器</b></p>
              <p><span>语言</span><b>简体中文</b></p>
            </div>
            <button className="button button-secondary danger-demo" disabled type="button">清除本地数据 · 已禁用</button>
          </DashboardPanel>
        </div>
      </div>
    </>
  );
}

function HelpPage({ roleId }: { roleId: DemoRoleId }) {
  return (
    <>
      <DashboardHeader
        description="了解课程、创造台、测试、发布与教师证据流程。"
        eyebrow={`${roleProfiles[roleId].title} · 帮助中心`}
        title="从这里开始使用平台"
      />
      <DemoNotice>本页为静态帮助中心，不连接在线客服；联系信息为演示占位。</DemoNotice>
      <div className="help-topic-grid">
        {helpTopics.map(([title, description], index) => (
          <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>
        ))}
      </div>
      <DashboardPanel description="点击问题可展开答案" title="常见问题">
        <div className="faq-list">
          <details><summary>为什么教师端不能修改学生项目？</summary><p>教师通过只读项目投影查看证据；评语写入独立平台记录，保护学生项目正文与 revision。</p></details>
          <details><summary>演示消息会发送给真实用户吗？</summary><p>不会。消息来自集中演示数据，不连接推送或回复服务。</p></details>
          <details><summary>作品保存在哪里？</summary><p>第一阶段保存在当前浏览器，并通过 ProjectRepository 统一读写。</p></details>
        </div>
      </DashboardPanel>
      <section className="support-placeholder">
        <div><span>?</span><div><h3>仍然需要帮助？</h3><p>演示支持邮箱：support@example.invalid · 不接收真实工单</p></div></div>
        <button className="button button-secondary" disabled type="button">联系支持 · 演示</button>
      </section>
    </>
  );
}
