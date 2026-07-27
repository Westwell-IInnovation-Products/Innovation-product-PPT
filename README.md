# Leander Skills

这个仓库是 Leander 相关 Codex Skills 的团队正式源。`main` 和 `leander-ppt-v*` Release 保存经过审核、自动检查和可回滚的稳定版本；个人本地 Skill 不再整目录直接覆盖 `main`。

## Leander PPT 分享版

当前分享版基于 `0.6.0-beta.20`，公开提供 `leander-base`、`base2`、`leander-global` 三个主题。README、安装说明、主题 PPT 和总览图均保存在仓库内，可从下表直接进入。

| 内容 | 链接 |
|---|---|
| 完整使用说明与 Skill 设计思路 | [打开 Leander PPT README](leander-ppt/README.md) |
| 下载、安装位置与首次使用 | [打开 GitHub 使用指南](leander-ppt/docs/GitHub-使用指南.md) |
| `leander-base` | [27 页参考 PPT](leander-ppt/docs/theme-samples/01-leander-base-reference.pptx) · [总览图](leander-ppt/docs/theme-samples/01-leander-base-contact-sheet.jpg) |
| `base2` | [17 页参考 PPT](leander-ppt/docs/theme-samples/02-base2-reference.pptx) · [总览图](leander-ppt/docs/theme-samples/02-base2-contact-sheet.jpg) |
| `leander-global` | [13 页分享样稿](leander-ppt/docs/theme-samples/03-leander-global-sample-13p.pptx) · [总览图](leander-ppt/docs/theme-samples/03-leander-global-contact-sheet.png) |

## Leander PPT 团队共享试点

项目完成后，Leander 的现有 Component Curator 可自动发现复用信号、脱敏抽象并生成候选组件包；本地定时任务再创建独立分支和 Draft PR：

```text
%USERPROFILE%\.codex\leander-contributions\<component-id>\
```

候选进入：

```text
contributions/leander-ppt/components/<github-user>/<candidate-id>/
```

候选通过组件负责人评审、双主题渲染和严格 lint 后，才会晋升到正式扩展组件库。完整制度和操作命令见：

```text
docs/governance/leander-team-sharing.md
```

本机兼容入口仍为 `C:\西井\06AI\sync-codex-skills-to-leander.ps1`。它运行统一团队周期：上传未发布候选、创建贡献 PR，并按允许通道检查和安全安装更新；它不镜像完整 Skill，也不直接推送 `main`。计划任务名称仍为 `Sync Leander Skills To GitHub`。

GitHub Free 私有仓库使用本地安全阀：自动化只允许推送 `agent/*`、`contrib/*`、`promote/*`，一次最多处理 3 个独立复核候选，默认只更新 `stable`。首次使用运行 `team-sharing/scripts/install-safety-guard.ps1`；紧急停止文件为 `%USERPROFILE%\.codex\leander-automation.disabled`，审计日志位于 `%USERPROFILE%\.codex\leander-logs\team-sharing-audit.jsonl`。AI 不合并 PR，`main` 只由人工在 GitHub 页面合并。

## Skills

| Skill | 用途 |
| --- | --- |
| `axi-front-design` | 以 HTML 为媒介产出高保真设计稿，适合落地页、海报、幻灯片、交互原型、动画和设计系统等视觉设计任务。 |
| `find-skills` | 帮助发现和安装适合某类任务的 Codex skill，适合在不确定该用哪个能力时检索可用 skill。 |
| `humanizer-zh` | 优化中文文本表达，降低 AI 写作痕迹，让内容更自然、更像人工写作。 |
| [`leander-ppt`](leander-ppt/) | 使用带检查点的 Leander PPT 工作流创建、重设计、规范化或润色可编辑 PPTX；团队分享版内置三个主题，并附可下载的主题 PPT、总览图和安装指南。 |
| `pm-roadmap-planner` | 面向产品版本规划与路线图设计，输出里程碑、依赖风险、缓冲策略和阶段成功指标。 |
| `roadmap-planning` | 将战略目标拆解为可执行路线图，覆盖优先级、史诗拆分、干系人对齐和发布节奏规划。 |
| `web-design-engineer` | 构建高质量网页视觉产物，适合页面、仪表盘、原型、动效、数据可视化和浏览器端交互体验。 |
| `web-video-presentation` | 将文章或口播稿制作成点击驱动的 16:9 网页演示，可用于近似视频化的演示内容。 |

## 目录说明

每个顶层 Skill 目录对应一个独立 Skill。当前团队共享试点只覆盖 `leander-ppt`；其他 Skill 在试点通过前保持原有人工维护方式。
