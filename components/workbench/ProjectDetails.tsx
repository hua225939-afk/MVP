"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { getBrowserProjectRepository } from "@/lib/projects/project-repository";

export function ProjectDetails({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDocument | null | undefined>();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const repository = getBrowserProjectRepository();
      setProject(repository?.get(projectId) ?? null);
      setActive(repository?.getActiveProjectId() === projectId);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [projectId]);

  if (project === undefined) return <div className="project-detail-card">正在读取项目…</div>;
  if (project === null) {
    return (
      <div className="project-detail-card">
        <h2>没有找到这个项目</h2>
        <p>它可能尚未在当前浏览器创建，或已被安全重置。</p>
        <Link href="/student/projects">返回我的作品</Link>
      </div>
    );
  }

  const resetProject = () => {
    if (!window.confirm("确认重置这个项目？当前数据会先保存为本地安全备份。")) {
      return;
    }
    const reset = getBrowserProjectRepository()?.reset(projectId);
    if (reset) setProject(reset);
  };

  return (
    <article className="project-detail-card">
      <div className="project-detail-heading">
        <div>
          <small>{active ? "当前持续项目" : "历史项目"} · PROJECT DOCUMENT</small>
          <h2>{project.title}</h2>
          <p>{project.intent.statement || "尚未填写应用任务"}</p>
        </div>
        <Link href={`/student/workbench/${project.projectId}`}>打开创造台 →</Link>
      </div>
      <dl>
        <div><dt>目标用户</dt><dd>{project.audience.primary || "待定义"}</dd></div>
        <div><dt>生活问题</dt><dd>{project.scenario.problem || "待定义"}</dd></div>
        <div><dt>项目修订</dt><dd>{project.revision}</dd></div>
        <div><dt>测试记录</dt><dd>{project.tests.length}</dd></div>
        <div><dt>造物决定</dt><dd>{project.decisions.length}</dd></div>
        <div><dt>版本快照</dt><dd>{project.versions.length}</dd></div>
      </dl>
      <section><h3>最近造物轨迹</h3>{project.decisions.length === 0 ? <p>还没有决定记录。</p> : project.decisions.slice(-5).reverse().map((decision) => <p key={decision.id}><b>{decision.title}</b><span>{decision.reason}</span></p>)}</section>
      <div className="project-detail-records">
        <section>
          <h3>测试记录</h3>
          {project.tests.length === 0 ? (
            <p>还没有测试记录。</p>
          ) : (
            project.tests.slice(-5).reverse().map((record) => (
              <p key={record.id}>
                <b>{record.name}</b>
                <span>{record.status} · {record.message}</span>
              </p>
            ))
          )}
        </section>
        <section>
          <h3>版本记录</h3>
          {project.versions.length === 0 ? (
            <p>还没有版本快照。</p>
          ) : (
            project.versions.slice(-5).reverse().map((version) => (
              <p key={version.id}>
                <b>{version.label}</b>
                <span>修订 {version.revision}</span>
              </p>
            ))
          )}
        </section>
      </div>
      <div className="project-reset-row">
        <div><b>安全重置</b><small>重置前会在当前浏览器保留一份原始数据备份。</small></div>
        <button onClick={resetProject} type="button">重置项目</button>
      </div>
    </article>
  );
}
