# Vibe Coding 课程平台 MVP

面向小学高年级与初中生的 JSON 驱动原子化编程课程平台。使用 Next.js、TypeScript、Tailwind CSS 和 Zod 构建。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

质量检查：

```bash
npm run lint
npm run build
```

## 核心结构

```text
app/                         页面与路由
components/course/           课程首页
components/lesson/           课堂布局与 LessonRenderer
components/interactions/     五种原子互动组件
content/lessons/             独立课程 JSON
lib/lesson-schema.ts         Zod 课程结构
lib/lesson-loader.ts         课程读取与验证
lib/progress-storage.ts      localStorage 学习进度
```

## 添加课程

1. 在 `content/lessons/` 新建课程 JSON。
2. 按 `lib/lesson-schema.ts` 的结构填写六个步骤。
3. 在 `lib/lesson-loader.ts` 导入 JSON 并加入 `rawLessons`。

课程加载时会经过 Zod 验证，结构错误会在开发或构建阶段暴露。

## 添加互动组件

1. 在 `lib/lesson-schema.ts` 增加新的带 `type` 字段的 block schema。
2. 在 `components/interactions/` 实现组件。
3. 在 `LessonRenderer.tsx` 增加对应分发分支。

第一版只使用浏览器本地状态，不包含登录、数据库、支付、真实 AI 接口或教师后台。
