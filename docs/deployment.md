# Cloudflare Workers 独立网站部署

## 1. 当前部署结构

本项目使用 Vinext、Vite 和 Cloudflare Workers：

- `vite.config.ts` 复用现有 `vinext()` 与 `@cloudflare/vite-plugin`；
- `worker/index.ts` 是 Worker 入口，并保留 Vinext App Router 与图片处理；
- `wrangler.jsonc` 声明 Worker 名称、兼容日期、静态资源和 Images 绑定；
- `npm run build` 生成 `dist/client` 与 Worker 构建产物；
- 当前 `vinext@0.0.50` 内置 Cloudflare 部署命令，因此不需要再初始化项目或安装另一套适配器。

配置过程不需要真实登录、数据库、支付或真实 AI。不要在代码、文档、`.env`、`.dev.vars` 或 Git 历史中保存 Cloudflare 凭据。

## 2. Cloudflare 登录

本地终端推荐使用 Wrangler 的浏览器 OAuth 登录：

```bash
npx wrangler login
npx wrangler whoami
```

`wrangler login` 会打开 Cloudflare 授权页面。登录后，从 `wrangler whoami` 的输出确认目标账号。项目没有把账号 ID 写入仓库；部署当前终端会话前，设置账号环境变量：

```bash
export CLOUDFLARE_ACCOUNT_ID="<你的 Cloudflare Account ID>"
```

Account ID 可以从 Cloudflare Dashboard 地址或 `wrangler whoami` 输出取得。不要把真实值写入 `wrangler.jsonc`、文档或提交到 Git。

## 3. 本地检查

安装依赖后运行完整质量检查：

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npx vinext check
```

本地开发：

```bash
npm run dev
```

本地预览 Cloudflare Worker 构建：

```bash
npm run preview
```

默认预览地址以终端输出为准。至少检查：

- `/`
- `/student`
- `/teacher`
- `/parent`
- `/partner`
- `/hq`
- `/messages`
- `/profile`
- `/settings`
- `/help`
- `/learn/vibe-coding-foundations/lesson-01`
- `/learn/vibe-coding-foundations/lesson-13`

最后两条覆盖动态课程路由的首课与末课；13 课继续由同一课程 JSON、`LessonRenderer` 和 `ProjectRepository` 渲染及保存。

## 4. Dry-run

以下命令会重新构建 Worker，并让 Wrangler 编译部署包，但不会发布到 Cloudflare：

```bash
npm run deploy:dry-run
```

它等价于：

```bash
npm run build
npx wrangler deploy --dry-run
```

执行后检查输出中的 Worker 入口、静态资源目录、绑定和包体大小。Dry-run 不等于线上路由验收，也不会创建 `workers.dev` 地址。

## 5. 正式部署

确认登录账号、Account ID、完整检查和 dry-run 都通过后，手动执行：

```bash
export CLOUDFLARE_ACCOUNT_ID="<你的 Cloudflare Account ID>"
npm run deploy
```

`npm run deploy` 使用当前项目版本对应的 `vinext deploy`：先构建，再调用 Wrangler 发布到 Cloudflare Workers。不要在自动化代理或尚未确认账号时执行该命令。

部署完成后，用 Wrangler 输出的 `workers.dev` 地址逐项访问第 3 节列出的路由，并在同一浏览器完成一次课程进度保存、刷新恢复、角色切换和创造台恢复检查。

## 6. 自定义域名

推荐先完成一次 `workers.dev` 部署和路由验收，再添加自定义域名。域名必须位于当前 Cloudflare 账号的有效 Zone 中。

可以在 Cloudflare Dashboard 中进入：

```text
Workers & Pages → 当前 Worker → Settings → Domains & Routes → Add → Custom Domain
```

也可以在 `wrangler.jsonc` 顶层加入：

```jsonc
"routes": [
  {
    "pattern": "app.example.com",
    "custom_domain": true
  }
]
```

把示例域名替换为真实域名后，再运行 `npm run deploy:dry-run` 和 `npm run deploy`。目标主机名不能已有冲突的 CNAME；Cloudflare 会为 Custom Domain 创建 DNS 记录和证书。

## 7. localStorage 版本限制

当前课程进度、学生项目、版本和部分跨角色演示记录保存在浏览器 localStorage：

- 数据只在当前浏览器与当前浏览器资料中可见，不会自动跨设备同步；
- 清除站点数据、使用无痕窗口或更换域名会得到独立存储空间；
- `workers.dev` 与自定义域名属于不同 origin，localStorage 不会自动迁移；
- 多名真实用户不能依赖 localStorage 做账号隔离、协作或权限控制；
- 教师、家长与学生的联动只适合同一浏览器中的演示身份；
- 浏览器容量有限，不适合长期保存大量图片、代码快照或正式业务数据；
- 发布新 Worker 不会主动删除 localStorage，但 Schema 变更仍必须保留项目现有迁移与备份规则。

因此本次部署只提供独立网站运行能力，不把 localStorage 演示版描述为真实多用户平台，也不引入数据库或真实认证。
