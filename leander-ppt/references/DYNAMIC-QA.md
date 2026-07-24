# 动态 QA 机制

这份文件定义 Leander-PPT 的“活动 QA”：每页不只检查通用规则，还要根据页面意图、关系类型、视觉路线和组件特征生成针对性检查项。

## 核心原则

QA 由四层组成：

```text
通用 QA + 页面关系 QA + 视觉路线 QA + 页面内容 QA
```

通用 QA 负责所有页面的底线；动态 QA 负责检查“这一页本来要表达的东西有没有表达对”。

## 每页 QA Profile

每个内容页的 `page.json` 使用紧凑 QA 合同。通用规则不复制到每一页，只保存规则集 ID 和页面特例：

```json
{
  "qaProfile": {
    "version": "qa-profile.zh.v2",
    "rulesVersion": "qa-rules.zh.v2",
    "scope": "content-page",
    "relationship": "sequence",
    "selectedRoute": {"route": "component-library", "name": "pipelineFlow"},
    "blueprintRef": "layout-blueprint.json#pXX",
    "componentRef": "tools/component-index.min.json#pipelineFlow",
    "ruleSets": ["universal", "relationship.sequence", "route.component-library", "blueprint.contract"],
    "pageRules": [],
    "requiredEvidence": ["render-sha256", "visual-location", "component-trace"]
  }
}
```

可使用框架工具生成：

```bash
node tools/build-qa-profile.js pages/<id>/page.json --write
```

## 蓝图一致性 QA

如果页面存在 `blueprintContract` 或来自 `layout-blueprint.json` 的蓝图合同，动态 QA 必须增加以下中文检查项：

- 最终页面是否符合蓝图里的 `visualSignature`，而不是退回成粗糙的通用模板。
- 实际使用的组件是否来自精确 `candidateComponents`，图形意图是否符合 `patternHints`；如果不是，是否有明确 override 原因。
- 页面是否避开了 `avoidSignatures` 中标记的重复或错误版面结构。
- 页面复杂度是否符合 `complexityBudget`，没有把低复杂度页做成密集机制图。
- 页面是否保持了蓝图定义的前后页承接关系和故事角色。

蓝图一致性不是为了锁死设计，而是为了避免后续制作阶段重新猜页面结构。允许调整，但调整必须可解释、可记录、可 QA。

## 通用 QA

所有页面都检查：

- 没有文字、图形、箭头、图片重叠。
- 没有内容超出页面或被裁切。
- 字号层级清楚，同级文字字号一致。
- 中英文主题字体一致，英文和数字不混用多个字体。
- logo、背景、页脚、标题线符合主题。
- 颜色有明确含义，不做无意义彩虹色。
- 页面主体不是纯文字卡片，必须有真实视觉解释。
- 留白是有意设计，不是内容贴顶部后下方空一大块。
- 底部总结条、方框、卡片必须承担结论、分组、证据、状态或选中含义；没有作用就删除。
- 结论、证据、状态边界不虚构。

## 术语一致 QA

如果项目存在 `terminology.json`：

- 页面标题、架构图、导航标签和总结语必须使用 canonical terms。
- forbidden aliases 出现时必须修正，除非它们只是括号中的解释性小字。
- 同一个 Harness 能力不能在不同页面换不同叫法。
- 一层框架名和二层机制名要能对应，不能标题写“状态和记忆”但正文讲“约束与恢复”。

## 实现真相 QA

当页面讲机制、工具、文件、目录、agent、QA、状态或自动化流程：

- `implemented` 必须能指出真实文件、脚本或渲染证据。
- `partial` 必须说明已经有哪一部分，缺哪一部分。
- `proposed` 必须使用设计/建议口径，不能说成已落地。
- 涉及现代公司、公开产品、行业案例或最新资料时，必须有来源边界，不凭记忆写事实。

## 截图槽位 QA

如果 `page.json` 或蓝图声明 `screenshotSlots`：

- 截图槽位尺寸要足够，不能把真实文件截图压成不可读装饰。
- 每个截图槽位要有 source、crop rule、redaction 判断和 explanation anchor。
- 截图旁边必须解释它证明什么。
- 截图页仍要有页面结构，不允许整页变成操作手册。

## 关系类型 QA

### sequence 流程 / 阶段

- 是否能看出起点、阶段、终点。
- 箭头方向是否清楚，直线是否真的直。
- 每一步的角色、输入、产出是否明确。
- 如果需要人工确认，确认点是否被标出来。

### state 状态 / 记忆 / 隔离

- 是否说明原问题和状态机制之间的关系。
- 是否表达“当前状态 / 局部隔离 / 可恢复”。
- 如果展示文件夹或状态文件，是否和真实结构一致。
- 修改影响范围是否被控制在最小单元。

### toolbox 工具系统 / 组件库

- 是否不是简单罗列工具，而是说明工具如何被调用。
- 是否区分主题库、组件库、外部图形、图片工具等类别。
- 图标是否能看出对应工具类型。
- 是否讲清楚选择逻辑：页面意图 -> 表达形式 -> 工具/组件。

### system-map 架构 / 模块

- 是否讲清模块、输入、输出、依赖关系。
- 是否区分真实已实现结构和概念架构。
- 模块数量是否可读，是否避免堆太多框。
- 中心节点或主路径是否明确。

### hierarchy 层级 / 树

- 父子层级是否一眼可见。
- 连线是否正交或有明确曲线逻辑。
- 展开项是否对齐，层级标签是否一致。

### contrast 对比 / 前后

- 左右或上下对比项是否同尺度。
- 问题与解决机制是否一一对应。
- 高亮是否有意义，不只是装饰。
- 结论是否从对比中自然得出。

### evidence 证据 / 数据

- 数据来源和边界是否明确。
- 图表类型是否匹配数据关系。
- 数字是否可读，单位是否完整。
- 是否避免无来源的夸大结论。

### scene 场景 / 图片

- 图片是否承担真实信息，而不是装饰。
- image2 是否足够简单，没有小字、复杂流程、混乱细节。
- 图片是否和 PPT 背景融合，不像硬贴白卡。
- 如果是外部图，来源和边界是否清楚。

### cover / closing 主题 chrome

- `cover` 必须使用所选主题的 `ui.cover()`，`closing` 必须使用 `ui.closing()`；这是机器硬门禁，不由 reviewer 的自然语言 PASS 覆盖。
- chrome 页面必须是纯主题组件：不得通过 `page-specific-custom` 重画，不得声明局部扩展槽，也不得在组件之后追加行动、证据或解释模块。
- 品牌 tagline 由主题继承，页面不得显式覆盖，更不能用空字符串、普通空格或 NBSP 隐藏。
- 封面和尾页的人工 QA 仍要检查标题层级、Logo、页脚、中心口号、标语可见性与结束留白；机器只能证明组件调用合同，不能替代看图。

### decision 决策 / 判断

- 判断标准是否明确。
- 推荐项或结论是否突出。
- 是否展示取舍，而不是只有结论。
- 是否避免伪打分或无依据排序。

### lifecycle 闭环 / 演进

- 是否能看出循环方向或演进路径。
- 反馈、迭代、积累的位置是否明确。
- 是否说明从一次任务到长期能力的变化。

## 视觉路线 QA

### component-library

- 实际页面是否真的使用了所选组件或明确改造版本。
- 是否有更合适的近似组件被跳过。
- 组件是否被硬套；如果只需要局部，应拆成 layout block 或 visual part。

### external-graphic

- 是否有真实来源。
- 图片/截图/地图是否清晰。
- 是否用标注说明图中重点。
- 是否保留敏感信息边界。

### image2 / imageSlot

- 是否有 prompt-spec。
- 图片是否只承担一个核心意象或场景。
- 不允许 image2 画复杂流程、小字、密集文档、缠绕线。
- 透明背景或融合方式是否检查过。

### page-specific-custom

- 是否说明为什么不用已有组件。
- 是否没有退化为一堆临时文本框。
- 如果这个自定义结构可复用，是否应该积累为组件。

## QA 输出格式

QA 结论必须先写入机器可读的 `qa-result.json`，再由工具生成中文 `qa.md` 摘要。不能只写一行 `Verdict: PASS`。

```json
{
  "version": "qa-result.zh.v3",
  "pageId": "pXX",
  "verdict": "PASS",
  "renderSha256": "...",
  "digests": {
    "renderDigest": "...",
    "selectionOutcomeDigest": "...",
    "qaDigest": "...",
    "sourceDigest": "..."
  },
  "reviewer": {"role": "reviewer-zh", "runId": "...", "mode": "independent-render-review"},
  "checks": [
    {"ruleId": "u.geometry.overlap", "status": "PASS", "evidence": {"ruleId": "u.geometry.overlap", "artifact": "out/geometry-audit.json", "artifactSha256": "<sha256>", "location": "full-slide geometry scene", "method": "machine-geometry", "policyVersion": "visual-geometry-policy.v1", "findingIds": [], "observation": "0 blocking finding(s) for u.geometry.overlap"}}
  ]
}
```

执行顺序：

```bash
node tools/build-qa-profile.js pages/<id>/page.json --write
node tools/deck.js render
node tools/qa-batch.js init --pages <ids>
# reviewer 一次输出 qa-review-batch.v1，按真实 PNG 填写逐条状态、位置和证据
node tools/qa-batch.js apply --file output/qa-review-batch.json --pages <ids>
node tools/qa-evidence-index.js --write
node tools/deck.js verify
```

`output/qa-evidence-index.json` 是 reviewer 的默认低 token 读取面:它保存 verdict、四类依赖摘要、逐规则 evidence digest、失败/待定 rule ID 和本次 delta。完整 `qa-result.json` 仍是事实来源和最终关卡证据,但只有该页失败、待定、发生变化或 reviewer 明确点名时才进入上下文。该索引不能代替逐条证据,只负责避免反复搬运全部证据文本。

关卡会分别核对当前 PNG、渲染输入、选中路线结果、QA Profile、来源边界和组件运行轨迹。修改 QA 元数据不触发重渲染；候选路线证据变化但选中结果不变时不触发重渲染；主题或共享组件变化触发整套重渲染。旧项目可用 `migrate-evidence-v2.js` 迁移仍然新鲜的 PASS 证据，脚本拒绝迁移陈旧证据。

每条 PASS 证据必须包含匹配的 `ruleId`、具体 artifact/source、位置、检查方法和观察结果或数值。不同规则可以引用同一张 PNG，但不能用完全相同的一句话和“full-slide”位置证明几何、字体、颜色、事实与组件容量。跨规则族重复通用证据、或整页大量渲染规则只有一个通用位置时，`qa-batch.js apply` 和最终 QA 关卡都必须拒绝。

每页 `qa.md` 建议使用中文：

```markdown
Verdict: PASS / FIX-FIRST / FAIL

## 检查范围
- 页面：
- 渲染图：
- 页面关系：
- 视觉路线：

## 通过项
- ...

## 问题项
- 等级：P0/P1/P2/P3
- 位置：
- 证据：
- 修复建议：

## 剩余风险
- ...
```

## 和自进化机制的关系

动态 QA 发现的问题，如果属于页面特例，留在页面 `qa.md`；如果属于可复用问题，按 `SELF-EVOLUTION.md` 判断是否进入 `LESSONS.md`、组件库规则或流程 gate。

## 蓝图预览 QA 补充

Gate 1.5 的低保真预览也必须进入 QA，而不是只作为“看个大概”的草图。预览 QA 至少检查：

- **几何安全**：主体区块、文字区、图形区不得重叠；页脚、标题线、logo 区域不得被内容侵入。
- **连接线安全**：直线必须水平或垂直；如果使用斜线或曲线，必须是明确的设计选择，不允许出现意外歪斜。
- **对齐一致**：同级卡片、阶段节点、文件夹、列表项必须尺寸一致、基线一致、间距一致。
- **故事一致**：页面版面结构必须符合 `visualSignature`，不能退回成通用卡片或通用双栏。
- **颜色语义**：红色只能用于焦点、冲突、风险、当前选中、关口或关键变化；蓝色/灰色承担稳定结构和辅助信息；青色只作为品牌标记。
- **文件分工**：面向用户确认的预览图、面向后续制作的合同 JSON、面向内部调试的渲染脚本必须分开说明。
- **机器证据**：预览 QA 必须输出机器可读 JSON，并由 `node tools/lint-blueprint-preview.js` 读取；不要只写“人工视觉复核完成”。
- **语义安全**：大字页不使用放射斜线，概念边界页不画第三个概念块，过滤页必须有输入/过滤/输出，闭环页不允许连线穿过中心。

如果预览 QA 发现重叠、明显偏心、连接线误导、颜色含义混乱，应先修复蓝图或预览渲染器，再进入样页和正式生产。
