# 版本历史

本文件记录实际发布或形成可追溯快照的版本。未列出的 beta 序号未形成独立公开版本，不补写不存在的发布内容。

## 0.6.0-beta.23 - 2026-07-28

- 在主题 chrome 审计结果中写入当前 `inputDigest`，确保封面和封底在强制重渲染后也能通过 QA v5 的主题保真证据校验。
- 增加封面、封底跳过内容层审计时仍需保留输入摘要的回归断言。

## 0.6.0-beta.22 - 2026-07-28

- 修复 Gate 1.5 组件候选预览校验：兼容 Windows/LibreOffice 输出的零补位文件名，例如 `slide-01.png`。

## 0.6.0-beta.21 - 2026-07-28

- 为 Leander Base、Base2、Leander Global 增加可执行的 `contentFidelity` 内容层主题档案；档案包含主题特征、推荐原型、禁用模式和 Global 高容量工程页面模式，主题不再只由颜色和 chrome 定义。
- 增加 `verify-theme-fidelity.js`、`theme-fidelity.v1` 页面/自定义构图证据、主题 QA 规则、设计/预检/渲染门禁及 Global 正反例。即使 Global 配色和 chrome 正确，“2×3 空指标卡 + 普通信息卡”仍会被阻塞。
- 在同一共享组件库中增加 `evidenceBoard`、`compactKpiRail`、`engineeringVariableTable`、`deltaCompare` 渲染器，支持 Global 紧凑几何和显式待仿真状态。
- 扩展锚点覆盖：封面/品牌页、截图证据页、数据密集页，以及缺少素材但需要高指标容量的变量/待仿真页；同时更新脚手架同步、迁移文档和回归测试。

## 0.6.0-beta.20 - 2026-07-23

- 切换为单任务模式：一份完整演示文稿在同一个 Codex 任务中生产。`task-portfolio.js` 固定规划一个任务；`deck.config.js` 将 `preferredRootTasks`、`maxPlannedRootTasks` 设为 1，并取消预算阈值。
- 移除 Token 预算上限、任务轮换和活动任务/可观测性失败即阻塞机制。`context-budget-gate.js` 不再因 180K/220K/260K 阈值、轮换锁、INACTIVE-TASK、可观测性或 `[水位]` 提示阻塞；Token ledger 仅保留成本统计用途。
- 用户审批检查点和所有质量门禁保持不变，包括 Gate 0 新鲜度、工具冻结、质量基线、几何审计、用户反馈、来源证据、Agent 回执、终版像素对比以及封面/封底 chrome。
- 精简 `hard-gate-contract.js` 与 `hard-gate-blackbox.js`，移除已退役的预算、轮换和任务绑定断言；同步更新自测及 SKILL、README、TOKEN-BUDGET、FAST-RUN、HARD-GATE、SCAFFOLD 文档。

## 0.6.0-beta.18 - 2026-07-23

- Agent 角色由 6 个精简为 4 个；将 `layout-architect-zh` 合并到 `planner-zh`，使故事/大纲与全稿布局蓝图在同一次规划中完成。
- 移除 `presenter-zh` 独立角色；演讲备注 `speaker-notes.md` 改由主 Agent 交付，保留能力但不再消耗一次独立复核。
- 全链路更新角色触发和事件：`deck.config.js`、`context-pack.js`、`plan-agent-events.js`、`artifact-map.js`、`migrate-agent-collaboration-v3.js`；既有项目的历史证据仍原样保留。
- 从 Skill 阶段地图显式链接 `references/QUALITY-LOCK.md`，避免质量锁文档成为孤立文件。

## 0.6.0-beta.17 - 2026-07-23

- 形成内部 Minimalist/Base3 主题实验快照，验证零圆角、零阴影、细规则线和多信号色工程版式。
- 该实验主题未进入当前公开分享包；当前可用主题以 README 和 manifest 为准。

## 0.6.0-beta.15 - 2026-07-23

- 将增量修订绑定到基线页面哈希和真实差异。
- 将结论绑定到带哈希的来源快照，并闭合渲染与运行时依赖。
- 正式流程证据必须包含用户审批回执和 Agent 执行回执。
- 所有正式验证统一进入失败即阻塞的终版门禁。
- 构建先进入暂存区，再渲染并做像素比对，最后原子发布。
- 草稿构建相互隔离并带水印，不能覆盖正式输出。
- 在渲染器和组件注册合同中区分 `stateFlow.current/currentState` 与 `failed`。
- 组件主导页面可通过 `localExtensionSlots` 显式声明页面级扩展；未声明或孤立的扩展槽会阻塞预检。
- 全尺寸视觉证据与被检查的 PNG 集合建立语义绑定，Agent 回执绑定最终报告，消除循环哈希依赖。
- 渲染多样性证据采用语义哈希，避免生成时间变化使相同渲染集失效。
- 组件注册表增强时继续以 metadata overrides 为权威来源，包括 `stateFlow.currentState` 和 `closing`。
- 对 `tension-bridge` 蓝图家族执行渲染和几何 lint，防止损坏的治理桥绕过预览覆盖。
- `environment-doctor` 的外部工具版本探测增加超时边界；超时、非零退出或空输出均阻塞。

## 0.6.0-beta.14 - 2026-07-23

- 每一页终版 reviewer 证据必须使用与哈希绑定的 `full-size-inspection.v1`。
- 拒绝泛化 QA 观察，要求明确记录对比基数、映射方式或尺度证据。
- 最终 reviewer 必须覆盖当前版本的全部页面。

## 0.6.0-beta.13 - 2026-07-23

- 已验证的 `delta-revision` 可继承此前用户审批：`workflow-gate.js init redesign` 保留 `designTermsState`、`theme`、`layoutBlueprint`、`anchorSample`、`productionMode`，用新 `runId` 重签并记录 `carriedFromRunId`；只重新打开 `plan` 让用户确认修订范围。
- `full-rebuild` 和首次 `create` 仍会重置全部检查点；增量修订复用现有任务组合，不强制重新规划。
- 增加确定性的 `workflow-gate.js --self-test`，纳入回归套件，并在 SKILL 与 `references/REVISION-MODE.md` 中记录审批继承和增量短流程。

## 0.6.0-beta.12 - 2026-07-22

- Token 管理从“最近调用”改为按根任务累计，并计入所有子 Agent；增加 180K 停止执行、220K 仅允许交接、260K 合同上限和 40K 完成预留。
- 新预算策略先以 `report-only` 模式发布；主 Agent 和子 Agent 调用次数仅作为遥测，待真实项目校准后再启用强制轮换。
- 增加 `task-portfolio.js` 自适应规划 3–6 个任务，增加 `resume-job.js` 一键完成 attach、handoff、context 和 job 续接。
- context pack 默认严格校验，并在缺少必要上下文前自动裁剪可选读取项。
- 增加 `qa-evidence-index.js`，reviewer 读取紧凑规则摘要和变更/失败页面范围，不再反复加载全部页面证据。
- 事件规划升级为 V3 的 delta-first reviewer 范围；仅当相同事件摘要被重复复核时才拒绝重复运行。

## 0.6.0-beta.11 - 2026-07-21

- 增加 Base2 内置主题，面向内部机制、证据、状态、治理和决策类演示文稿。
- 增加可复用的圆角、层级、描边和组件样式 Token，同时保留 Leander Base 品牌 chrome 和向后兼容的组件回退。
- 在组件库中注册 Base2，记录其语义颜色与状态 rail 规则，并增加确定性的主题合同回归测试。

## 0.6.0-beta.10 - 2026-07-21

本轮聚焦成本和设计重复，依据 beta.9 首次完整实战数据：20 页团队 Skill 演示文稿共 1,085 次调用、115.8M 输入 Token。

- 解决 SVG 联系表的 Token 陷阱：`render-contact-sheet.js` 会把全部 PNG 以 base64 内联，导致约 2.27 MB、约 568K 文本 Token。`context-pack.js` 改为按文本计算 `.svg` 成本，并让 `visual-designer-zh`、`reviewer-zh` 读取模型可见的 `.png` 联系表；`run-phase.js` 在流程中直接生成 PNG。
- 增加 `primaryShapeClass` 防止渲染轮廓重复。蓝图新增 11 类受控字段；`lint-layout-blueprint.js` 校验复用上限，`render-diversity.js` 强制相同 shape class 页面做并排复核。
- 明确章节生产节奏：章节是编写与 QA 回填单元，页面仍是存储、摘要和增量重渲染单元；不能把整章合并为单一页面目录或 QA 文件。
- FIX-FIRST 后续复核仅读取已变更页面和未关闭问题，不再重新读取整批页面。
- 预算阈值保持 beta.9 的 120K 提醒、180K 规划交接、260K 强制轮换。
- 优化终版复核预算：默认只触发 reviewer，`fullDeckRendered` 不再重复触发 visual-designer 全稿复核；每个打开的事件都会产生一次新的独立复核成本。

## 0.6.0-beta.9 - 2026-07-17

- 根据 beta.8 实战数据（9 个任务、683 次调用、100.65M 原始输入）改为“一项工作一个会话”的节奏，避免混合任务集中消耗上下文。
- 在 `enforceBudget` 内自动记录 Token 检查点，使 `deck.js render/verify/build` 和 `run-phase.js` 自动记录门禁级增量。
- 全流程显示上下文水位：每个 `deck.js` 动作后输出 `context-budget-gate.js --tail` 提示，`run-phase.js` 摘要增加 `watermark` 字段。
- 阈值调整为 120K 提醒、180K 规划交接、260K 强制轮换；Gate 0 同步执行 180K/260K 拒绝规则。
- 增加模型可读的 PNG 联系表和 `tools/zoom-crop.js`，用于像素级重叠核验。
- `run-phase.js status` 不再因固定 3K 的状态 context-pack 预算而阻塞生产级状态文件。

## 0.6.0-beta.8 - 2026-07-16

- 建立当前可发布、仅面向 Codex 的 Innovation-Products_ppt 共享基线。
- 从本地安装版引入失败即阻塞的 Gate、上下文轮换、渲染 QA、风险分级复核、组件注册表 V3 和发布卫生工具。
- 引入团队贡献与 curator 提升试点，但不发布项目状态、原始反馈或渲染证据。
