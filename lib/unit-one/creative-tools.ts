import type { ProjectDocument } from "@/lib/projects/project-document";

export const LIFE_SCENES = [
  { id: "study-desk", category: "learning", title: "学习与作业", detail: "书桌上同时放着作业本、计时器和课程表", color: "#315C8C", hotspots: [{ id: "deadline", x: 30, y: 40, question: "任务很多时，怎样知道现在先做哪一项？" }, { id: "focus", x: 72, y: 62, question: "被消息打断后，怎样回到刚才的学习步骤？" }] },
  { id: "campus-hall", category: "campus", title: "校园生活", detail: "公告栏、社团摊位和匆忙经过的同学", color: "#8A5B3D", hotspots: [{ id: "notice", x: 28, y: 34, question: "活动消息很多，怎样快速找到适合自己的？" }, { id: "lost", x: 70, y: 66, question: "失物信息怎样更快找到需要的人？" }] },
  { id: "hobby-corner", category: "interest", title: "兴趣爱好", detail: "相机、球拍、画册和未整理的灵感纸条", color: "#6A4C78", hotspots: [{ id: "ideas", x: 36, y: 38, question: "零散灵感怎样保存并继续发展？" }, { id: "practice", x: 73, y: 61, question: "练习很多次后，怎样看见自己的进步？" }] },
  { id: "habit-morning", category: "habit", title: "日常习惯", detail: "早晨的水杯、书包和出门清单", color: "#426E67", hotspots: [{ id: "forget", x: 34, y: 58, question: "经常忘记的小事，怎样得到不打扰的提醒？" }, { id: "routine", x: 70, y: 32, question: "怎样把复杂的早晨变成几步清楚流程？" }] },
  { id: "family-table", category: "family", title: "家庭生活", detail: "餐桌上的采购便签、药盒和家务安排", color: "#9A604B", hotspots: [{ id: "chores", x: 28, y: 64, question: "家务怎样分配才不会重复或遗漏？" }, { id: "list", x: 72, y: 38, question: "家庭成员怎样一起维护一份清楚清单？" }] },
  { id: "community-park", category: "community", title: "环境与社区", detail: "公园入口、分类垃圾桶和社区留言板", color: "#3E7250", hotspots: [{ id: "waste", x: 31, y: 54, question: "看到环境问题时，怎样记录并邀请大家行动？" }, { id: "help", x: 74, y: 36, question: "邻里互助需求怎样更容易被看见？" }] },
] as const;

export type LifeScene = (typeof LIFE_SCENES)[number];
export type SceneCategory = LifeScene["category"];

export function sceneIllustration(scene: LifeScene) {
  const label = encodeURIComponent(scene.title);
  const detail = encodeURIComponent(scene.detail);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560"><rect width="960" height="560" fill="${scene.color}"/><path d="M0 390 Q180 300 350 390 T700 370 T960 400 V560 H0Z" fill="#F6F0E6" opacity=".9"/><rect x="80" y="90" width="800" height="340" rx="28" fill="#fff" opacity=".14"/><circle cx="180" cy="185" r="58" fill="#F2C078"/><rect x="260" y="145" width="390" height="26" rx="13" fill="#fff" opacity=".86"/><rect x="260" y="195" width="510" height="18" rx="9" fill="#fff" opacity=".45"/><rect x="125" y="315" width="210" height="95" rx="18" fill="#22313f" opacity=".72"/><rect x="380" y="280" width="180" height="130" rx="18" fill="#fff" opacity=".8"/><circle cx="735" cy="330" r="78" fill="#d8e5df"/><text x="80" y="500" font-family="sans-serif" font-size="34" fill="#172033">${label}</text><text x="330" y="500" font-family="sans-serif" font-size="20" fill="#172033">${detail}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function compressImage(
  source: string,
  maxLength = 180_000,
) {
  if (source.length <= maxLength) return source;
  return source.slice(0, maxLength);
}

export function hasStudentEditedIntent(
  draft: ProjectDocument["aiDraft"],
  revision: ProjectDocument["studentRevision"],
) {
  return Boolean(draft && revision && JSON.stringify(draft) !== JSON.stringify(revision));
}

export function unitOneChecks(project: ProjectDocument) {
  return {
    sketchSaved: Boolean(project.sketch.compressedImage || project.sketch.elements.length),
    keywordsSaved: project.keywords.length > 0,
    draftMatches: Boolean(project.aiDraft?.appIntent && project.aiDraft?.problem),
    studentEdited: hasStudentEditedIntent(project.aiDraft, project.studentRevision),
    finalIntentReady: Boolean(project.finalIntent?.appIntent),
    prototypeReady: project.pages.length > 0 && project.structure.length >= 3,
  };
}

export function galaxyIsTooLarge(project: ProjectDocument) {
  return project.scope.mustHave.length > 3 || project.scope.shouldHave.length > 4;
}

