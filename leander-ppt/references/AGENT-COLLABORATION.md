# 多 Agent 协作机制

Leander-PPT 把 Agent 作为 Harness 门禁中的专业角色，而不是让多个 Agent 各自拥有一套 PPT。主 Agent 始终负责整合、最终判断和用户沟通。

## 核心原则

- 六个逻辑角色保留：策划师、布局架构师、视觉设计师、组件管理员、质检员、汇报人。
- 生产模式 A/B/C 只决定页面如何生产，不决定哪些角色有效。
- 角色由事件触发，不是每一轮全员重跑。
- 可由脚本确定的错误先跑脚本；Agent 处理需要判断的故事、表达、设计和汇报问题。
- 每个真实角色运行都要有输入摘要哈希、运行 ID、输出文件和输出哈希。

## 角色与事件

| 角色 | 主要事件 | 主要产物 | 不能代替 |
|---|---|---|---|
| `planner-zh` | 大纲新建、故事线变化 | `outline.md` | 用户确认、视觉设计 |
| `layout-architect-zh` | 页序或布局变化、重新进入蓝图 | `layout-blueprint.md/json` | 正式页面绘制 |
| `visual-designer-zh` | 主题变化、高视觉风险、整套渲染完成 | 视觉评审报告或锚点样页意见 | 改写业务事实 |
| `component-curator-zh` | 组件变更、选择置信度低、候选分差过小 | 组件选择/治理报告 | 页面最终验收 |
| `reviewer-zh` | 页面或整套 PPT 已渲染 | `qa-result.json`、质检报告 | 自己修自己批 |
| `presenter-zh` | 用户要求演练，或内部分享进入最终阶段 | `speaker-notes.md` | 绕过 QA 改页 |

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

内部分享在最终阶段默认触发汇报人；所有最终交付默认触发质检员。视觉设计师和组件管理员只在对应事件出现时重跑，不因 Mode A/B/C 改变。

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

不要默认传完整大纲、完整组件目录、所有页面代码、全部历史 QA 和所有角色报告。角色无法判断时再按 `recommendedReads` 扩展。

## 证据合同

`agent-collaboration.json` 使用 V2 结构：

```json
{
  "version": "agent-collaboration.v2",
  "policy": "event-driven.v2",
  "roles": {
    "reviewer-zh": {
      "status": "completed",
      "event": "fullDeckRendered",
      "phase": "post-production",
      "runId": "review-20260710-01",
      "inputDigest": "<context-pack sha256>",
      "outputDigest": "<artifact sha256>",
      "artifact": "agent-reviews/reviewer-zh.md",
      "verdict": "SHIP",
      "summary": "..."
    }
  }
}
```

允许状态：`pending`、`completed`、`fallback`、`bypassed`。

- 事件未触发时可以保持 `pending`，不算机制失效。
- 事件已触发的必需角色不能保持 `pending`。
- 最终阶段的视觉设计师、组件管理员、质检员和汇报人一旦被触发，必须是真实独立运行，不能用主 Agent fallback 冒充。
- 小任务允许 fallback 时，要写明原因、产物和结论。
- `bypassed` 只在配置明确允许且有理由时使用。

运行门禁：

```bash
node tools/verify-agent-collaboration.js
```

门禁会核对角色是否由当前事件触发、输入哈希是否存在、产物是否存在、输出哈希是否匹配。它不能判断意见本身是否高质量，因此质检员和主 Agent仍需阅读真实报告。

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
- 内部分享进入最终阶段却没有汇报人演练。

## 主 Agent 职责

主 Agent 必须决定当前开放哪些事件、控制角色上下文、整合冲突意见、更新角色证据、运行门禁，并对最终交付负责。
