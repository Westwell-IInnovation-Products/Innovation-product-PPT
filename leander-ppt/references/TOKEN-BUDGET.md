# Token 预算与任务组合

这份规则控制 Leander-PPT 的任务切分和上下文成本。它不降低任何用户检查点、渲染 QA 或终版质量门。

## 预算口径

一个“会话/任务”的累计量等于当前根任务和它派生出的全部子智能体 rollout 的 `total_tokens` 增量。不能只看主任务,也不能用高缓存命中率掩盖累计消耗。

默认阈值写在 `deck.config.js.executionBudget`:

| 阈值 | 默认值 | 行为 |
|---|---:|---|
| `executionStopTokens` | 180,000 | 完成当前有界 job,不再开启新的生产/重读活动 |
| `handoffOnlyTokens` | 220,000 | 只允许确定性验证、账本、handoff 和状态交接 |
| `conversationHardTotalTokens` | 260,000 | 会话合同硬顶;预留的 40,000 不用于新工作 |
| `reservedCompletionTokens` | 40,000 | 失败说明、状态持久化和安全交接余量 |

最近调用平均值、单次超大输入和 compaction 仍是防爆信号,但不能替代累计量。

## 上线方式

默认 `enforcementMode: "report-only"`。工具照常记录 `wouldRotateAtBoundary`,生成预算状态和中文报告,但不因尚未校准的阈值阻塞旧项目。至少用 3–5 份真实 deck 覆盖短、中、长三档后,确认任务能在 220k 前写完 handoff,再改成 `enforce`。

无论哪种模式,rollout 不可读、活跃任务身份不匹配或已有 pending rotation lock 都继续 fail closed。这些是证据完整性问题,不是性能调优项。

## 任务组合

`node tools/task-portfolio.js create` 根据页数创建 3–6 个根任务:

- 短 deck(≤15 页):决策合同;锚点+生产+QA;集成终验。
- 标准 deck(16–30 页):决策合同;锚点+前段;后段+QA/增量 reviewer;集成终验。
- 长 deck:生产段按页数扩到多个 job,但初始组合不超过 `maxPlannedRootTasks`。

调用次数和子智能体次数是 telemetry,没有固定阻塞上限。若当前 job 在 160k 左右仍未接近完成,或单批页数过大,运行:

```bash
node tools/task-portfolio.js split --reason "forecast exceeds safe execution budget"
```

只拆当前 job,不推翻已审批的前序工作。

## 新任务续做

下一轮统一运行:

```bash
node tools/resume-job.js
```

它按顺序完成新任务 attach、`phase-handoff` 哈希校验、严格 context pack 和当前 portfolio job 定位。不要重放完整对话历史。

## 上下文包

`context-pack.js` 默认严格。它先保留 handoff、角色 brief 和角色规范,再按预算装入可选文本;超出的可选项记录在 `omittedReads`,不会静默撑大上下文。只有点名缺失决策或共享依赖变化时才扩大读取。

## QA 与 reviewer

完整逐条证据仍保存在每页 `qa-result.json`。`qa-evidence-index.js --write` 生成轻量索引,只携带页面 verdict、哈希、逐规则 digest、失败/待定 rule ID 和 reviewer delta。

- 首轮 batch reviewer 查看本批 contact sheet,只把风险页打开全尺寸。
- FIX-FIRST 后只传改动页和未闭合 finding。
- 未变化页面复用与当前 render/selection/QA/source digest 匹配的证据。
- 终版全片 reviewer 只在真正完成的集成渲染上运行一次;相同 event digest 禁止重复评审,新的真实 event digest 允许追加运行。

## 观测命令

```bash
node tools/context-budget-gate.js --tail
node tools/token-ledger.js report
node tools/task-portfolio.js status --json
node tools/qa-evidence-index.js --write
```

优化验收看三组数:每个根任务累计 token、每个 job 的 reopen/返工次数、最终质量 Gate。不能只看调用次数,也不能只看总缓存比例。
