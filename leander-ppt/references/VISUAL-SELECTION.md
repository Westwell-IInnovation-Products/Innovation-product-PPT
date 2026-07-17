# 页面表达路线选择机制

这个门禁把“凭感觉画一页”变成可审计的表达路线选择：

```text
页面意图 -> 蓝图边界 -> 关系原语 -> 必需槽位 -> 内容容量 -> 证据/主题适配 -> 风险淘汰 -> 路线绑定 -> 渲染复核
```

## 使用时机

在锚点样页、正式页面生产和改变页面表达形式的修复之前运行：

```bash
node tools/select-visual-route.js pages/<id>/page.json --write
node tools/build-qa-profile.js pages/<id>/page.json --write
```

蓝图已经确定页面骨架、表达模式和搜索边界，选择器只负责在边界内找适配实现，不重新设计页面。

## 四条路线

1. `component-library`：优先用于可编辑的机制图、流程、层级、状态和工具系统。
2. `external-graphic`：用于真实截图、已有 PPT 图形、地图、产品图、三维渲染和来源证据。
3. `image2`：用于一个简单意象或场景；预留 `imageSlot` 并保存提示词，不画小字和复杂流程。
4. `page-specific-custom`：内容页的一等构图路线：按蓝图视觉签名手工构图，组件可作为局部积木；大字海报、品牌页天然适用。

## 组件评分顺序

内部评分只用于短名单，不对外展示为页面内容，也不代表最终美感。

| 维度 | 作用 | 典型处理 |
|---|---|---|
| 蓝图边界 | 是否在候选族和允许路线内 | 优先或硬淘汰 |
| 关系原语 | 是否表达同一种逻辑关系 | 主分 |
| 必需槽位 | 是否有足够结构承载输入 | 缺失过半则淘汰 |
| 内容容量 | 条目数和文本量是否能放下 | 超容量淘汰，不靠缩字硬塞 |
| 证据适配 | 能否放真实截图、来源或数据 | 证据页加分 |
| 主题适配 | 是否在当前主题真实渲染通过 | 已验证才加分 |
| 风险规则 | 是否命中 avoid、复杂度或组件风险 | 扣分或淘汰 |
| 关键词 | 只作为弱信号 | 最多贡献少量分数 |

严禁重复加分。候选族和路线偏好只能在一个评分阶段生效。

四类路线使用同一 0-100 分区间，最终分数不得超过 100。截图/来源证据主导页应让 `external-graphic` 具有真实胜出机会；简单意象页应让 `image2` 竞争；大字、品牌或独特结构页应让 `page-specific-custom` 竞争。四类路线全部出现但长期固定由组件路线获胜，视为形式评估失败。

长 PPT 的内容页如果 100% 选择 `component-library`，质量基线默认阻断。只有项目配置显式开启整套豁免，并且每个组件页分别记录充分的 `dominanceJustification`，才允许进入最终视觉复核。

## V2 输出

`page.json.visualSelection` 保存紧凑合同：

```json
{
  "engineVersion": "visual-selector.v2",
  "relationship": "toolbox",
  "relationshipSubtype": "toolbox.tool-tree",
  "visualSignature": "tool-tree-with-call-engine",
  "blueprintRef": "layout-blueprint.json#pXX",
  "expressionMode": "mechanism-diagram",
  "requiredSlots": ["toolGroups", "selectionLogic"],
  "contentShape": {"maxItems": 6},
  "candidateRoutes": [],
  "selectedRoute": {
    "route": "component-library",
    "name": "toolSystemTree",
    "score": 82,
    "confidence": 0.82,
    "margin": 13
  },
  "requiresCuratorReview": false,
  "rejectedRoutes": []
}
```

页面不再复制完整 `blueprintContract`。蓝图事实留在 `layout-blueprint.json`，页面只保存 `blueprintRef`。

## 置信度与组件管理员

- `confidence < 0.68`：触发组件管理员。
- 第一、第二候选分差 `< 8`：触发组件管理员。
- 选中 `page-specific-custom` 且得分 ≥ 60：视为合同内一等路线，不因此触发组件管理员。
- 选中路线超出蓝图候选族：必须记录 override 并触发组件管理员。
- 同一 override 反复出现：修组件元数据或拆分组件，不在每页重复手工例外。

## 组件组合

允许：

```text
一个 page pattern + 若干 layout block + visual parts
```

不允许把两个完整 page pattern 硬拼在一页。只需要局部能力时，应拆出布局块或视觉零件。

## 运行绑定

`page.js` 需要声明：

```js
visualBinding: { route: "component-library", name: "toolSystemTree" }
```

但声明一致还不够。渲染时 `deck-ctx.js` 会记录真实组件调用到 `out/component-trace.json`；门禁会核对：

- 选择合同中的组件名。
- `page.js.visualBinding`。
- 真实运行轨迹。
- 当前 PNG 哈希。

组件库路线没有真实调用证据时，产生评审警告：渲染评审必须确认该页是有意手工构图且构图完整，而不是绑定错误。

## Reviewer 判断

渲染后至少回答：

1. 这条路线是否正确表达页面关系？
2. 页面是否保持蓝图视觉签名，而不是退回通用卡片？
3. 组件槽位和容量是否匹配？
4. 是否存在更清楚的真实截图、外部图或简单 image2 路线？
5. 颜色、字体、连线、视觉中心和页面美感是否达到交付标准？

选择器是 Harness 辅助，不是最终设计师。整洁但关系错误的页面仍然失败。
