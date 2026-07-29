# PPT 主题与模板系统

PPT 主题必须是可复用的样式模块,而不是一次性的幻灯片装饰。

## 目录

- [何时读](#何时读)
- [主题定义](#主题定义)
- [必需的主题 Token](#必需的主题-token)
- [内置模板指引](#内置模板指引)
- [模板选择检查点](#模板选择检查点)
- [组件规则](#组件规则)
- [自检](#自检)

## 何时读

在 Phase 2、选择或创建模板之前读本文件。

## 主题定义

一个 PPT 主题是一份稳定的设计约束:

- 颜色 token。
- 字体 token。
- 页面栅格和安全区。
- 页眉、页脚和章节页样式。
- 可复用组件。
- 布局原型。
- 素材规则。

Innovation-Products_ppt 可以复用 `web-video-presentation` 的主题思路,但必须把它们翻译成 PPT 安全的约束:PowerPoint 里可用的字体名、hex 颜色 token、页面栅格、组件形状,以及导出 QA。不要把只适用于网页的动画或 CSS 假设直接搬进 PPT。

## 必需的主题 Token

```js
const THEME = {
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",
    fallback: "Arial"
  },
  colors: {
    bg: "...",
    surface: "...",      // white
    surface2: "...",     // very light tint (subtle)
    surface3: "...",     // a CLEARER ground tint — must visibly contrast with bg (filled panels/chips). Don't reuse surface2 ≈ bg.
    text: "...",
    mute: "...",
    line: "...",
    primary: "...",
    accent: "...",
    accentSoft: "..."
  },
  // Type scale (design-px; actual pt = px / 2). WIDE on purpose: titles big, the bulk of body/detail small.
  // Same role = same size on every page. Derive these per theme by MEASURING the reference deck (see below).
  type: {
    hero: 50, h1: 40, h2: 40, lead: 30, h3: 27,    // 25 / 20 / 20 / 15 / 13.5 pt
    bodyLg: 24, body: 21, bodySm: 18,              // 12 / 10.5 / 9 pt  (body is small — most text)
    cap: 16, micro: 14, tiny: 13                   // 8 / 7 / 6.5 pt   (labels / chips / in-graphic / legend)
  },
  grid: {
    canvas: "16:9",
    safeX: [96, 1824],
    safeY: [80, 980],
    columns: 12,
    gutter: 24
  },
  components: [
    "cover",
    "header",
    "section",
    "metricCard",
    "textCard",
    "iconBadge",
    "flowNode",
    "timeline",
    "calloutBand",
    "imageFrame"
  ]
}
```

### 推导字号体系(测量,别猜)

字号体系是一个**逐主题的 signature**,不是一个常量。通用的"正文 ≥ 11pt"指引曾经造成一次真实回归(正文被统一推到 15pt,把小字/标签文字撑爆)。从参考 deck 推导它:

1. 解压参考 `.pptx`、读 `ppt/slides/slideN.xml`;抽取 `sz="..."` 值(百分之一磅 → 除以 100)。统计频率。
2. 你会看到一个**很宽的范围**,例如标题约 20–22pt、lead 约 16–18pt,以及一大堆约 6–9pt 的小标签/细节文字。把它们映射到 `type.h2 / lead / … / micro / tiny`。
3. 美感来自**对比**(大标题、小而密的细节),而不是把一切放大。让支撑文字真的小;把大尺寸留给标题、lead 行和 hero 数字。

## 主题来源

用三类主题来源:

1. **导入的 web-video 主题 token**:从 `web-video-presentation/themes/*` 改编颜色、氛围、排版意图和间距。把 CSS token 转成 PPT 常量。
2. **内部 PPT 派生的主题**:从已审批的内部 deck 里抽取反复出现的布局、排版、颜色、间距、图表处理和图标风格。
3. **项目专属 override**:只在受众或品牌情境需要时应用;让 override 保持小巧,并在 deck 生成器或大纲里记录它们。

内部源 deck 可以用来推导:

- 布局原型。
- 章节和封面处理。
- 颜色和线条节奏。
- 数据面板样式。
- 图标和图示语言。
- 图片摆放和说明惯例。

## 内置公司主题——先问用哪个

本 skill 随附三个公司主题。它们都来自已审批设计的抽象。**Phase 2 必须先按受众、信息密度和证据类型在三者间选择**,再考虑替代方案:

| | Leander Base | Base2 | Leander Global |
|---|---|---|---|
| 用于 | 内部 / 公司 deck | 内部机制、证据、状态、治理与决策 deck | 对外 / 国际 / 正式 deck |
| 底色 | 暖米白 `#F5F5F0` | 暖米白 `#F5F5F0` + 白色层级板 | 干净白 `#FFFFFF` |
| 信号色 | **Westwell 红** `#C51516` | **Westwell 红** `#C51516`,只标当前态 / Gate / 阻塞 / 结论 | **天蓝** `#00B0F0`(红 = 仅状态) |
| 结构色 | 藏青 `#07195A` | 藏青 `#07195A` + 灰蓝支撑层 | 藏青 `#002060` + 中蓝 `#0070C0` |
| 标题系统 | 实心红条,标题为红 | 与 Base 相同的品牌 chrome | 点线天蓝,标题为藏青 |
| 页脚 | 红条 | 红条 | 图片字标页脚 |
| 封面 | 暖底,右对齐红标题 | 暖底,右对齐红标题 | 项目审批的满幅图片,或干净的白色极简 |
| 形状 / 层级 | 克制扁平,**主题强制**:`container = { round:true, radius:8, shadow:false }` | 主卡 18–22px、内嵌 12–14px；主 surface 单层轻阴影，support/inset/control 平面 | 取默认 container,未强制扁平 |
| 结论表达 | 默认正文或朴素文字结论 | 默认正文闭环；确有决策/边界语义时可用描边 decision band | 默认正文或 `plain` |
| 字体 | 雅黑 + Century Gothic | 雅黑 + Century Gothic | Century Gothic 英文优先 + 雅黑 |
| 选择信号 | 企业内部、管理与方法分享 | 证据板、状态轨、机制链、决策路径需要柔和纵深 | 国际、客户、正式说明 |

问:**"常规内部汇报 → Leander Base；内部机制 / 证据 / 状态型内容 → Base2；对外 / 国际 → Leander Global。用哪一个？"** 按受众和页面关系推荐。只有当三者都不适合时,才呈现下面的替代方案。

### Leander Base(`leander-base`)

- 暖米白底 `#F5F5F0`、深藏青 `#07195A`、Westwell 红 `#C51516` 作信号色。Microsoft YaHei / Century Gothic。
- Signature:红色标题横线 + 红色页脚条;白卡带红 / 藏青顶条;页眉标题为 Westwell 红。
- 内容页右上角 WESTWELL logo,每一页都用 `theme.brand` 里**一个标准尺寸**(`logoW`/`logoMarginR`/`logoTop`,约 89px)。绝不逐页覆盖。
- 每张内容页都设置主题背景(`C.bg`);`ui.header()` 会自动做这件事。
- 封面(`ui.cover`)右对齐红标题;封底(`ui.closing`)居中藏青+红口号;`Make a Well Change.` 标语。
- **容器语言**:`container = { round: true, radius: 8, shadow: false }` —— 所有卡片扁平无阴影、圆角 8px。这由主题在 `rect()` / `shp()` 收口点强制,不依赖页面自觉。结论用 `signature.conclusion: "plain"`(居中红字、无容器),不要给 Base 页面加描边结论带。
- 表达偏好是**线性图解**:用竖分栏线、中缝分隔线、细连接线和留白组织信息,容器是配角;强调靠红字 / 红下划线,而不是靠给容器加纵深。

### Base2(`base2`,别名 `Base2` / `base-2`)

- Base2 是 Leander Base 的柔和纵深变体：品牌色、logo、页眉、页脚、封面和封底保持一致，不建立第二套组件库。
- 圆角按层级使用：主卡 `18px`、大面板 `22px`、内嵌支撑板 `14px`、控件 `12px`；不要让所有形状使用同一个半径。
- 阴影只有单层轻阴影，并按语义角色使用：`card/panel/evidencePanel/statusCard/outcomeCard/Gate` 等主 surface 可以有阴影；`support/inset/insetRow/control` 必须保持平面。禁止给所有矩形统一加阴影，也禁止渐变、发光、多层投影和厚重浮层。
- 淡红 `accentSoft` 只编码当前态、Gate、阻塞、风险或结论带。普通编号、装饰圆点和中性容器继续使用藏青 / 灰色。
- 状态轨是可选的状态编码，不是 Base2 装饰。启用时必须同时使用位置、描边和标签表达真实状态；项目可设 `theme.rail.enabled=false`，此时状态只用卡面、描边、标题色和文字标签表达。
- **容器语言**：沿用圆角和分级半径，但阴影由 `componentStyle.<role>.elevation` 决定，不由“Base2 所有容器都悬浮”的全局假设决定。优先调用 `ui.surface(role)` / `ui.insetRow()`，不要在页面里重新定义一套圆角和阴影。
- **图形/线条平衡**：Base2 以图形 surface 为主，但每张内容页仍需至少一种承担信息关系的线性结构，例如连接线、矩阵规则、时间轴、层级枝干、泳道边界或表格行。线必须解释关系，不能只是边缘装饰。
- **结论表达**默认放在标题下副标题或正文闭环。只有页面确实存在决策、边界、Gate 或审批输出时，才使用 `ui.conclusionBand()`；不得批量给每页加底部总结框。
- **优先复用语义元件**：`ui.surface()`、`ui.insetRow()`、`ui.regionEyebrow()` 和关系组件负责层级；`ui.statusCard()` / `ui.barCard()` 只用于真实状态或风险档位。
- **状态语义固定**：`review` 使用白色/中性卡面、普通描边和明确标签；若项目启用 rail，可附蓝色状态轨。`blocked/high/current/Gate` 使用 danger 面、描边和文字标签；只有 rail 已启用时才附红轨。禁止把 `review` 先画成红色激活卡，再叠加蓝色 rail。
- **状态优先级固定**：命名状态优先于通用 `active/hot`。rail 只属于真实状态，不属于 reviewer、owner、类别、编号或装饰分组。
- **主体构图固定**：内容页优先 2–3 个大区、一个主证据板/机制核心/决策核心、灰蓝内嵌层和完整纵向视觉中心。不能用一组同尺寸圆角卡替代主体关系；没有 decision band 时，正文核心应自然延伸到下部安全区。
- 发布态视觉基准见 `docs/theme-samples/02-base2-contact-sheet.jpg` 和对应可编辑 `02-base2-reference.pptx`。它们是 Base2 的布局语言参考，不是项目业务内容模板。
- 适合证据板、状态轨、机制链、协作流程、治理边界和决策路径。若页面只是常规企业汇报且不需要层级纵深，优先 Leander Base。

### Leander Global(`leander-global`)

- 干净白底 `#FFFFFF`、藏青 `#002060`(结构/标题)、天蓝 `#00B0F0`(唯一的信号色)、中蓝 `#0070C0`(真正的第二类别)。**红色被降级为仅状态**(`colors.danger`,✗/error)——绝不是结构性高亮。
- 状态组件同样遵守跨主题语义：`review` 保持白色/中性卡面 + 蓝色状态轨；`blocked` / `high` 必须使用 `danger` 红色轨、红色描边和淡红状态面，不能把 Global 的天蓝 `accent` 当作阻断色。
- Century Gothic 英文优先;中日韩经由雅黑(chrome 在选字面之前自动检测 CJK)。
- 标题尺寸 + 副标题颜色遵循 **FMS 技术介绍** 参考(实测):大藏青标题 **约 38–40pt**(`signature.titleSize: 76`,对比 Base 40→20pt)+ **浅蓝 `#539ED4` 副标题**(`signature.subtitleColor`)。
- **两条反复出现的规则是从 CTN 参考 1:1 复制的,不是重画的**(用户指令):(a)标题/副标题横线是 CTN 的精确连接线——**`#0070C0` 中蓝、`lgDash` 大虚线、0.25pt**,宽度跟随标题(`signature.headerRule: {style:"dash", color:"blue", dash:"lgDash", weight:0.25, track:true}`);(b)页面底部条是 **CTN 自己的页脚 PNG**(`theme/assets/footer-westwell.png` = 灰色 WESTWELL 字标 + `FROM HUMAN TO HUMAN` + 烘焙进去的线),满宽放在底部(`signature.footer: {style:"image", img, x,y,w,h}`)——`footer()` 只是放下这张图,它不画线/字标。
- `header()` 返回它的内容底部 Y;顶部对齐的组件(`archLayered`、`archDualEngine`)从它下面开始放内容,这样更大的标题永远不会撞到图示。
- 分隔页 = **白色下划线**(`sectionDivider`,遵循 **FMS** 参考):左对齐(x≈120)藏青粗体标题 + 实心藏青下划线 + 浅蓝副标题 + 字标页脚。
- 封面:`cover` 默认 **白色极简**(干净白、大藏青标题、点线藏青横线、浅蓝副标题、`Make a Well Change.` 天蓝标语、字标页脚)。`coverStyle: "photo-dark"` 只有在有项目审批的 `data.image` 时可用;共享 Skill 不发布任何领域场景。封底(`closing`)默认 **白色极简**;`closingStyle: "photo-dark"` 遵循同样的项目图片要求。
- 深色封面图片是一张内置占位——用 `data.image` 或覆盖 `theme.signature.coverPhoto` 换成一张真实的港口/物流照片。

## 一个共享组件库 + 逐主题 Signature

只有**一个**组件库(`components/ppt-components.js`,即 `makeComponents(pptx, theme)` 闭包),被所有主题共享——不是每个主题一个库。

主题同时拥有两类 signature：`signature` 控制 chrome，`contentFidelity` 控制主体构图。详细合同见 `THEME-FIDELITY.md`。Base 偏好线性规则与扁平解释；Base2 偏好图形 surface 与有意义线条融合、角色化单层纵深；Global 偏好证据主画面、紧凑 KPI rail、工程变量表、Δ 对比和显式待仿真状态。只替换颜色、字体、标题线和页脚不算主题保真。

- **内容组件自动换主题。** 每个内容组件都读 `theme.colors` / `theme.fonts`;需要几何和纵深时还读取 `theme.shape` / `theme.elevation` / `theme.stroke`。所以选一个主题就会给整份 deck 重新上色和调整层级,无需改动组件。组件加一次,在每个主题里都能用。
- **容器语言由主题和语义角色共同收口。** `theme.container` 决定是否允许圆角/阴影，`theme.componentStyle.<role>.elevation` 决定某个 surface 是否真正投影。Base 强制扁平；Base2 允许主 surface 投影但让 support/inset/control 平面；Global 按证据结构决定。不要把“主题允许阴影”误解为“所有形状都要阴影”。
- **按语义复用 signature 元件。** `ui.regionEyebrow()` 可用于分区；`ui.barCard()` 只用于风险/状态档位；`ui.conclusionBand()` 只用于真实决策或边界。它们不是每页配额，不能用来把所有内容页做成同一种卡片墙。
- **四个共享高容量工程模式。** `evidenceBoard()`、`compactKpiRail()`、`engineeringVariableTable()`、`deltaCompare()` 共用一套 renderer,并读取主题签名调整密度/几何。Global 用它们避免平均铺满的大卡片阵列；Base/Base2 仍可在关系匹配时复用。
- **Chrome 跟随主题 `signature`。** 只有 chrome(`cover` / `header` / `footer` / `closing`)随主题变化,由主题 token 里的一个 `signature` 块驱动(`titleColor`、`headerRule`、`footer`、`divider`、`cover`、`closing`、`coverPhoto`)。这就是 Base 和 Global 在不 fork 库的情况下看起来确实不同的原因。`footer` 支持 `bar` / `thin` / `wordmark` / `none`;`divider` 支持 `big-number` / `white-underline`;`conclusion` 支持 `plain`(居中红字、无容器)/ `band`(描边圆角带 + 眉标)。要加一个新主题:加 token + 一个 `signature`;不要复制组件。
- **封面和尾页是纯 chrome 页面。** `cover` 角色必须且只能以 `ui.cover()` 生成，`closing` 角色必须且只能以 `ui.closing()` 生成；页面不得用 custom 构图替代、不得覆盖主题 tagline、不得通过局部扩展槽继续堆行动或证据。需要额外解释时，放到相邻内容页，不要稀释主题首页/尾页。
- **选择一个主题:** `const { getTheme } = require("./theme/tokens"); const theme = getTheme("Base2");` 然后 `makeComponents(pptx, theme)`。注册表住在 `theme/tokens.js`(`themes`、`getTheme`);变体主题 token 分别在 `theme/base2.js` 与 `theme/leander-global.js`。默认(`theme`)仍为 Leander Base,以向后兼容。

## 内置模板指引

在三个内置主题都被拒绝之后,基于 deck 类型和受众推荐 2-3 个替代方案。

| Deck 类型 | 视觉气质 |
|---|---|
| 管理汇报 | 克制、高对比、面向决策 |
| 内部分享 | 清晰、友好、面向方法 |
| 产品介绍 / 售前 | 精致、视觉化、面向能力 |
| 客户演示 | 场景优先、图片主导、务实 |
| 培训 | 可读、循序渐进、疏朗 |
| 项目复盘 | 事实、状态驱动、风险感知 |

## 模板选择检查点

第 0 步——先于一切,按场合在三个内置主题间选择:常规内部 → Leander Base；内部机制 / 证据 / 状态 → Base2；对外 / 国际 / 正式 → Leander Global。如果选了一个内置主题,下面的检查点大部分是预填好的；仍需确认 logo、封面和封底处理。只有当三者都不适合时,才为替代方案跑完整检查点。

样张生产之前,确认:

- 主题/模板名称。
- 它适合该 deck 类型的理由。
- 字体。
- 主/强调色。
- logo 和品牌素材是否可用。对 Leander Base,WESTWELL logo 发布在 `theme/assets/logo-westwell.png`,通过 `ui.logo()` / `ui.header()` 渲染在右上角。
- 封面和封底处理。对 Leander Base,用 `ui.cover()`(右对齐红标题 + `Make a Well Change.`)和 `ui.closing()`(居中藏青+红口号 + 标语),匹配 Westwell 参考 deck。
- 图片风格是真实照片、截图、矢量图示、占位,还是生成图片。
- 哪些框架主题文件会持有这些 token。
- 哪个组件库被批准用于标杆样张。

如果用户说"你决定",选最合适的,并在做样张之前说明选择。

"continue" 这个词不算主题审批,除非助手在紧邻的上一条响应里已经陈述了一个具体的主题/模板选择。如果主题选择仍然是隐含的,停下并跑这个检查点。

把选定的主题记录在 deck 项目里,通常为:

```text
theme/theme.json
theme/tokens.js
qa.md
```

不要在生成的页面代码里定义一套单独的完整 theme。页面代码只有在引用现有主题 token 时,才可以用页面级强调色。

## 组件规则

- 组件必须尽可能是可编辑的 PowerPoint 形状。
- 当图片承载真实的产品、场景或证据价值时,允许并鼓励使用。
- 生成图片是可选的,应克制使用。
- 图标应来自一致的风格,并映射到具体含义。
- 不要为每一页创建一套新调色板。
- 不要混用主题约束之外的字体。
- 如果用了外部渲染库,决定结果是导出为图片、转成可编辑形状,还是留作参考 mockup。
- 每个样张或产出的页面都必须声明它的组件来源:内置框架组件、抽取的内部 PPT 组件、外部渲染组件,或页面专属自定义组件。
- 如果用页面专属自定义组件,记录为什么现有组件库不够用,以及该模式是否应被提升进 `components/`。

## 自检

- [ ] 主题选择匹配 deck 类型和受众。
- [ ] 字体和颜色 token 是明确的。
- [ ] 组件在整份 deck 里可复用。
- [ ] 页面栅格和安全区已定义。
- [ ] 图片/图标风格已定义。
- [ ] 主题被写进框架文件,而不只是在对话里描述。
- [ ] 组件来源规则是明确的。
- [ ] 如果引入了新模板,样张在全量生产之前先证明它。
