# Token 成本度量（单任务）

Innovation-Products_ppt 是**单任务模式**:整个 deck 在一个 Codex 任务里从头做到尾,不按 token 拆任务、不轮换、无 token 上限。这份文档只说明 Token 账本怎么**度量成本**——它只记账供参考,绝不停下、交接或另开任务。**用户审批检查点、渲染 QA 和终版质量门一律照旧,不受此影响。**

## 成本口径

一个任务的累计成本 = 当前根任务和它派生出的全部子智能体 rollout 的 `total_tokens` 增量。不能只看主任务,也不能用高缓存命中率掩盖累计消耗。`deck.config.js.executionBudget` 里的阈值字段(`executionStopTokens`、`handoffOnlyTokens`、`conversationHardTotalTokens`)现在**只作账本报告的标签**,不再触发任何停止或轮换;`enforcementMode` 不再起强制作用。

## 记账

Gate 0 自动开始 `state/token-ledger.json`。受保护命令(deck.js 的 render/verify/build、每个 run-phase.js phase)自动打成本检查点,无需手工调用。缺失的日志保留 `estimated` 标签,绝不用编造的精确值替换。

```bash
node tools/token-ledger.js report            # 中文成本报告
node tools/context-budget-gate.js --write    # 写出当前累计成本(仅度量)
```

## 任务组合

`node tools/task-portfolio.js create` 现在只规划**一个 job**,覆盖整个 deck(brief → 大纲 → 设计/术语/state → 主题 → 蓝图 → 锚点 → 全量生产 → 渲染 QA → 终验 → build)。不再有 3–6 个根任务、不再 split、不再靠 `resume-job.js` 跨任务续做。

## 任务内省 token（不是拆任务）

省 token 靠下面这些**任务内**的做法,而不是把 deck 拆成多个任务:

### 上下文包

`context-pack.js` 默认严格。它先保留 handoff、角色 brief 和角色规范,再按预算装入可选文本;超出的可选项记录在 `omittedReads`,不会静默撑大上下文。只有点名缺失决策或共享依赖变化时才扩大读取。

### QA 与 reviewer

完整逐条证据仍保存在每页 `qa-result.json`。`qa-evidence-index.js --write` 生成轻量索引,只携带页面 verdict、哈希、逐规则 digest、失败/待定 rule ID 和 reviewer delta。

- 首轮 batch reviewer 查看本批 contact sheet,只把风险页打开全尺寸。
- FIX-FIRST 后只传改动页和未闭合 finding。
- 未变化页面复用与当前 render/selection/QA/source digest 匹配的证据。
- 终版全片 reviewer 只在真正完成的集成渲染上运行一次;相同 event digest 禁止重复评审,新的真实 event digest 允许追加运行。

### 外包子代理

渲染页评审、多文件 gate 调试放进用完即弃的 subagent:在它的线程里烧 context,只把结论带回主线程。
