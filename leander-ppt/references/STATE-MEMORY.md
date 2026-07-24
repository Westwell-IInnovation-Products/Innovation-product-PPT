# 状态与记忆机制

当 PPT 或 Skill 需要说明跨轮次继续、状态恢复、局部修改和角色交接时使用本文件。

## 事实分层

- `outline.md`：整套故事和页面计划。
- `layout-blueprint.md/json`：整套节奏、页面签名和蓝图合同。
- `pages/<id>/page.json`：单页合同、蓝图引用、视觉路线和 QA Profile。
- `pages/<id>/page.js`：单页实现。
- `pages/<id>/qa-result.json`：当前渲染的机器 QA 证据。
- `pages/<id>/qa.md`：由 QA 结果生成的中文摘要。
- `pages/<id>/out/`：PNG 和组件运行轨迹。
- `checkpoint-status.json`：用户确认和阶段关卡。
- `agent-collaboration.json`：当前事件触发的角色证据。
- `artifact-manifest.md/json`：哪些给用户看，哪些供下一步读取。

页面文件夹默认不再额外创建六七个“记忆文件”。单页状态由 `page.json + page.js + qa-result.json + out/` 共同表达，避免文件数量和上下文重复增长。

## 轻量状态目录

```text
state/
  run-state.json
  decision-log.md
  conversation-summary.md
  issues.json
  context-pack.json        # 只有使用 --write 时生成，并覆盖旧文件
```

- `run-state.json`：当前阶段、当前 Gate、已确认/活跃决策和下一步。
- `decision-log.md`：需要长期保留的决策、原因和影响。
- `conversation-summary.md`：跨轮次继续所需的精简中文摘要。
- `issues.json`：问题复发、提升和归档生命周期。
- `context-pack.json`：某次角色或修复任务的受限输入；默认命令只打印，不生成多个文件。

## 一致性关卡

```bash
node tools/verify-state-memory.js
```

关卡不只检查文件存在，还会核对：

- `workflow.stage` 与 `run-state.currentPhase` 是否一致。
- 进入蓝图、样页或生产前，依赖 checkpoint 是否已批准或有理由地绕过。
- 状态文件是否包含继续任务所需字段。

## 实现口径

页面讲状态和记忆时：

- `implemented` 必须能指向真实文件、脚本或渲染证据。
- `partial` 要说明已实现和未覆盖的部分。
- `proposed` 只能按设计方案表达，不能说成已经自动运行。
