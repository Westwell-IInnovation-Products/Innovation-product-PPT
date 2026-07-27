# 硬 Gate 约束

Leander 的 Gate 是一组 fail-closed 的流程边界,不是操作系统级的安全沙箱。它约束用户审批、修订范围、来源、运行环境、独立评审与最终产物。(按 token 拆任务/轮换的预算门禁已在单任务模式下退休;Token 账本只度量成本。用户审批与质量门等**该停的地方照旧停**。)

## 强制不变量

- Gate 0 把框架绑定到当前 Codex 根任务(用于成本记账);Token-ledger 初始化是强制的,不是尽力而为。
- Gate 0 拒绝在一个已经很重、已 compact 或不可观测的根任务里建立新基线。
- 单任务模式:Token 账本累计当前根任务及其后代 subagent 的 `total_tokens`,只作**成本度量**——不设上限、不轮换、不换任务,也不因预算创建锁或阻塞任何命令。受保护命令只打成本检查点,然后在交还控制权之前重写紧凑 handoff。
- 检查点审批必须引用 `leander-approval-receipt.v1`;note-only、错误 runId、审批后产物变化或 receipt 文件变化都被拒绝。旧项目不能直接 migrate 到 `final`。
- `delta-revision` 以 `leander-revision-contract.v2` 冻结逐页代码/元数据/素材哈希。终验时 `preserve` 必须零变化,`modify` 必须有真实变化,add/delete/reorder 必须与页面目录一致,且不允许未映射页面。
- Gate 1 必须批准 `leander-requirements-contract.v1`；它绑定原始消息/对话快照、brief、outline、需求处置、页面映射和验收条件。恢复任务前验证 `leander-requirements-coverage.v1` 与合同哈希；production 阻塞缺失的活跃素材需求，final 阻塞任何未覆盖的活跃需求。
- `preserve` 不等于视觉免检。正式终验必须对全部当前页面运行 `render-geometry-audit.v1`；旧 QA/inspection 只有在 render、几何报告和 gate schema 哈希都一致时才可复用。
- 用户登记的 P0/P1 视觉反馈未关闭时，`user-feedback-gate.js` 必须阻塞 `verify --final` 和正式 build。
- `source-evidence-index.v2` 记录来源文件/目录/网页快照/宿主消息快照的实际内容 SHA-256 与边界。来源内容变化会使来源门禁失败,被 `renderSourceIds` 引用时还会使渲染摘要失效。
- Gate 0 与 sync 记录 `state/toolchain-fingerprint.json`;Node、依赖锁、LibreOffice、Poppler、字体路径/版本/哈希等渲染环境变化会使 tool freeze 失效,必须重新确认环境并重渲。
- required agent 事件必须有 `leander-agent-run-receipt.v1`,把 collaboration tool 返回的 task/run、事件/输入摘要和输出文件哈希绑定起来。最终 reviewer 的 full-size inspection 还必须绑定该 agent receipt。
- `deck.js verify --final` 通过统一的 `final-gate.js` 执行全部终版检查。正式 `build` 先写 staging PPTX,在同一工具链中重新渲染并与已评审逐页 PNG 做零差异像素比较;只有通过才替换正式产物并生成 `final-artifact-receipt.json`。
- `build --draft` 只能写带可见水印的 `.draft.pptx`,不得覆盖正式文件或生成终版 receipt。
- 主题 chrome 页面实行纯组件合同：`cover` 角色必须且只能调用一次 `ui.cover()`，`closing` 角色必须且只能调用一次 `ui.closing()`。两者不得改走自定义路线、不得声明 `localExtensionSlots`、不得显式覆盖品牌 tagline；运行时 trace 出现额外 UI 调用时，render、verify 和 build 均阻塞。补充机制、行动或证据必须移到相邻内容页。

## 支持的边界

本约束覆盖强制的 Leander 入口:`workflow-gate.js`、非 status 的 `run-phase.js` 命令,以及 `deck.js render|verify|build`。终版交付必须来自 `deck.js`,并带有效的 workflow/approval/agent/final-artifact receipts、来源证据、当前环境指纹和 QA 证据。

本约束无法阻止一个拥有不受限文件系统访问权的进程去删除 state 文件、改动 Skill 代码、直接编辑页面源码,或另建一条不相干的 PPTX 流水线。那些行为都是流程绕过,会使 Leander 交付失效;一个本地 Node Skill 不是 OS 沙箱,也无法强制 Codex 宿主 UI 终止或创建新任务。approval/agent receipt 中的 opaque Codex ID 必须来自宿主工具结果；如果宿主没有 lookup API,本地 Skill 能证明 ID、消息/事件和文件之间的完整绑定,但不能独立证明该 ID 在宿主真实存在。

## 回归约束

运行:

```powershell
node scripts/regression-tests.js
```

该测试套件必须同时包含 `hard Gate enforcement contract self-test`、进程级的 `hard Gate adversarial black-box self-test` 和 `gate adversarial suite`,针对一个隔离的框架运行:

| 尝试 | 要求结果 |
|---|---|
| 在一个已经很重的历史任务里初始化 Gate 0 | Gate 0 被阻塞并报 `FRESH TASK REQUIRED`;不接受新 receipt |
| note-only 审批、错 runId、审批产物被篡改 | 阻塞 |
| preserve 页被改、modify 页未改、出现未映射页 | 阻塞 |
| 交接只带 revision contract，没有原始 requirements contract；或 plan receipt 没有绑定 requirements contract | 阻塞 |
| 用户要求的真实素材缺失却以模拟图、证据卡或文字降级后继续 production/final | 阻塞 |
| 来源文件或运行环境在证据捕获后变化 | 阻塞或使对应渲染摘要失效 |
| 只有 reviewer Markdown、没有 agent-run receipt | 阻塞 |
| staging PPTX 渲染与已评审 PNG 任意像素不同 | 阻塞;正式 PPTX 不替换 |
| draft build | 只写带水印的 `.draft.pptx`;正式产物和 final receipt 不变 |
| cover 改走 custom、closing 伪装成 scene、空白 tagline、closing 追加内容模块 | render/preflight 阻塞 |
