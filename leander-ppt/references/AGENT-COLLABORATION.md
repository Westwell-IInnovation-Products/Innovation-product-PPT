# 多 Agent 协作机制

Leander-PPT 把 Agent 作为 Harness 关卡中的专业角色，而不是让多个 Agent 各自拥有一套 PPT。主 Agent 始终负责整合、最终判断和用户沟通。

## 核心原则

- 六个逻辑角色保留：策划师、布局架构师、视觉设计师、组件管理员、质检员、汇报人。
- 生产模式 A/B/C 只决定页面如何生产，不决定哪些角色有效。
- 角色由事件触发，不是每一轮全员重跑。
- 可由脚本确定的错误先跑脚本；Agent 处理需要判断的故事、表达、设计和汇报问题。
- 每个真实角色运行都要有任务 `threadId`、计划动作、阶段、上下文策略、事件摘要、输入摘要哈希、运行 ID、输出文件和输出哈希。事件摘要未变化且仍处于同一阶段时复用同一任务和结论，不因状态字段变化创建新角色。

## 角色与事件

| 角色 | 主要事件 | 主要产物 | 不能代替 |
|---|---|---|---|
| `planner-zh` | 大纲新建、故事线变化 | `outline.md` | 用户确认、视觉设计 |
| `layout-architect-zh` | 页序或布局变化、重新进入蓝图 | `layout-blueprint.md/json` | 正式页面绘制 |
| `visual-designer-zh` | 锚点、主题变化、高视觉风险 | 视觉评审报告或锚点样页意见 | 改写业务事实 |
| `component-curator-zh` | 组件变更、选择置信度低、候选分差过小 | 组件选择/治理报告 | 页面最终验收 |
| `reviewer-zh` | 页面或整套 PPT 已渲染 | `qa-result.json`、质检报告 | 自己修自己批 |
| `presenter-zh` | 用户明确要求演练 | `speaker-notes.md` | 绕过 QA 改页 |

## 事件配置

项目在 `deck.config.js.workflow.events` 记录当前事件：

```js
events: {
  storyChanged: false,
  layoutChanged: false,
  designChanged: false,
  themeChanged: false,
  highVisualRisk: false,
  componentChanged: false,
  lowConfidenceSelection: false,
  renderedPagesReady: false,
  fullDeckRendered: false,
  rehearsalRequested: false
}
```

角色完成当前事件后，应保存证据并关闭对应事件。旧角色报告可以保留，但不能冒充本次事件的结果。

## 阶段放置

```text
Brief / source
  -> 策划师：故事和大纲
  -> 主题 / DESIGN.md：先确定视觉语义边界
  -> 布局架构师：整套蓝图和页面视觉签名
  -> 视觉设计师：高风险蓝图与锚点风格
  -> 组件管理员：低置信页面的路线和组件合同
  -> 主 Agent：按页面合同实现
  -> 质检员：真实渲染证据与动态 QA
  -> 汇报人：最终演练和补充知识
```

标杆样张强制触发视觉设计师；最终交付强制触发质检员；汇报人只在用户明确要求演练时触发。组件管理员只在共享组件变化或明确存疑的选择时触发，不因 Mode A/B/C 改变。

标准 Mode B 的评审基线是锚点阶段视觉设计师一次、真正完成后的集成渲染由质检员一次（contact sheet + 风险页全尺寸）。这不是全局子智能体硬上限:共享设计变化或新的真实 event digest 可以追加角色运行;相同 event digest 的重复运行会被关卡拒绝。蓝图由主 Agent 按 `LAYOUT-BLUEPRINT.md` 清单自查，默认不派子代理评审。增量修复只为当前受影响页面追加评审事件；未变化页面沿用与当前渲染哈希匹配的证据。

## Token 安全输入

角色运行前先生成受限上下文：

```bash
node tools/context-pack.js --mode agent --role reviewer-zh --pages pXX,pYY --write
```

传递给角色的默认内容只有：

- 角色规格 `agents/<role>.md`。
- `role-briefs.md` 中该角色的小节。
- `state/context-pack.json` 或命令输出。
- 受影响页面的合同和 PNG。
- 本次需要做出的明确判断。

不要默认传完整大纲、完整组件目录、所有页面代码、全部历史 QA 和所有角色报告。reviewer 先读 `output/qa-evidence-index.json`,再只打开失败、待定、变化或被点名页面的完整 `qa-result.json`。Contact sheet 用 `--png` 版、通过视觉工具查看；base64 内联的 `.svg` contact sheet 是几十万 token 的文本，禁止按文本读取，也不要放进角色的 `recommendedReads`。角色无法判断时再按 `recommendedReads` 扩展。

FIX-FIRST 复审只传增量：首轮 FIX-FIRST 之后，制作方只改动被点名的页，复审角色**只接收改动页的 PNG 与 page.json，外加上一轮未闭合的 finding**，不重传整批。已经判定干净的页不需要重读——批次级整批重读是本工作流最大的 token 浪费之一。`context-pack.js --mode agent --pages` 只列改动页即可。

## 模型与推理预算

按判断难度路由，不要让所有角色默认使用极高推理：

| 工作 | 建议能力 | 说明 |
|---|---|---|
| 故事、大纲、蓝图、锚点视觉、最终视觉审查 | 高能力 / high | 少量关键判断，允许更深推理 |
| 普通页面实现、局部修复、组件适配 | 平衡型 / medium-high | 受页面合同和锚点约束 |
| 哈希、文件、格式、渲染、机械 QA | 脚本 | 禁止用 Agent 重复解释成功项 |
| 最终汇报演练 | 平衡型 / medium | 只读取大纲、讲稿和 Contact sheet |

若宿主无法显式路由模型，仍要遵守上下文和角色触发边界；不要通过增加并行角色弥补模型差异。

## 证据合同

`agent-collaboration.json` 使用 V3 结构：

旧项目先运行共享 Skill 的 `scripts/sync-scaffold-tools.js <project-root>`。同步器会备份旧文件到 `state/migrations/` 并迁移结构，但不会把旧记录伪装成满足 V3 的新鲜独立审查；缺失的事件摘要、锚点审查或最终审查仍必须真实补跑。

```json
{
  "version": "agent-collaboration.v3",
  "policy": "event-driven.v3",
  "roles": {
    "reviewer-zh": {
      "status": "completed",
      "action": "run-fresh-once",
      "event": "fullDeckRendered",
      "phase": "production-final",
      "threadId": "<codex-thread-id>",
      "forkTurns": "none",
      "contextPolicy": "compact-pack",
      "runId": "review-20260710-01",
      "eventDigest": "<agent event sha256>",
      "inputDigest": "<context-pack sha256>",
      "outputDigest": "<artifact sha256>",
      "artifact": "agent-reviews/reviewer-zh.md",
      "verdict": "SHIP",
      "summary": "...",
      "runs": [{"phase":"anchor-sample","status":"completed","threadId":"<anchor-thread-id>","artifact":"output/review-events/<anchor-review>.md","outputDigest":"<sha256>","verdict":"PASS"}]
    }
  }
}
```

允许状态：`pending`、`completed`、`fallback`、`bypassed`。

- 事件未触发时可以保持 `pending`，不算机制失效。
- 事件已触发的必需角色不能保持 `pending`。
- 最终阶段强制的质检员必须真实独立运行，不能用主 Agent fallback 冒充。视觉设计师只在锚点、主题/设计变化或高视觉风险时触发；汇报人只在明确演练请求时触发；组件管理员未触发时保持 pending 是正常状态。
- 小任务允许 fallback 时，要写明原因、产物和结论。
- `bypassed` 只在配置明确允许且有理由时使用。

运行关卡：

```bash
node tools/verify-agent-collaboration.js
```

运行角色前先执行 `node tools/plan-agent-events.js --write`。`run-fresh-once` 创建 `forkTurns=none` 的新线程，`run-once` 执行一次受限角色任务，`reuse-existing-run` 只复用同阶段且摘要未变化的原 `threadId`，`not-triggered` 保持 pending。

关卡会比较 `state/agent-event-plan.json` 与实际角色的 action、phase、threadId、eventDigest、fork 策略和产物哈希，并拒绝跨角色线程复用。它不能判断意见本身是否高质量，因此质检员和主 Agent仍需阅读真实报告。

## 与生产模式的关系

| 模式 | 页面生产方式 | 角色机制 |
|---|---|---|
| Mode A | 分章节/批次制作和确认 | 事件触发角色照常运行 |
| Mode B | 顺序完成整套后统一 QA | 事件触发角色照常运行 |
| Mode C | 多 Agent 并行生产不同章节 | 生产 Agent 不等于角色评审 Agent；整合后仍按事件跑角色 |

## 失败条件

- 被触发角色仍是 `pending`。
- 声称完成但没有运行 ID、输入摘要、真实产物或输出摘要。
- 用页面生产 Agent 的自检代替独立质检。
- 组件选择置信度低却没有触发组件管理员。
- 整套渲染已变化却沿用旧视觉或 reviewer 报告。
- `rehearsalRequested` 已打开却没有汇报人演练。

## 主 Agent 职责

主 Agent 必须决定当前开放哪些事件、控制角色上下文、整合冲突意见、更新角色证据、运行关卡，并对最终交付负责。
