# PPT 组件库

可复用组件防止每份 deck 都从零重新设计。

## 何时读

在创建标杆样张、扩展模板,或从已有 PPT 素材里抽取可复用模式时,读本文件。

读完本文件后,把 `COMPONENT-CATALOG.md` 当作从内部 deck 抽取的、可复用页面组件的当前菜单。这个目录是刻意通用的:源 PPT 是参考,不是一次性的场景规则。

对常规的路线选择或修复,优先先用框架的紧凑 `tools/component-index.min.json`。只有在候选入围之后,才读完整目录。做组件演进时,还要读 `COMPONENT-LIBRARY-DESIGN.md`。

## Maintenance Tools

这些工具只用于组件库维护，不是每次制作 PPT 都要执行：

```bash
node tools/enrich-component-registry.js
node tools/lint-component-metadata-overrides.js
node tools/component-metadata-audit.js
node tools/build-component-index.js
node tools/lint-component-library.js --strict
```

输出文件：

- `tools/component-registry.json`：组件管理员维护的完整注册表，给组件库治理使用。
- `tools/component-metadata-overrides.json`：人工审核后的语义覆盖层；它对关系、表达能力、槽位、避免条件和风险等字段具有优先权。
- `tools/component-index.min.json`：日常选组件优先读取的轻量索引，给后续生产流程使用。
- `output/component-metadata-audit.md`：重点组件的人工元数据覆盖率与指纹重复审计。
- `output/component-library-lint.json`：组件库维护证据，给维护者看，不需要用户每轮确认。

组件维护必须遵循“可运行基线 -> 小步修改 -> 立即检查”。不要用全局替换盲目改组件源文件；先确认 `node tools/lint-component-library.js --strict` 通过，再进入真实 PPT 生产。

自动 enrich 只负责补缺和生成候选信息，不能覆盖人工结论。若组件长期因为关系、槽位或风险描述相同而反复入选，先修 `component-metadata-overrides.json`，不要靠继续堆关键词修补选择器。人工覆盖不得改写运行时事实字段，例如渲染器存在性、可选状态或真实主题兼容结果。

## 组件类型

IInnovation-Products_ppt 应分三层积累组件。

用 `COMPONENT-LIBRARY-DESIGN.md` 里的库模型:整页版式、局部版块和小部件。不要把每一处有用的绘制都当作一个新的整页组件。

### 1. 可编辑 PPT 组件

最终 deck 输出的首选。

- 封面 hero。
- 章节分隔。
- 大字 + 卡片矩阵。
- 四列机制。
- 三张指标卡。
- 时间线 / 路线图。
- 流程 / process。
- 分层架构。
- hub-and-spoke 系统图。
- 带提醒带的证据板。
- dashboard mockup。
- 前后对比。
- 风险 / 优先级堆叠。
- 图片主导的产品页。

这些应尽可能用 PowerPoint 的文字、形状、线条、图标、表格和图片来搭建。

### 2. 静态渲染组件

当视觉对可编辑 PPT 形状来说太复杂、或保真度比可编辑性更重要时使用。

- ECharts 图表。
- Mapbox 地图。
- Three.js / Spline 3D 场景。
- Rive 动画定格。
- Canvas / SVG 图示。
- 复杂仿真渲染。

把它们渲染成高分辨率 PNG/SVG,插入 PPT,并把源文件保留在工作文件夹里。把该组件标为不可编辑或部分可编辑。

### 3. 参考 Mock 组件

只在设计探索期间使用。

- HTML/CSS mockup。
- Spline 场景预览。
- Rive 动画预览。
- Three.js 原型。

不要把参考 mock 当作最终 PPT,除非导出并做过 QA 检查。

## 外部库政策

| 库 | 在 PPT 工作流里的最佳用途 | 最终输出 |
|---|---|---|
| ECharts | 图表、dashboard、趋势对比、sankey、radar | PNG/SVG;有时可通过重建 PPT 形状变为可编辑 |
| Three.js | 3D 产品、空间场景、港口/堆场仿真、相机透视 | PNG 序列/定格;保留源 |
| Spline | 精致的 3D 物体/场景 mockup | PNG 定格;保留源 |
| Rive | 动画图标/状态机概念 | 仅当 PPT 情境支持时,用定格或导出的视频/gif |
| Matter.js | 物理风格的解释性 mockup | 多为参考;有用时用定格 |
| Mapbox | 地理路线、网络、港口地图 | PNG;保留署名和地图样式 |

规则:当外部组件增加信息时,欢迎使用。它们不是 PPT 结构、层级或主张边界的替代品。

## 组件来源决策

按页面关系选择组件来源,而不是按什么最容易画。在实现页面之前把决策记录在 `page.json.visualSelection` 里;见 `VISUAL-SELECTION.md`。

| 页面需求 | 优先 | 最终 PPT 形态 |
|---|---|---|
| 逻辑、机制、对比、流程、路线图 | 现有 PPT 组件 | 可编辑 PPT 形状/文字 |
| 数据模式、dashboard、趋势、sankey、radar | ECharts 或数据渲染 | PNG/SVG 并保留源 |
| 空间场景、设备、港口/堆场系统、3D 产品关系 | Three.js / Spline / image2 | 高分辨率图片并保留源/prompt |
| 地理路线、网络、区域、港口地图 | Mapbox | PNG 并保留署名/来源 |
| 状态转换或运动概念 | Rive 或帧序列 | 定格,除非明确需要动画 |
| 缺失的封面/场景/产品视觉 | image2/生成图片 | 图片,带 prompt 和使用备注 |

有用时混用多种来源:例如,一个可编辑的 PPT 架构框 + 一个 image2 场景缩略图,或一张 PPT 证据板里的 ECharts 图表。

在敲定一个多来源页面之前,跑 `VISUAL-COMPOSITION.md`。页面必须看起来是设计出来的,而不是拼凑出来的。QA 必须能看出为什么选定路线优于组件库、外部图形、image2/imageSlot 或页面专属自定义这几个备选。

## 图标库政策

从已有内部 deck 和可复用矢量模式里建立一套图标语言:

- 每份 deck 保持一种描边风格。
- 优先简单的线条或填充矢量图标。
- 每个图标都必须映射到一个具体概念:角色、动作、指标、模块、风险、状态、素材、位置。
- 不要在一份 deck 里混用 emoji、现成图标和手绘图标。
- 把可复用图标存为 SVG,或存为 pptxgenjs 的形状 helper 函数。

## 从已有 PPTX 抽取组件

对每一份源 deck,查看导出的缩略图并收集:

- 重复的页面布局。
- 页眉 / 章节样式。
- 卡片样式。
- 数字徽章。
- 图示。
- 图标处理。
- 图表样式。
- 图片摆放。
- 颜色和字体使用。

然后给每个模式归类:

| 状态 | 含义 |
|---|---|
| `adopt` | 足够好,可以成为一个可复用组件 |
| `adapt` | 想法有用,需要清理或泛化 |
| `avoid` | 太场景专属、视觉薄弱或不稳定 |

## 组件规格格式

```markdown
## <component-name>

- Purpose:
- Best for:
- Structure:
- Required inputs:
- Optional inputs:
- Theme tokens used:
- Editable: yes / partial / no
- Source inspiration:
- QA risks:
```

## 自检

- [ ] 组件解决一个反复出现的幻灯片问题。
- [ ] 组件不绑定到一个场景或一个页面标题。
- [ ] 输入清楚到另一个 agent 能复用。
- [ ] 可编辑/不可编辑状态是明确的。
- [ ] 需要时,外部素材或源文件被保留。
- [ ] 生产之前就知道 QA 风险。

## 渲染器可用性 Gate

组件注册表不是“可用证明”。一个组件只有同时满足下面条件，才能进入日常页面选型：

- `route=component-library`
- 组件库 JS 文件中存在同名导出的真实渲染函数
- `designStatus` 不是 `planned`、`needs-renderer`、`needs-redesign`、`deprecated`、`archived`
- `node tools/lint-component-library.js --strict` 通过

维护时必须区分三种状态：

| 状态 | 含义 | 能否进入自动选型 |
|---|---|---|
| `usable` + `renderable` | 有真实 JS 渲染器，且设计质量允许复用 | 可以 |
| `needs-renderer` + `no-renderer` | 只有 registry 信息，还没有迁移成正式组件函数 | 不可以 |
| `needs-redesign` + `renderable` | 可以画出来，但语义、布局或美感不达标 | 不可以 |

`tools/component-index.min.json` 中的 `selectable` 是生产流程使用的最终判断。视觉选择器必须只从 `selectable=true` 的组件中挑选候选，不能直接相信 registry 条目数量。

真实组件图册通过下面命令生成：

```bash
node tools/render-component-library-preview.js
```

图册输出中的 `NO RENDERER` 和 `BLOCKED` 都是组件库治理信号，不是最终 PPT 页面。遇到这类条目，先修组件机制或组件设计，再让它回到候选池。

维护者可以用 `--components` 生成小批量策展图册，例如：

```bash
```

图册右上角的策展徽章应同时显示层级、主/次关系、置信度上限、元数据来源和审核状态。它用于判断“组件表达什么”，不是展示某个项目的业务文案。
