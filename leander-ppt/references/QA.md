# PPT QA 协议

QA 是强制的。默认第一次渲染就有问题。

## 何时读

在把任何样张或完整 deck 报告为完成之前,读本文件。

## Pre-Flight:累积教训

在下面的清单之前,先读 [`LESSONS.md`](LESSONS.md),拿 deck 对照每一条累积教训。它是本 skill 已经被纠正过的缺陷的去重清单;再次发出其中任何一条都是自动 fail。这份清单随时间增长——始终重读它,不要依赖记忆。

## 硬规则

每一份生成的 PPTX 在交付前都必须渲染成图片。检查 contact sheet 和全尺寸的关键页。在报告完成之前修掉可见问题。

用能拿到的最独立的评审方法:

1. **审阅员 subagent**,用随附的中文审阅员 [`agents/reviewer-zh.md`](../agents/reviewer-zh.md):传预览 PNG 目录、`outline.md` 切片、主题、相关的 `page.json` 和 `qaProfile`。它返回 pass/fail + 证据 + 修复 + 一个 SHIP/FIX-FIRST 结论。
2. 只有在 subagent 不可用时才自检:逐条走清单。瞄一眼不够。

除非用户明确接受风险,否则 fail 项必须在报告完成之前修好。

## 完成的定义(以产物为门)

没有哪条散文关卡能*强制*agent 跑 QA——所以要把"跳过 QA"变得**可见**,办法是把"完成"绑定到用户能看见的产物上:

- **`qa.md` 存在,并逐页列出 PASS/FAIL 结论**(用框架模板)。一份没有逐页 qa.md 的 deck 不算完成。
- **终版报告粘贴审阅员的结论块**(`Scope/Pass/Fail/Risk/Verdict`)。如果你粘不出一个审阅员结论,你就没跑评审——明确这么说,而不是暗示 QA 发生过。
- **每次渲染(样张、完整 deck、每一次反馈重渲染)都刷新 qa.md。** 一份比最新渲染更旧的 qa.md = 过期 = 未完成。
- **每张内容页都有一个 `page.json.visualSelection` 块**,且审阅员检查实现的视觉路线是否与之匹配。
- **启用时,存在 agent 协作证据。** `agent-collaboration.json` 把 `reviewer-zh` 记为 `completed`,且引用一份与当前事件/输入/输出哈希一致的 `leander-agent-run-receipt.v1`;`tools/verify-agent-collaboration.js` 通过。只有 Markdown 报告或手填 thread ID 不算独立运行。
- **用对 gate 档位。** 页面工作期间,`node tools/deck.js verify` 只检查页面 QA。终版 build 之前,`node tools/deck.js verify --final` 检查页面 QA 加 agent 协作证据。

这是诚实的强制:它不保证执行,但产物的缺失(或过期)对你和用户都是一个可见信号,表明 Gate 6 被跳过了。

## 必需的 QA 产物

- 输出 `.pptx`。
- 导出的幻灯片 PNG。
- Contact sheet **或**逐页检查(如果没有拼图工具——记录用了哪种)。
- `qa.md`:逐页 PASS/FAIL、修了什么、剩余风险,加审阅员结论块。
- 对修复:受影响的页面 ID,以及刻意没改什么。
- 主题/模板证据:选定的主题名、已审批的标杆样张路径,以及组件来源摘要。
- 框架证据:生成器路径、theme/组件 import,以及 chapter/page 约束位置。
- 视觉选择证据:逐页的 `visualSelection` 路线、选定的组件/素材/图片槽位,以及被否决的备选。
- 动态 QA 证据:每一页由 `tools/build-qa-profile.js` 生成的 `page.json.qaProfile`;页面级 `qa.md` 应回答 `DYNAMIC-QA.md` 里的中文检查。
- Agent 协作证据:`agent-collaboration.json` + `agent-collaboration.md`,含审阅员结论和任何备用理由。
- Agent 运行回执:`state/agent-run-receipts/*.json`,绑定 collaboration tool 返回的 thread/run ID、`eventDigest`、`inputDigest`、输出文件与输出 SHA-256。宿主不能反查 thread 时,本地校验只能证明绑定完整性,不能独立证明 opaque ID 真实存在;禁止自行编造 ID。
- 渲染质量证据:`output/render-quality-evidence.json`,绑定到当前 contact sheet、页面 PNG 哈希、每页机器几何审计哈希、已审批的锚点 contact sheet、visual-designer 报告和 reviewer 报告。
- 来源证据:`source-evidence-index.json` v2,绑定项目内来源/快照的实际内容 SHA-256、事实边界、claim/page scope。来源变化会使依赖它的渲染或 QA 证据失效。
- 终版产物回执:`output/final-artifact-receipt.json`,证明正式 PPTX 来自通过 final gate 的 staging build,并且 staging 渲染与已评审逐页 PNG 零像素差异。

## 渲染质量锁

对终版生产 deck,渲染 QA 在证据被捕获并独立评审之前不算完成:

```bash
node tools/render-contact-sheet.js
node tools/render-quality-gate.js capture
node tools/render-quality-gate.js record --role visual-designer-zh --artifact agent-reviews/visual-designer-zh.md --agent-receipt state/agent-run-receipts/visual-designer-zh.json --inspection output/visual-designer-full-size.json --verdict PASS --pages all --full-size <risk-pages> --addresses all
node tools/render-quality-gate.js record --role reviewer-zh --artifact agent-reviews/reviewer-zh.md --agent-receipt state/agent-run-receipts/reviewer-zh.json --inspection output/reviewer-full-size.json --verdict SHIP --pages all --full-size all --overall SHIP
node tools/render-quality-gate.js verify
```

捕获必须发生在当前渲染、机器几何审计和 contact sheet 之后。它创建 `renderSetSha256`;两份独立报告都包含 `[render-set:<sha256>]`。凡使用 `--full-size`，还必须提交 `full-size-inspection.v2` JSON，并在报告中包含 `[inspection-sha:<sha256>]`。JSON 绑定每页当前渲染哈希和 `geometry-audit.json` 哈希，声明 `viewer=view_image` 和 `viewedAtFullSize=true`，并为每页记录 geometry、composition、semantics、readability 四类具体观察；每条观察必须有数值 region，geometry 观察必须带 cropArtifact/cropSha256。最终 `reviewer-zh` 必须对当前全部页面形成逐页全尺寸覆盖；单页修复只重审变化页，未变页面仅在 render、几何报告和 gate schema 哈希都一致时沿用逐页事件。theme/组件或 gate schema 变化仍要求整片重审。`--addresses all` 要求对当前质量 warning 有字面的 `[topic:<warning field>]` 标记。

两份独立报告还必须包含 `[quality-score:<0-10>]`,以及对 `quality-target.json` 里每个维度的一个 `[quality:<dimension>=<0-10>]` 标记。低于总体或维度目标的结论是 `FIX-FIRST`;PASS/SHIP 文字不能覆盖数值质量目标。

终版 `deck.js build` 不直接覆盖正式文件。它先在 `output/.staging/` 组装并用当前 LibreOffice/Poppler/字体环境渲染,把每页 PNG 与 `render-quality-evidence.json` 锁定的已评审 PNG 做逐像素比较。任意尺寸变化或任意非零像素差异都阻塞发布;通过后才替换正式 PPTX并写 final-artifact receipt。`build --draft` 只生成带水印的 `.draft.pptx`,不能刷新或伪造终版回执。

## 动态 QA（必须）

每页 QA 不是只检查通用规则，还必须检查“这一页本来要表达的关系是否被表达对”。生成或修复页面后，运行：

```bash
node tools/build-qa-profile.js pages/<id>/page.json --write
```

然后按 `references/DYNAMIC-QA.md` 检查：

- 通用 QA：重叠、裁切、字号、主题、颜色、留白、证据边界。
- 页面关系 QA：流程、状态、工具系统、架构、层级、对比、证据、场景、决策、闭环等。
- 视觉路线 QA：组件库、外部图、image2、自定义路线是否合理。
- 内容 QA：标题、takeaway、reviewFocus 是否被视觉结构支撑。

`qa.md` 建议使用中文记录检查范围、通过项、问题项、剩余风险。缺少 `qaProfile` 或 `qaProfile` 与 `visualSelection` 不一致时，构建关卡应失败。

## 视觉 QA 清单

检查每一张幻灯片,然后放大关键页。

- [ ] 页面遵循 `PAGE-DESIGN-METHOD.md`:信息 -> 关系 -> 路线 -> 产物真实性 -> 版面结构 -> QA 几何/字号检查。
- [ ] 页面 ID/页号能追溯回 `outline.md`。
- [ ] 页面能追溯到它的 `pages/<id>/page.json` 约束。
- [ ] 页面有 `page.json.visualSelection`;内容页缺 visualSelection 是一个 QA fail。
- [ ] 渲染出的页面使用选定路线。如果它写的是 `stateFlow`、`workflowConfig`、`pipelineFlow` 等,页面就必须真的用那个组件、或一个清楚记录的改编。
- [ ] 在任何页面专属自定义布局之前,考虑过组件库、外部图形和 image2/imageSlot 选项。
- [ ] 页面使用已审批的主题/模板,并与已审批的标杆样张看起来一致。
- [ ] 页面使用声明过的组件来源;自定义组件有理由。
- [ ] 没有元素跑到页面外或被裁切。
- [ ] 文字、箭头、图标、形状或图片之间没有重叠。
- [ ] 正文和卡片文字可读。
- [ ] 页面没有意外偏向一侧。
- [ ] 留白是设计出来的,而不是空的。
- [ ] 每张内容页都有真实的图示、图片、图表或视觉解释。
- [ ] 图标和图片承载信息,不只是装饰。
- [ ] 填充和线条是刻意混用的。
- [ ] 字体使用遵循主题。
- [ ] 主张和数字保留来源边界。
- [ ] 没有占位、假数据或缺失素材被藏起来。

模板不匹配是一个 QA 失败,即便幻灯片没有裁切、重叠或不可读文字。

自动 fail 条件:

- 一份多页 deck 是从一个松散的一次性脚本、而不是从框架生成的。
- 在主题审批之后,在页面代码里定义了一套新调色板、logo 处理、栅格或字体系统。
- 预览用的是一张不来自渲染实际 PPTX 的图片 mockup。
- 样张不是从打算用于全量生产的同一套主题/组件系统生成的。
- 一个页面没有真实视觉解释,只有文字卡片。
- 一个页面手画通用盒子,而其实存在一个相近的目录组件,且 `visualSelection` 没有为这次绕过给出理由。
- 用了备用工具链,但没有记录在 `qa.md` 里。
- **颜色不承载含义**:一个页面用了两种或更多颜色,而它们的差异什么都不编码(装饰性彩虹)。见 `SLIDE-CRAFT.md` → Color Semantics(颜色语义)。
- **不对称的无用空白**:一个内容块被钉在顶部,页脚上方有一大条空带,而该块既没有填满正文、也没有垂直居中。见 `SLIDE-CRAFT.md` → Fill The Body(填满正文)。
- **背景或 logo 不一致**:一个内容页用了与封面/章节页不同的背景,或者 logo 尺寸/位置在页面之间不同,而不是那唯一的主题标准。

## 设计评审(必须)

渲染 QA 不只是"没有裁切"。在机械检查之后,跑一次专门的**设计评审**,专门排查 AI 味,用能拿到的最独立的审阅员(审阅员 agent → subagent → 自检,按上面的方法)。设计评审必须逐页回答:

- 每一种不同的颜色是否都编码一个真实含义(强调、类别、状态、递进)?说出它。标出任何装饰性颜色。
- 正文是填满的、还是对称居中的,没有不对称的无用空白?标出顶部钉住、底部空着的块。
- 背景和 logo(尺寸 + 位置)是否与 deck 其余部分完全相同?
- 是否有任何元素(图标、数字、形状)孤零零地飘在空间里,没有锚定内容?
- 选定的视觉路线是否比被否决的备选更好地表达页面关系?如果不是,即便页面在机械上干净,也让它 fail。
- 页面是否错误地把线框样式本身当成了视觉形态?
- 一个设计师会说这是刻意的、还是自动生成的?

把设计评审的发现看得和裁切/重叠一样重:在报告完成之前修掉它们。优先修**共享组件**,让每个用到它的页面一次性都改进,而不是修单个页面。

## 内容 QA 清单

- [ ] deck 和每张内容页都满足 `QUALITY-BASELINE.md`;元数据完整性不被当作内容完整性接受。
- [ ] 页面顺序匹配 `outline.md`。
- [ ] 每个页面标题和 takeaway 都与大纲匹配。
- [ ] 关键事实、数字、名称和日期与源材料匹配。
- [ ] 已达成、计划中、估算和公开引用的说法都被标注。
- [ ] deck 类型仍然匹配 brief。
- [ ] 没有 AI 风格的空洞短语进入标题或关键文案。
- [ ] 案例页写明主角、动作、结果/进度、相关性和来源边界。
- [ ] 机制页写明原始问题、输入、机制、输出/证据,以及相关时的限制或失败路径。
- [ ] 没有生产备注、隐藏推理或设计指令作为面向受众的幻灯片文案出现。

## 样张 QA

对标杆样张,在满足以下条件之前不要推进到全量生产:

- [ ] 样张 PPTX 被导出并检查。
- [ ] 封面或定调页可接受。
- [ ] 核心内容页证明了密度和图示风格。
- [ ] 最复杂的页面证明了方法能处理难布局。
- [ ] 样张是从打算用的 scaffold/主题/组件文件生成的。
- [ ] 每个样张页声明页面 ID、主题、组件来源、素材来源和数据边界。
- [ ] 用户已审批,或明确要求不顾已知问题继续。

## 完整 Deck QA

全量生产之后:

1. 把所有页面导出为 PNG。
2. 构建一张 contact sheet。
3. 检查 contact sheet 有无明显的节奏、密度和一致性问题。
4. 拿 contact sheet 对照已审批的标杆样张和选定的模板规则。
5. 至少全尺寸检查所有章节页、最复杂的图示页、所有密集文字页,以及结尾页。
6. 在生成器或源 PPT 里修问题,重新生成,并重新导出受影响页。

## 修复 QA

对已有幻灯片的反馈:

1. 识别受影响的页面 ID。
2. 修补最小的受影响单位:页面、组件,或主题 token。
3. 重新导出受影响页。
4. 如果一个共享组件或主题 token 变了,重新导出每个受影响页并刷新 contact sheet。
5. 确认没有不相关的页面变化,除非确有必要。
6. 报告修复范围。
7. **记录并分类这条教训。** 往当前活跃 deck 项目的 `state/feedback-log.md` 追加一条结构化条目,用 [`SELF-EVOLUTION.md`](SELF-EVOLUTION.md) 分类它,如果它复发或普适,就把一条去标识规则提取进 [`LESSONS.md`](LESSONS.md)、[`DYNAMIC-QA.md`](DYNAMIC-QA.md)、组件规则或一道流程 gate。一次修复在被记录和分类之前不算完成。

## 审阅员 Prompt 约束

当用审阅员 agent 或 subagent 做 QA 时,提供:

- 产物路径:PPTX 和渲染 PNG/contact sheet 路径。
- 任务范围:brief/outline/样张/完整 deck/修复。
- 相关清单路径:本文件,加上按需的 `SLIDE-CRAFT.md` 或 `PRODUCTION.md`。
- 相关视觉选择路径:`VISUAL-SELECTION.md`,加上受影响的 `pages/<id>/page.json` 文件。
- 相关动态 QA 路径:`DYNAMIC-QA.md`,加上每个受影响的 `page.json.qaProfile`。
- 相关大纲切片或受影响的页面 ID。
- 确切的输出格式:pass/fail 项、证据和建议修复。
- `agent-collaboration.json` 的路径;审阅员返回后,更新 `reviewer-zh` 角色状态和结论。

除非审阅员是在明确验证一个已知修复,否则不要提供你自己的诊断。保持评审独立。

期望的审阅员输出:

```text
检查范围：
通过项：
问题项：
- p<页号> / P0-P3 / 问题类别 / 具体证据 / 修复建议
视觉路线检查：
动态 QA 检查：
剩余风险：
结论：SHIP / FIX-FIRST
```

审阅员输出之后,先修 fail 项。报告审阅员发现却不修复不算完成。

审阅员必须明确回答:

- 输出是否用了框架和已审批的主题/组件系统?
- 每张内容页是否遵循它的 `visualSelection` 约束?
- 每一页是否遵循它的中文 `qaProfile` 检查?
- 在页面专属自定义图形之前,是否考虑过现有目录组件?
- 渲染预览是否匹配已审批的锚点/模板方向?
- 是否有任何页面是一次性的、脱离模板的,或较低置信度的备用?

## 报告格式

完成时,报告:

- 输出 PPTX 路径。
- 预览/contact sheet 路径。
- 检查了什么。
- QA 之后修了什么。
- 剩余风险或已知限制。
- 对修复任务:受影响的页面 ID 和未改动的范围。

如果明显的视觉缺陷仍然存在,不要报告"完成"。
