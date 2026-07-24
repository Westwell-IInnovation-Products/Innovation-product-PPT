---
name: leander-ppt
description: "Create, redesign, standardize, review, or polish editable PPTX decks through the mandatory Leander PPT gated workflow. Use for internal presentations, management reports, project reviews, product introductions, customer demos, training materials, slide outlines, PPT review, PPT redesign, reusable PPT templates, or turning source material into a formal editable deck. When invoked, initialize Gate 0 first and never render, build, or deliver a deck by skipping user checkpoints."
---

# Leander PPT

通过分阶段 harness 产出正式、可编辑、可直接演示的 `.pptx` 文档。整条流水线是:需求(brief)→ 大纲(outline)→ 设计/主题约束 → 布局蓝图 → 标杆样张 → 全量生产 → 有证据支撑的渲染 QA → 修复/学习闭环。

本 `SKILL.md` 只是路由。只在当前阶段需要时,才加载对应的详细 reference。

## 强制入口约束

这是可执行的流程策略,不是可选的建议。

1. 每个新的 Leander 任务,都要先用 `node <skill-root>/scripts/init-scaffold.js <project-root> <create|redesign|review>` 初始化一个干净的框架。该命令会复制发布态干净模板、安装锁定版依赖、运行 environment doctor,并创建 Gate 0。Gate 0 仍会拒绝已经很重、已 compact 或不可观测的旧任务,避免在错误基线上开新 deck。如果框架已存在,在出片之前先运行 `npm ci`、`node tools/environment-doctor.js`,再运行 `node tools/workflow-gate.js init <create|redesign|review>`。
2. 每个被恢复(resumed)的项目,先运行 `node <skill-root>/scripts/sync-scaffold-tools.js <project-root>`,再运行 `node tools/workflow-gate.js status`。该 sync 只更新受管的 workflow/QA 工具,把旧版 agent-collaboration 证据迁移到 V3(并留一份审计备份),同时保留项目的 pages、theme、components、config、内容、state 和审批。迁移绝不伪造"新评审"证据:缺失的 V3 事件摘要、agent-run receipt、来源内容哈希,或缺失的锚点/终审独立运行,仍然是阻塞项。从工具报告的 gate 继续;绝不根据旧文件或对话语气推断审批已通过。
   - 对于在 workflow receipt 机制出现之前就创建的旧 Leander 框架,只能迁移到 `outline|blueprint|anchor|production`,并且必须显式提供 `--run-id`、`--receipt-dir` 和迁移说明。`final` 不能直接迁移;迁移后必须重新执行终版门禁。绝不对新任务使用 migrate。
3. 既有 deck 的反馈、改版、润色、增删页或重排默认采用 `delta-revision`,不是整套重做。先读 `references/REVISION-MODE.md`,建立并验证 `state/revision-contract.json` 与逐页 preserve/modify/reorder/delete/add 映射。**当存在已验证的 `delta-revision` 合同时,`workflow-gate.js init redesign` 会把上一轮已批的 `designTermsState`/`theme`/`layoutBlueprint`/`anchorSample`/`productionMode` 结转下来(以新 `runId` 重新签章,并写 `carriedFromRunId` 溯源),只重开 `plan` 让用户确认本轮修订范围(合同 pageMap)——不重走蓝图/主题/锚点,不重跑整片。随后走增量短流水线:只 patch 合同里 `modify`/`add` 的页 → 只重渲这些页 → 只对变化页重做人工 QA → build；但正式终验的机器几何审计始终覆盖全部当前页面，`preserve` 只限制编辑，绝不豁免验证。仅当本轮反馈真的动了主题、共享 token 或共享组件时,才显式重新审批对应检查点并按 Gate 7 扩大重渲;不要用结转蒙混掉一次本该发生的共享重渲。** `full-rebuild` 或首次 `create` 仍然重置全部检查点。只有用户明确表示不沿用原版并留下证据时才允许 `full-rebuild`;在验证通过前不得移动、清空或替换既有 `pages/`。
4. 完整成片(full-deck)请求必须按此顺序推进:brief → 页面 outline → 设计/术语/state → theme → 布局蓝图 → 标杆样张 → production 模式 → 分批/全量生产 → 渲染 QA → 终版 build。
5. 在 `plan`、`layoutBlueprint`、`anchorSample`、`productionMode` 这几处停下来,取得用户的明确审批。先用 `tools/approval-receipt.js create` 把当前 `runId`、宿主提供的 Codex task/message ID、审批消息哈希和被审批产物哈希绑定为 receipt,再运行 `node tools/workflow-gate.js approve <checkpoint> [A|B|C] --receipt <receipt-file> --note "<user confirmation>"`。绝不把 note 本身当审批,也不手工编辑审批状态。`pending`、缺 receipt、产物已变化或来自另一个 `runId` 的审批都无效。
6. 局部请求在其自然 gate 处停止。大纲请求不授权蓝图或生产;预览请求不授权终版 PPTX。
7. 页面的 render、verify、build 只用 `tools/deck.js`。`--draft` 只允许写出带可见水印的 `*.draft.pptx`,不得覆盖正式文件或生成正式交付 receipt;绝不另建一条绕过 gate 的 PPTX 通路。
8. 报告完成之前,运行 `node tools/workflow-gate.js status`、`node tools/run-phase.js render-review`,完成任何由候选采集信号触发的 `component-curator-zh` 独立复核,再运行 `node tools/deck.js verify --final`、`node tools/deck.js build`。非 draft build 必须先通过统一 final gate,在 staging 组装并渲染,逐页与已评审 PNG 做像素比对,完全一致后才原子发布正式 PPTX 并写 `output/final-artifact-receipt.json`。候选包只能进入用户的贡献收件箱,不得由生成它的 Agent 自行晋升到共享组件库。报告当前 gate,以及 `artifact-manifest.md` 中面向用户的交付物。
9. 每个新 deck 都在一个新的 Codex 任务里开始。预算以**当前根任务及其后代子智能体的累计 `total_tokens`**计算:180k 停止开启新重活,220k 只允许验证/写 handoff,260k 是任务合同硬顶,并预留 40k 用于安全收尾。最近调用大小和 compact 仍作为防爆保护。首轮发布默认 `report-only`,记录 `would-rotate` 而不贸然卡死旧项目;经真实 deck 校准后才把 `deck.config.js.executionBudget.enforcementMode` 切为 `enforce`。调用次数和子智能体次数只做观测,绝不设成会让 Skill 跑不动的固定硬上限。精确规则见 `references/TOKEN-BUDGET.md`。
10. 把 [`references/HARD-GATE.md`](references/HARD-GATE.md) 当作精确的强制边界。由其他脚本产出的、删除了 Gate 状态之后产出的、或没有框架 receipt 的终版产物,都不算 Leander 交付。

如果任务还没进入 Leander 框架,正确的下一步是初始化 Gate 0,而不是开始出片。

## 不可妥协项

- 每一次 render、verify、build 都需要一份有效的 `workflow-receipt.json`。不要手工编辑它来绕过 Gate 0。
- `source-evidence-index.json` 必须是 `source-evidence-index.v2`:来源文件/目录/网页快照/宿主消息快照都要落成项目内证据,记录内容 SHA-256 与事实边界;页面通过 `sourceIds`、`claimIds`、`renderSourceIds` 绑定。来源内容或影响渲染的来源发生变化时,旧 QA/渲染摘要必须失效。
- 框架稳定的是流程与证据,不是页面观感。每份 deck 的故事线、信息密度、布局特征、图片配比、组件选择,都要从当前 brief/theme/assets 推导;默认情况下绝不照搬上一份 deck 的页面分配。
- 内容的丰富度是自适应的。密集的机制/证据页可以承载更多细节;聚焦页、转场页、图片主导页、大字号页,在 `whitespaceIntent` 和 `densityRationale` 解释了理由的前提下,可以保留大量刻意设计的留白。
- 任何多页 deck,都要在从 `templates/leander-ppt-scaffold/` 复制出的真实框架里工作。
- 一个文件夹一页:`pages/<id>/{page.js,page.json,qa-result.json,qa.md,out/}`。
- 组件是积木,不是页面模板:每一张内容页都由一个标题带、2-3 个信息区、一个结论带组成;单组件页仅限封面和章节分隔页。只有当图片承载真正的解释价值时,才使用图片槽位。
- 在布局蓝图里为每张内容页声明 `primaryShapeClass`,取值来自受控集合(diamond-fanout、funnel-converge、timeline、grid-matrix、tree-hierarchy、layered-rail、swimlane、radial-hub、evidence-board、big-type、cover)。它比 `skeletonFamily` 更粗,而且不能是自由字符串,这样会渲染成同一形状的页面就会显眼地"雷同",而不是靠各自不同的标签藏起来。声明的 class 必须与页面实际渲染出的形状一致;共享同一 class 的两页必须在真实构图上不同,而不只是把 `visualSignature` 重新贴个标签。`lint-layout-blueprint.js` 会给复用设上限;`render-diversity.js` 会强制同 class 的页面进入必做的并排对比评审(占用率类特征看不出形状 gestalt,所以这是唯一能抓住"两张都是菱形"的守卫)。
- 画内容页之前先跑视觉选路线:`node tools/select-visual-route.js pages/<id>/page.json --write`。
- render 之前先跑中文动态 QA:`node tools/build-qa-profile.js pages/<id>/page.json --write`。
- 用 `node tools/verify-quality-baseline.js` 强制执行可复用的内容/视觉质量底线;字段填全但实质单薄的页面必须判不通过。
- 只有在 quality lock 通过之后才允许省 token。绝不为省 context 而删掉 outline、蓝图、锚点、渲染视觉评审、高风险全尺寸评审,或终版 contact-sheet 评审。
- 在 Gate 0 冻结框架的 workflow 工具。如果某个受管工具在成片过程中发生了变化,停止本次 deck 运行,写出 `state/skill-defect.json`,单独修复/测试共享 Skill,再重新 sync 后继续。
- 对既有 deck,在新的 `redesign` Gate 0、归档现有页面或改变内容基线之前,必须运行 `node tools/revision-mode.js verify`。页数变化、新增/删除页、主题确认或概括性的“继续”都不能单独作为 full rebuild 授权或跨 checkpoint 批准。
- 每张内容页的 `page.js` 都必须导出 `visualBinding: { route, name }`,并与 `page.json.visualSelection.selectedRoute` 一致。若某条组件库路线所绑定的组件在运行时 trace 里不存在,只触发一条评审警告(确认这是不是有意的手工构图),不构成阻塞。
- 主题 chrome 是例外且实行硬绑定：`cover` 必须且只能调用一次 `ui.cover()`，`closing` 必须且只能调用一次 `ui.closing()`；禁止 custom 覆盖、局部扩展和显式 tagline 覆盖。静态页面合同与运行时 trace 任一不符都阻塞 render、verify 和 build。
- 报告质量之前先 render。瞄一眼代码不算 QA。
- 每个 required agent 结论都必须有 `leander-agent-run-receipt.v1`,把 Codex collaboration tool 返回的 thread/run、事件摘要、输入摘要和输出文件哈希绑定起来。手填一个 `threadId` 或只有 Markdown 报告不算独立运行证据。
- 做重大视觉/组件/主题/布局决策时,使用项目级 `DESIGN.md` 和 `visual-direction.md`;`DESIGN.md` 在新建或编辑时要跑 lint。
- 把 `visual-direction.md` 当作项目级的视觉 brief,而不是一个新的 subagent 角色。现有的 `visual-designer-zh` 和主流程会读它;不要另建一个"视觉方向"agent。
- 多 agent 协作时使用项目级 `role-briefs.md`。它把同一个项目目标翻译成 planner/layout/designer/component/reviewer/presenter 各自的指引;它本身不是一个新角色。
- 保持 skill 的 references/templates 通用。项目专属的 deck 标题、页面 ID、当前 workflow 状态、客户名、截图和反馈,应放进项目框架或清楚标注的示例里,而不是通用规则里。
- 编辑共享 Skill 之后,运行 `node templates/leander-ppt-scaffold/tools/lint-scope-hygiene.js --skill-root .`。
- 分发共享 Skill 之前,运行 `node scripts/release-hygiene.js`,不要把生成的 state、渲染证据、私有反馈日志或项目专属示例一并发出去。
- 在 outline/blueprint/page 阶段运行 `node tools/verify-design-gates.js`,以证明设计规则确实存在于可执行产物中,而不仅仅写在散文里。
- 对反复出现框架概念的 deck,把规范术语维护在 `terminology.json`;标题/大纲/蓝图变更后运行 `node tools/verify-terminology.js`。
- 把轻量任务记忆保存在 `state/`;当 deck 讲述 state、memory、恢复或 handoff 时,运行 `node tools/verify-state-memory.js`。
- 每个 phase 输出或反馈轮次之后,用 `node tools/artifact-map.js --write` 更新产物标签;把文件报告为 user-confirm、next-input、internal-evidence、final-output 或 archive-reference。
- 在最终渲染评审中,使用现有 `component-curator-zh` 的提取模式处理候选采集信号。不要为此新增常驻角色,也绝不允许生成候选的 Agent 自行批准正式晋升。
- 在每个已审批的 gate 或 phase 边界(不是每一步)写一次 `state/decision-log.md`、`state/conversation-summary.md`、`state/run-state.json`。`run-phase.js` 已经把每一步的日志保留在 `output/phase-run.log`。
- 交付前修掉明显的重叠、裁切、连接线歪斜、不可读文字、无意义的强调色、无用空白,以及只有文字卡片的页面。
- 每次 render 后运行 `render-geometry-audit.js`。`u.geometry.overlap`、`u.geometry.bounds`、`u.geometry.connector`、`u.geometry.reserved-zone` 的 PASS 必须来自当前 `geometry-audit.json`，不能由 reviewer 手填。
- 把用户指出的 P0/P1 视觉问题登记到 `state/user-feedback.json`；没有新渲染和当前几何/截图证据不得关闭，存在 open 项时禁止终版 build。
- 拒绝在不相关规则之间复用的通用 QA 证据。每一条 PASS 检查都必须写明它的规则、产物/来源、具体位置、方法,以及观察结果或数值结果。
- 不要编造数据、客户说法、落地状态、logo 或外部事实。

## Token 优先入口

对已存在的框架,从一个紧凑的 context 数据包开始:

```bash
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
node tools/phase-handoff.js verify
node tools/task-portfolio.js status --json
node tools/resume-job.js
node tools/environment-doctor.js
```

把数据包里的 `recommendedReads` 作为默认的 context 边界。只有在改动故事线、主题、布局蓝图、共享组件或终版交付 gate 时才扩大。

优先用一次确定性的 phase 调用,而不是很多次模型可见的工具轮次:

```bash
node tools/run-phase.js status
node tools/run-phase.js prepare-pages --pages p01,p02
node tools/run-phase.js page-cycle --pages p01,p02
node tools/run-phase.js render-review
node tools/run-phase.js final-verify
```

`page-cycle` 把路线校验、动态 QA、设计/质量 lint、preflight、增量 render、contact sheet、受影响页 QA 初始化、摘要抓取、产物映射、Token 检查点、context 预算锁决策、handoff 合并成一步。`run-phase.js` 把完整日志留在 `output/phase-run.log`,只返回一条紧凑的 pass/fail/rotate 摘要。不要让模型再复述已经通过的检查。
它还会跑渲染层的占用率、无用空白、相邻几何相似度检查。把 warning 当作"升级到全尺寸评审",而不是自动的美学通过。
只在实现选定页面之前才用 `prepare-pages`。它会保留 `selectionLocked` 和被覆盖的路线;在用户或 curator 审批之后,除非有意重新打开路线本身,否则不要强制重新选路线。

Gate 0 会自动开始 `state/token-ledger.json`。当本地 Codex rollout JSONL 可用时,gate 审批会记录真实的 delta。在 Gate 边界任务轮换之后用 `node tools/token-ledger.js attach-thread`,用 `node tools/token-ledger.js report` 出中文报告。缺失的日志必须保留 `estimated` 标签;绝不用编造的精确值替换它。受保护命令会自动打检查点:deck.js 的 render/verify/build,以及每个 run-phase.js 的 phase,都会记录 token-ledger 检查点(标签 `deck-*` / `phase-*`),无需手工调用。

## 任务组合与会话节奏

Context 成本会累加:每一次模型调用都会把会话已经读过的东西重新携带一遍,所以总花费大致是(context 权重)×(携带它期间发起的调用次数)。用 `task-portfolio.js` 把完整 deck 规划为少量可验收 job,而不是为每个微步骤单独开根任务:

- 16–30 页 deck 默认从 4 个根任务开始:决策合同;锚点+前段生产;后段生产+逐页 QA/增量 reviewer;一次集成终验+build。短 deck 通常 3 个,长/高风险 deck 最多预排 6 个。
- 不是按固定调用次数切任务。工具根据当前 job 页数、累计 token 和变更范围给出 split 建议;只有预测不足时才拆当前 job。`preferredRootTasks` 是起始组合,不是硬门。
- `main <=20 calls`、`subagent <=3` 只能作为仪表盘目标,不能进入阻塞条件。真正阻塞依据是累计 token、质量 Gate、可观测性和任务身份。
- 新任务用 `node tools/resume-job.js` 一次完成 attach、handoff 校验、严格 context pack 和当前 job 定位,不要让用户手工串四条命令。
- 按章(chapter)而不是按页填 QA:把一章的 `page.js` 文件一起读,在同一遍里填它们 `qa-result.json` 的证据,让一章的约束共享一次 context 加载,而不是 N 次单独往返。存储和摘要仍然按页:单页修复时的增量重渲染正是重点,所以绝不要把一章合并成一个文件夹或一个共享的 `qa-result.json`。章是撰写单位,页是存储单位。
- 只重做人类增量评审(delta):一轮 FIX-FIRST 之后,后续人工评审只读真正改动过的页面,再加上正在核验的那几条具体发现。机器几何审计仍在每次正式终验覆盖全部当前页面；门禁/证据 schema 升级会使旧 PASS 失效。
- 每条 `run-phase.js` 摘要都带一个 `watermark` 字段,每个 `deck.js` 动作都以一行 `[水位]` 结尾(累计 180k 停止开新重活 / 220k 只交接 / 260k 合同硬顶)。report-only 阶段会显示 would-rotate;切到 enforce 后才创建阻塞锁。
- 渲染页评审在一个用完即弃的 subagent 里跑,不在主线程:生成 `node tools/render-contact-sheet.js --png`,让 subagent 先读 PNG 表，再用 `view_image` 逐页打开终版当前 PNG 原图；高风险页可用 `node tools/zoom-crop.js` 补充核实。终版 reviewer 必须提交 `full-size-inspection.v2`，为每页记录 geometry、composition、semantics、readability 四类可被像素反证的观察；每条观察带精确 region，geometry 观察绑定当前机器审计哈希和 crop。只看代码、SVG 文本或 contact sheet 不算全尺寸评审。审核者可以把机器 PASS 升级为 FIX-FIRST，但绝不能用自然语言覆盖机器 FAIL。用户点名页和高风险页由主线程再看全尺寸图或 crop。contact-sheet 评审的 context 只有 PNG;绝不要把 base64 内联的 `.svg` contact sheet 交给 subagent(那是几十万 token 的文本大块,模型无法把它当图像读)。
- 多文件排查(gate 失败调试、框架 API 探索)同样适合放进 subagent:在用完即弃的线程里烧 context,只留结论。

## 阶段地图

| 阶段 | 动作 | 必读 |
|---|---|---|
| 快速运行 / 修复 | 用最小 context 续做或修补已有 deck | `references/FAST-RUN.md`,然后 `tools/context-pack.js` |
| 1. Brief | 定义来源、受众、目标、deck 类型、边界 | `references/BRIEF.md` |
| 1. Outline | 规划故事、页面、视觉意图、证据、锚点 | `references/OUTLINE.md` + `references/NARRATIVE-FRAMEWORK.md` + `references/SLIDE-CRAFT.md` |
| 1.1 设计 / 术语 / State | 建立项目设计系统、视觉方向、规范术语、运行记忆 | `references/DESIGN-SYSTEM.md` + `references/VISUAL-COMPOSITION.md` + `references/TERMINOLOGY.md` + `references/STATE-MEMORY.md` |
| 1.3 主题 | 选择 Leander Base / Global 或其他 PPT 安全主题,并定义颜色语义 | `references/THEMES.md` |
| 1.5 布局蓝图 | 在已审批的主题语义内,规划整片节奏、视觉特征、布局约束 | `references/LAYOUT-BLUEPRINT.md` |
| 3. 标杆样张 | 做出 2-3 张真实可编辑的样张并渲染 PNG | `references/SLIDE-CRAFT.md` + `references/VISUAL-COMPOSITION.md` + `references/QA.md` |
| 4. 生产 | 按批或整片实现活跃页面,选视觉路线、render、评审、组装 | `references/PRODUCTION.md` + `references/SCAFFOLD.md` |
| 组件 | 选择/复用/扩展视觉组件 | `references/COMPONENTS.md` + `references/COMPONENT-LIBRARY-DESIGN.md`;先用 `tools/component-index.min.json`,再看 `COMPONENT-CATALOG.md` |
| 图片 | 预留生成/真实图片槽位与 prompt 规格 | `references/IMAGE-ASSETS.md` |
| 动态 QA | 构建页面专属的中文 QA 检查 | `references/DYNAMIC-QA.md` |
| 质量底线 | 检查内容充分性、真实性边界、视觉多样性、可讲性 | `references/QUALITY-BASELINE.md` + `tools/verify-quality-baseline.js` |
| 质量锁(省 token 前置) | 判断哪些节点不可压缩:三层质量与不可省步骤 | `references/QUALITY-LOCK.md` |
| Agents | 协调 planner/layout/designer/component/reviewer/presenter 角色 | `references/AGENT-COLLABORATION.md` + `references/ROLE-GUIDANCE.md` + 相关的 `agents/*.md` |
| 产物 | 区分"用户要审的"和"下一步任务要消费的" | `references/ARTIFACTS.md`;运行 `tools/artifact-map.js --write` |
| 学习闭环 | 记录、分类、提升、归档反复出现的教训 | `references/SELF-EVOLUTION.md` + `references/LESSONS.md` |
| 范围卫生 | 编辑 skill 规则/模板/示例/反馈日志时,不把项目事实泄漏进通用规则 | `references/SCOPE-HYGIENE.md` |

## 检查点与 Gate

用户检查点会让流程停下来等待明确审批。先保存宿主可定位的用户消息快照并生成 receipt:

```bash
node tools/approval-receipt.js create --checkpoint <checkpoint> --run-id <workflow-run-id> --thread-id <codex-task-id> --message-id <codex-message-id> --message-file <message-snapshot> --artifact <approved-artifact> --summary "<approval summary>" --out state/approval-receipts/<checkpoint>.json
node tools/workflow-gate.js approve <checkpoint> [A|B|C] --receipt state/approval-receipts/<checkpoint>.json --note "<user confirmation>"
```

`approval-receipt.js` 能验证本地消息/产物/运行绑定,但在宿主没有 message lookup API 时不能独立证明 opaque ID 的真实性;ID 必须来自 Codex 宿主,不得由 agent 编造。除非用户明确审批且回执可验证,否则不要跳过检查点。

| 用户检查点 | 证据 | 阻塞 |
|---|---|---|
| `plan`(Gate 1) | `brief.md`、`outline.md` 自检通过 | 设计/主题/蓝图工作 |
| `layoutBlueprint`(Gate 1.5) | 紧凑的 `layout-blueprint.md/json` + lint 通过 + 可选的风险页预览 | 标杆样张与生产 |
| `anchorSample`(Gate 5) | 渲染出的可编辑样张 | 全量生产 |
| `productionMode`(Gate 5.5) | 已记录的生产模式 A/B/C | 生产批次与终版 build |

`designTermsState` 和 `theme` 的 receipt 是在途记录的,通常与 outline 或蓝图一起呈现给用户确认。它们在蓝图工作之前,仍然需要一份真实的 `DESIGN.md`、`visual-direction.md` 和主题约束。

其余一切都是在 `run-phase.js` 和 `deck.js verify/build` 内部执行的自动校验:设计硬 gate、视觉选路线、动态 QA、生产 preflight、质量基线、来源内容哈希、运行环境指纹、运行时/QA 证据摘要、渲染 quality lock、agent-run receipt、产物映射、渲染 QA 新鲜度、变更影响和最终 staging 像素锁。它们通过时,报一行摘要;绝不逐条复述已通过的检查。某项失败时,修好它并重跑该 phase 命令;只有当失败信息不足以指导下一步时,才打开对应工具的 reference。

```bash
node tools/run-phase.js status                       # workflow + context pack + artifact map
node tools/run-phase.js prepare-pages --pages p01,p02
node tools/run-phase.js page-cycle --pages p01,p02   # route + QA + render + audits + digests
node tools/run-phase.js render-review
node tools/run-phase.js final-verify
node tools/deck.js build
```

单个工具(`render-quality-gate.js record`、`verify-terminology.js`、`verify-state-memory.js`、`token-ledger.js report`、release/lint 脚本)按需调用;见各阶段 reference。

## Agent 协作

使用事件触发的多 agent 角色。生产模式 A/B/C 不启用或禁用角色;是打开的 workflow 事件在启用它们。主 agent 负责最终整合与用户沟通。

默认角色:

- `agents/planner-zh.md`:故事、大纲、页面意图。
- `agents/layout-architect-zh.md`:整片节奏与布局约束。
- `agents/visual-designer-zh.md`:锚点风格、颜色含义、排版、图片简洁度。
- `agents/component-curator-zh.md`:关系优先的组件复用、视觉路线、拒绝路线的理由。
- `agents/reviewer-zh.md`:渲染 QA、动态 QA、SHIP/FIX-FIRST。
- `agents/presenter-zh.md`:排练流、转场备注、观众困惑点、补充知识。

给 subagent 传:一个 context pack、角色规格、受影响的 PNG/page.json 路径,以及需要它做的确切决策。默认不要传完整 outline、完整目录、完整 QA 和所有历史报告。

对生产型 deck,页面生产 worker 不满足角色评审。标准 Mode B 的基线是锚点 visual designer 一次、整片真正完成后的 reviewer 一次;FIX-FIRST 之后只复审变化页。`output/qa-evidence-index.json` 保存逐规则摘要和 reviewer delta,完整 `qa-result.json` 只在该页失败、待定或被点名时读取。布局蓝图由主 agent 对照 `LAYOUT-BLUEPRINT.md` 检查;默认没有 subagent 评审。component curator 只在共享组件变更、选择明确存在歧义、或最终候选采集发现信号时运行。presenter 只在明确的排练请求下才跑。用 `node tools/plan-agent-events.js --write`;相同 event digest 的结论必须复用,发生真实变化时允许追加运行,不受全局固定次数卡死。

每打开一个 `workflow.events`,就会在此新增一个 fresh-fork 评审角色:fresh 评审会重新读渲染图和角色简报引用的 references、且不共享缓存,所以每多一个角色都是实打实的 token 成本。默认下**终审只有 reviewer**:`fullDeckRendered` 只拉起 reviewer(它已覆盖构图/视觉/配色/形状类缺陷),不再拉 visual-designer(风格在锚点已锁定);visual-designer 只在 design/theme 真的变了、或某页被标 `highVisualRisk` 时才重新参与。presenter 产出的是讲稿,是交付步骤而非质量门,打开它不会"多校一遍 deck",只是多跑一趟。要减少 Mode B 评审趟数,先别打开你不需要那个角色的 event。

每个角色在产出证据之前,都必须读项目 `role-briefs.md` 中属于它自己的那一节。如果没有使用真实 subagent,主 agent 备用时也必须套用该 role brief,并记录这次备用。

## 生产规则

- 使用已审批的 outline、theme、布局蓝图和锚点风格。
- 优先最小单位:单页修复 → 批 → 章 → 整片。
- 在 Mode A 下,设 `workflow.stage = "production-batch"`,只把当前 `activePages` 加入白名单,并写 `batchFileName`;`production` 只用于整合后的终版 deck。
- 当用户不需要逐批视觉审批时,标准 deck 推荐 Mode B。Mode A 留给刻意的按章评审;Mode C 留给真正独立的章节。生产模式仍由用户审批。
- 页面实现之前,先为视觉形态选路线,查看关系/槽位/容量/主题/风险证据以及置信裕度,然后再画。
- 实现/渲染之前运行 `verify-page-preflight.js`;缺失 Image2 prompt 文件或丢失蓝图签名,都是生产阻塞项。
- 把"内容页 100% 全部选用组件库"当作阻塞项,除非记录了明确的通用 override 和逐页理由。
- 在评估过 component-library、external-graphic、image2、page-specific-custom 这几条路线之前,不要用自定义盒子绕开组件库。
- 把组件库维护当作一个单独的临时模式。只在演进共享组件时才运行 `enrich-component-registry`、`build-component-index`、`lint-component-library --strict`,常规页面生产时不跑。
- 共享 token/组件放共享文件;单页专属实现放在该页文件夹内。
- 如果某个共享 token 或组件发生变化,触发 Gate 7。
- 不要报告一堆生成文件。用 `artifact-manifest.md` 把"需要用户确认的文件"和"只喂给下一步的文件"分开。

## 反馈闭环

每次修复都必须:

1. 把反馈映射到页面/组件/token。
2. 修补最小单位。
3. 让 `renderDigest` 重渲染受影响页;只有共享 theme/组件摘要变化才重渲染整片。
4. 只对受影响页重跑 QA。候选路线证据变化、但选定结果不变时,不会使渲染失效;QA/来源变化只使它自己的证据失效。
5. 通过 `tools/issue-registry.js` 记录可复用的问题;项目事实留在项目里。
6. 生成提升候选;只手工提升那些去标识、抽象化、且通过回归测试的规则。

保持 `LESSONS.md` 简短、活跃。不要让无上限的教训清单变成又一个 token 黑洞。

## PPT 默认

- 中文字体:微软雅黑(Microsoft YaHei)。
- 英文/数字:可用时用 Century Gothic。
- 内部/公司 deck:从 `leander-base` 起步。
- 对外/国际/面向客户 deck:从 `leander-global` 起步。
- 需要圆角证据板、状态轨和克制轻阴影的内部机制 deck:优先考虑 `Base2`。
- 需要平直锐角、高信息密度、图形化(彩色卡顶/细线图标/流程箭头/编号时间轴)的评审、商业计划、路演类 deck:优先考虑 `Base3`(极简/MINIMALIST,海军蓝+红+青三色,白底)。
- 红色/天蓝是语义强调色,不是装饰。
- 每张内容页都需要一个真实的视觉解释:图示、图表、图片、时间线、矩阵、dashboard mockup、机制图或等价物。

## 拿不准时

- 新 deck 或新阶段:读该阶段的 reference。
- 已有项目:先跑 `tools/context-pack.js`。
- 选组件:先读 `component-index.min.json`;入围之后再打开 `COMPONENT-CATALOG.md`。
- 输出文件很多:跑 `tools/artifact-map.js --write`,从 `artifact-manifest.md` 报告。
- 修复:只读 `FAST-RUN.md` 和受影响的页面文件。
- 终版交付:先运行 `node tools/deck.js render --force`，确保被评审的 20 页 PNG 与最终 PPTX 使用同一完整组装路径；再运行 `node tools/deck.js verify --final` 和 `node tools/deck.js build`。
