# 内容层主题保真

主题保真不是“主题色 + 页眉页脚正确”。它必须改变主体构图、信息层级、证据处理或状态表达。

## 执行合同

把 `theme/content-fidelity.js` 作为三主题内容签名的机器事实源。每个 profile 定义：

- `features`：可验证的内容层特征，按 composition / hierarchy / evidence / density / state / depth / comparison 分类。
- `preferredArchetypes`：本主题优先的主体构图。
- `forbiddenPatterns`：即使颜色正确也不能使用的退化模式。
- `highCapacityArchetypes`：高指标容量或缺素材页面可用的工程型结构。

在蓝图内容页声明：

```json
{
  "themeArchetype": "global.engineering-evidence",
  "themeFeatures": [
    "evidence-dominant-main",
    "compact-kpi-rail",
    "ruled-information-hierarchy"
  ]
}
```

颜色、字体、logo、标题线和页脚不计入 `themeFeatures`。

## 三主题内容签名

| 主题 | 主体偏好 | 禁用模式 |
|---|---|---|
| Leander Base | 线性分隔、规则/轨道、扁平内容面、一个语义焦点、朴素结论 | 阴影卡墙、装饰 dashboard、平均卡片阵列、强调色遍地 |
| Base2 | 主证据板 + 内嵌层、状态轨、分级半径、单层纵深、分区眉标、决策带 | 均匀圆角卡墙、多层阴影、装饰性淡红、平均卡片阵列 |
| Leander Global | 证据主画面、紧凑 KPI rail、工程变量表、Δ 对比、待仿真状态、精确标注 | 均匀指标格、通用卡墙、dashboard skin、空 KPI 卡 |

Global 高容量页面优先使用共享组件：`evidenceBoard`、`compactKpiRail`、`engineeringVariableTable`、`deltaCompare`。这些组件属于同一个共享库。不要为 Base、Base2、Global 复制 renderer；让 renderer 读取主题签名和 `contentFidelity` 参数。

## page-specific-custom 证据

自定义内容页必须同时在 `page.json` 和 `page.js` 声明同一合同：

```js
module.exports = {
  themeFidelity: {
    version: "theme-fidelity.v1",
    theme: "leander-global",
    archetype: "global.engineering-evidence",
    features: [
      "evidence-dominant-main",
      "engineering-variable-table",
      "precise-callout-anchors"
    ]
  }
};
```

`page.json.themeFidelity` 还要保存 `composition` 代理指标。至少落实三个非 chrome 特征，并跨至少两个类别。声明与 `page.js` 导出、组件能力或构图代理不一致时阻塞。

## Global 机器代理

把以下情况判为阻塞：

- 2×3 均匀指标卡中至少四张为空，又追加三张普通信息卡。
- 高容量页把 `metricCards`、`featureGrid`、`dashboardMock` 等平均卡片模式当 fallback，且没有证据主画面、紧凑 rail、工程表或 Δ 对比。
- pending 仿真/测量行填入编造值。
- 自定义页只声明 Global 蓝色、字体或 chrome。

把以下情况标为人工复核：

- Global 内容页缺少 theme-fidelity 合同。
- 使用非首选 archetype，但机器代理未发现明确违规。
- 机器通过但主题相似度仍需联系表判断。

运行：

```bash
node tools/verify-theme-fidelity.js --pages p01,p02
```

审计输出 `output/theme-fidelity-audit.json/md`。人工 reviewer 必须在当前 contact sheet 和全尺寸 PNG 上核对主体构图，不能用“配色正确”覆盖机器失败。

`qa-result.json` 中所有 `theme-fidelity-audit` 证据必须绑定当前审计，而不是只写一个文件名：

```json
{
  "artifact": "../../output/theme-fidelity-audit.json",
  "artifactSha256": "<当前审计文件 SHA-256>",
  "auditPageId": "p16",
  "method": "machine-theme-fidelity+contact-sheet",
  "observation": "证据主画面占主体，右侧为紧凑变量轨；未出现均匀空卡墙"
}
```

门禁会重算 `page.json + page.js + theme` 的输入摘要，并核对审计行、文件哈希、页面 ID 和结论。Global 页还必须在 `method` 中记录 `contact-sheet` 或 `full-size-render` 人工复核；陈旧审计不能复用。

## 锚点覆盖

锚点样张必须覆盖：

1. 封面或品牌定调页。
2. 真实截图/证据页。
3. 数据密集页。
4. 缺素材但需高指标容量的变量/待仿真页。

同一页可覆盖多个类别，但 `quality-target.json.anchorCoverage` 的每个类别都必须被活动锚点命中。
