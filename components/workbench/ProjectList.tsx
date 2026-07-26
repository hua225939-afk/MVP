"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { createActiveProject } from "@/lib/projects/project-actions";
import {
  getBrowserProjectRepository,
  PROJECT_UPDATED_EVENT,
} from "@/lib/projects/project-repository";

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const refresh = () => {
    const repository = getBrowserProjectRepository();
    if (!repository) return;
    repository.initializeSeedProject();
    setProjects(repository.list());
    setActiveProjectId(repository.getActiveProjectId());
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener(PROJECT_UPDATED_EVENT, refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PROJECT_UPDATED_EVENT, refresh);
    };
  }, []);

  const createProject = () => {
    const repository = getBrowserProjectRepository();
    if (!repository) return;
    const result = createActiveProject(repository, title);
    router.push(result.workbenchPath);
  };

  const selectProject = (projectId: string) => {
    const repository = getBrowserProjectRepository();
    if (!repository) return;
    repository.setActiveProjectId(projectId);
    setActiveProjectId(projectId);
  };

  return (
    <section className="project-library">
      <div className="project-create-card">
        <div><small>NEW PROJECT</small><h2>新建造物项目</h2><p>每个项目拥有独立的自动保存、测试和版本记录。</p></div>
        <label>
          项目名称
          <input onChange={(event) => setTitle(event.target.value)} placeholder="例如：喝水提醒站" value={title} />
        </label>
        <button disabled={title.trim().length < 2} onClick={createProject} type="button">创建项目</button>
      </div>
      <div className="project-card-grid">
        {projects.length === 0 ? (
          <article className="empty-project-card"><b>还没有本地项目</b><p>先创建一个项目，或从第 1 课保存你的首次作品。</p></article>
        ) : projects.map((project) => {
          const active = activeProjectId === project.projectId;
          return (
          <article
            className={active ? "project-card-active" : "project-card-history"}
            key={project.projectId}
          >
            <div className="project-card-status">
              <span>
                {active
                  ? "当前持续项目"
                  : project.publication.status.startsWith("published")
                    ? "已发布历史项目"
                    : "历史项目"}
              </span>
              {!active && (
                <button
                  onClick={() => selectProject(project.projectId)}
                  type="button"
                >
                  设为当前项目
                </button>
              )}
            </div>
            <h3>{project.title}</h3>
            <p>{project.intent.statement || "尚未填写应用任务"}</p>
            <div className="project-record-counts">
              <span>{project.artifacts.length} 份档案</span>
              <span>{project.tests.length} 条测试</span>
              <span>{project.versions.length} 个版本</span>
            </div>
            <small>
              修订 {project.revision} · 更新于{" "}
              {new Date(project.updatedAt).toLocaleString("zh-CN")}
            </small>
            <div className="project-card-actions">
              <Link href={`/student/projects/${project.projectId}`}>
                查看造物档案
              </Link>
              <Link href={`/student/workbench/${project.projectId}`}>继续创造 →</Link>
            </div>
          </article>
        )})}
      </div>
    </section>
  );
}
