import type { ProjectRepository } from "./project-repository.ts";

export function createActiveProject(
  repository: ProjectRepository,
  title: string,
) {
  const project = repository.createAndActivate(title);
  return {
    project,
    workbenchPath: `/student/workbench/${project.projectId}`,
  };
}

export function activeProjectWorkbenchPath(
  repository: ProjectRepository,
) {
  const projectId = repository.getActiveProjectId();
  return projectId ? `/student/workbench/${projectId}` : null;
}

export function openProjectForEditing(
  repository: ProjectRepository,
  projectId: string,
) {
  const project = repository.get(projectId);
  if (!project) return null;
  repository.setActiveProjectId(projectId);
  return project;
}
