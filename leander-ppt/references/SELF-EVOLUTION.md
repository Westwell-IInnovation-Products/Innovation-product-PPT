# 自进化机制

这份文件定义 Leander-PPT 如何把用户反馈转化为可复用规则，并防止问题越积越多、token 越用越重。

## 目标

自进化不是“把所有问题都记下来”，而是把问题变成可执行的生产约束：

```text
用户反馈 -> 问题归因 -> 抽象规则 -> 进入检查清单/组件/流程 -> 持续观察 -> 稳定后归档
```

## 问题分级

| 等级 | 含义 | 示例 | 处理方式 |
|---|---|---|---|
| P0 硬错误 | 任何人都能确认的错误 | 文字重叠、线条歪、内容溢出、真实文件结构画错 | 必须立即修复，进入 QA 硬规则 |
| P1 表达错误 | 页面关系或组件选择不对 | 该用流程图却用了卡片堆叠，工具系统没有讲清调用逻辑 | 修复页面路线，必要时反补组件/选择规则 |
| P2 设计质量问题 | 看起来不够专业或 AI 味明显 | 图形太单调、色彩无意义、卡片感太重、图标语义弱 | 进入设计规则或组件改造 |
| P3 偏好/项目规则 | 用户或项目特有偏好 | 封面标题位置、某部门模板偏好 | 写入项目规则，不一定进入公共 skill |

## 问题状态

每个可复用问题应该有生命周期：

```text
new -> active -> promoted -> stable -> archived
```

- `new`：刚出现，先记录在当前项目的 `state/feedback-log.md`。
- `active`：出现 2 次以上，或一次就明显通用，进入当前检查集。
- `promoted`：已经写入 `QA.md`、`PAGE-DESIGN-METHOD.md`、组件规则或工具脚本。
- `stable`：连续多个项目或多轮 QA 未再出现，保留但不放在高频检查区。
- `archived`：只在历史日志中保留，不再每次读取。

## 抽象规则

反馈进入公共 skill 前，必须先判断它属于哪一类：

1. **页面特例**
   - 只影响当前页。
   - 写入该页 `qa.md`，不进入公共 `LESSONS.md`。

2. **同类页面问题**
   - 会影响某类关系页面，如流程、状态、工具系统、架构。
   - 写入 `DYNAMIC-QA.md` 的关系检查项。

3. **组件问题**
   - 某个组件反复出现布局、字号、对齐、图标问题。
   - 优先修组件或组件元数据，不只修单页。

4. **流程问题**
   - 比如跳过大纲确认、跳过蓝图、没有重跑 QA。
   - 写入 `SKILL.md` gate 或 `PRODUCTION.md`。

5. **通用设计问题**
   - 比如颜色无意义、文字压线、image2 太复杂。
   - 写入 `QA.md`、`PAGE-DESIGN-METHOD.md` 或 `SLIDE-CRAFT.md`。

## 进入 LESSONS 的条件

满足任一条件即可进入 `LESSONS.md`：

- 同类问题出现 2 次以上。
- 问题虽只出现一次，但属于 P0 硬错误。
- 问题会影响多个组件或多个 deck。
- 问题可以被 QA 从渲染图或页面契约中明确检查。

不要进入 `LESSONS.md` 的情况：

- 只属于一个项目的业务内容。
- 只属于某个用户的临时表达偏好。
- 无法转化为检查动作的模糊感受。

## 消除与归档机制

`LESSONS.md` 不应无限增长。

每隔一段时间或当 `LESSONS.md` 过长时，做一次整理：

1. 合并重复规则。
2. 把已写入 `QA.md` / `SLIDE-CRAFT.md` / 组件代码的规则标记为 `promoted`。
3. 连续 3 个完整 deck 未再出现的问题，降级为 `stable`。
4. 长期稳定的问题移入归档说明，只在 deep QA 或相关组件修改时读取。

原则：高频问题留在 active，低频稳定问题归档，避免每次运行都读取所有历史。

## 记录格式

每条反馈日志建议包含：

```markdown
### YYYY-MM-DD - <问题标题>
- 等级：P0/P1/P2/P3
- 状态：new/active/promoted/stable/archived
- 触发场景：<页面类型/组件/流程>
- 原始反馈：<用户原话或摘要>
- 根因：<为什么发生>
- 修复：<本次怎么改>
- 抽象规则：<以后如何避免>
- 进入位置：page qa / LESSONS / QA / component / SKILL gate / archived
```

## 完成标准

一次修复只有在以下事项完成后，才算真正结束：

- 页面或组件已修复。
- 已重新渲染并 QA。
- 问题已判断为“页面特例 / 通用规则 / 组件规则 / 流程规则”。
- 需要沉淀的规则已写入对应位置。
- 不需要沉淀的问题已明确留在项目内，不污染公共 skill。

## 可执行生命周期

项目脚手架使用 `state/issues.json` 保存结构化问题，并通过以下命令维护：

```bash
node tools/issue-registry.js status
node tools/issue-registry.js record --severity P1 --category component --scope relationship-page --summary "..." --root-cause "..." --evidence "..."
node tools/issue-registry.js observe --id <issue-id> --result recurrence
node tools/issue-registry.js observe --id <issue-id> --result clean
node tools/issue-registry.js proposals
```

`proposals` 只生成稳定名称的 `output/learning-proposals.json/md`。它不会自动修改共享 Skill。

完整 PPT 在 `run-phase.js render-review` 后还会运行 `candidate-harvest.js --write`。它只收集三类可复用信号：页面专属自定义路线、需要 Curator 复核的低置信选型、以及重复出现的组件问题。现有 `component-curator-zh` 负责把信号转为 `submit / skip / observe`，不创建新的常驻 Agent。

只有写入 `state/component-candidate-proposals.json`、完成脱敏抽象、具备独立复核摘要并提供真实 `{ name, create }` 渲染器的 `submit` 提案，才会在 `final-verify` 时物化到个人候选收件箱。物化仍只产生 `review-required` 候选；自动化不得修改正式注册表或把状态改成 `usable`。

人工提升必须满足：

1. 已去掉项目名、页码、客户、截图路径和当前故事线。
2. 已抽象为页面关系、表达模式、组件能力、QA 风险或流程门禁。
3. 已指定进入 `QA`、组件元数据、流程 gate 或其他通用位置。
4. 已有失败夹具或历史问题证明规则会触发，并有回归证明不会误伤其他场景。

使用 `promote` 只改变项目问题状态；真正进入共享 Skill 仍需要人工修改和回归：

```bash
node tools/issue-registry.js promote --id <issue-id> --target DYNAMIC-QA --abstraction "<脱敏后的通用规则>"
```

规则连续 3 次干净运行后进入 `stable`，连续 6 次后进入 `archived`。`stable/archived` 不进入默认轻量上下文，只在相关组件修改或深度 QA 时读取。
