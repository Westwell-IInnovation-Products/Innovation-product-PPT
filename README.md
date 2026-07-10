# Leander Skills

这个仓库用于维护 Leander 相关的 Codex skills，并通过本机定时任务从本地 skills 目录自动同步到 GitHub。

## 自动同步

同步脚本位于本机：

```text
C:\西井\06AI\sync-codex-skills-to-leander.ps1
```

同步日志位于本机：

```text
C:\西井\06AI\sync-codex-skills-to-leander.log
```

计划任务：

```text
Sync Leander Skills To GitHub
```

当前设置为每周五 18:00 自动同步。电脑需要开机且网络可用，PowerShell 窗口不需要一直打开。

## Skills

| Skill | 用途 |
| --- | --- |
| `axi-front-design` | 以 HTML 为媒介产出高保真设计稿，适合落地页、海报、幻灯片、交互原型、动画和设计系统等视觉设计任务。 |
| `find-skills` | 帮助发现和安装适合某类任务的 Codex skill，适合在不确定该用哪个能力时检索可用 skill。 |
| `humanizer-zh` | 优化中文文本表达，降低 AI 写作痕迹，让内容更自然、更像人工写作。 |
| `leander-ppt` | 使用 Leander PPT 工作流创建、重设计、规范化或润色可编辑 PPTX，适合内部汇报、项目复盘、产品介绍和客户演示。 |
| `pm-roadmap-planner` | 面向产品版本规划与路线图设计，输出里程碑、依赖风险、缓冲策略和阶段成功指标。 |
| `roadmap-planning` | 将战略目标拆解为可执行路线图，覆盖优先级、史诗拆分、干系人对齐和发布节奏规划。 |
| `web-design-engineer` | 构建高质量网页视觉产物，适合页面、仪表盘、原型、动效、数据可视化和浏览器端交互体验。 |
| `web-video-presentation` | 将文章或口播稿制作成点击驱动的 16:9 网页演示，可用于近似视频化的演示内容。 |

## 目录说明

每个目录对应一个独立 skill。自动同步时会以本地目录为准，镜像更新到仓库根目录下的同名目录。
