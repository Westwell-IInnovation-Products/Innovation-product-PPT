# 产物标签

当一个 phase 产出很多文件时,或在向用户报告进度之前,使用本文件。

## 目标

每个输出都必须有明确的受众。不要让用户把内部机器输入、QA 证据和最终交付物当作一堆不加区分的东西来查看。

在每个 phase 输出、批量生产、反馈修复或终版交付之后运行:

```bash
node tools/artifact-map.js --write
```

这会创建:

- `artifact-manifest.md`:给用户和主 agent 看的、人类可读的报告。
- `artifact-manifest.json`:给下一步用的、机器可读的 handoff。

## 标签

| 标签 | 含义 | 典型例子 |
|---|---|---|
| `user-confirm` | 用户应在下一个大 phase 之前审阅或审批。 | `outline.md`、`layout-blueprint.md`、contact sheet、预览 PNG |
| `next-input` | 下一步生产/修复/QA/agent 步骤的输入。 | `page.json`、`page.js`、`checkpoint-status.json`、`agent-collaboration.json` |
| `internal-evidence` | 用于调试和审计质量的 render/QA/角色证据。 | `pages/*/qa.md`、`pages/*/out/*.png`、`agent-reviews/*.md` |
| `final-output` | 交付物。 | `.pptx`、最终导出的预览包 |
| `archive-reference` | 长期记忆或原始历史。仅在需要时读。 | `LESSONS-ARCHIVE.md`、反馈日志 |

## 报告规则

向用户报告时,按以下顺序开头:

1. 现在需要用户确认的是什么。
2. 有的话,最终输出是什么。
3. 作为下一步输入保留的是什么。
4. 只作为内部证据生成的是什么。

除非用户要求,否则不要逐一列出每个按页文件。给出 manifest 路径即可。

## Handoff 规则

在下一个任务步骤之前,先读 `artifact-manifest.json` 或 `artifact-manifest.md`。配合 `context-pack.js` 决定要打开哪些文件。

例如:

- 布局评审:只读 `layout-blueprint.md`、预览图,以及任何风险页备注。
- 页面修复:只读受影响的 `page.json/page.js/qa.md`、受影响的 render PNG,以及——仅当 manifest 或 context pack 显示存在共享依赖时——共享组件文件。
- 终版 QA:读最终输出预览、deck 级 QA、角色评审证据,以及——仅对失败或高风险页——页面证据。

## PPT 讲解

当 deck 本身要讲解 Leander-PPT harness 时,把这个机制作为一个小而具体的例子:

- "输出不是一堆文件，而是被标记为确认物、下一步输入、内部证据、最终交付、长期记忆。"
- 在 QA/可观测性或团队协作章节附近,放一张真实的 `artifact-manifest.md` 截图。
- 用 manifest 解释:为什么每个 phase 都能停下来等用户确认,同时不丢失机器可读的 state。
