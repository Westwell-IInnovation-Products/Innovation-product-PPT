# 设计系统合同

当 Leander-PPT 任务涉及视觉风格、组件、主题规则、布局节奏或项目级设计系统时，使用本参考文件。

## 基本规则

任何较完整的 PPT 项目都应该有项目级 `DESIGN.md`。如果项目中没有 `DESIGN.md`，在做重大视觉决策前先创建。它至少需要说明：

- 整体设计意图和受众
- 颜色语义
- 字体和字号角色
- 布局节奏
- 组件使用方式
- 必须做与禁止做

创建或修改 `DESIGN.md` 时，遵守本地 DESIGN.md 规范包。

## 校验

Windows / PowerShell 下运行：

```bash
npx -p "@google/design.md" designmd lint DESIGN.md
```

warning 可以在有明确理由时接受，error 必须阻断视觉生产。

## PPT 专项要求

`DESIGN.md` 不是越长越好，但必须回答这些问题：

- 这套 PPT 应该给人什么感觉？
- 哪些颜色分别代表焦点、风险、当前状态、稳定结构、证据或品牌？
- 哪些页面应该信息密度高，哪些页面应该留白更多？
- 什么时候适合用卡片、截图、大字、image2 或机制图？

不要把 DESIGN.md 参考包里的示例当成本项目默认审美。项目需求和用户反馈才决定最终审美。

## 与 Leander-PPT 的集成

`DESIGN.md` 需要和以下文件一起使用：

- `theme/theme.json` 和 `theme/tokens.js`：可执行的 PPT token。
- `layout-blueprint.md/json`：整套 PPT 的叙事节奏和布局合同。
- `page.json`：页面级表达模式、截图槽位和颜色意图。
- `qa.md` 和动态 QA：渲染后的检查证据。

如果 `DESIGN.md` 和已经确认的用户反馈冲突，先更新 `DESIGN.md`，重新运行 lint，再继续生产页面。

## 硬关卡

仅写规则不够。涉及蓝图或页面生产时必须运行：

```bash
node tools/verify-design-gates.js outline
node tools/verify-design-gates.js blueprint
node tools/verify-design-gates.js pages
```

这个关卡负责检查规则是否进入产物合同，例如表达模式、颜色意图、主体区域、截图槽位、默认总结框理由和中文 QA。它不能替代渲染后的视觉判断；真实重叠、歪线、微小字号和美感问题仍必须通过 rendered QA、视觉设计师和 reviewer 检查。
