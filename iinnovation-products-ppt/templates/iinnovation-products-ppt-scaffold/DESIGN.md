---
version: alpha
name: IInnovation-Products_ppt Scaffold
description: IInnovation-Products_ppt 默认项目设计系统合同。
colors:
  primary: "#07195A"
  secondary: "#3D3A32"
  tertiary: "#C51516"
  neutral: "#F5F5F0"
  surface: "#FFFFFF"
  surface-muted: "#F3F6FA"
  rule: "#D9D5CB"
  accent-soft: "#FBECEB"
typography:
  headline:
    fontFamily: Microsoft YaHei
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: 0px
  title-en:
    fontFamily: Century Gothic
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0px
  body:
    fontFamily: Microsoft YaHei
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: 0px
  label:
    fontFamily: Microsoft YaHei
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
spacing:
  safe-x: 96px
  safe-top: 80px
  safe-bottom: 100px
  gap-sm: 16px
  gap-md: 24px
  gap-lg: 40px
rounded:
  sm: 4px
  md: 8px
components:
  content-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 24px
  focus-card:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.md}"
    padding: 24px
---

## 总体定位

IInnovation-Products_ppt 默认服务于结构化的内部工程沟通。页面应该克制、清晰、证据导向，方便快速扫描。默认视觉语言使用暖白底、深蓝系统结构和少量红色强调。

## 颜色语义

深蓝用于稳定结构和可复用资产。红色只用于焦点、冲突、当前选择、Gate、风险或关键变化。中性面板只在确实需要容器化证据或分组内容时使用。

## 字体与文字

中文使用 Microsoft YaHei。英文标签和数字优先使用 Century Gothic。整套 PPT 不应混用多个英文字体。

正文不能靠缩小字号硬塞。文字放不进图形时，应精简文案、增加空间或改变表达形式；不允许贴边、溢出或压框。

## 内容完成度

每个内容页必须满足 `references/QUALITY-BASELINE.md`：有可讲述主张、充分支撑、来源或实现边界，以及明确听众价值。信息不足时补机制、证据或例子，不能通过放大空框和字号制造“丰富感”。

## 布局与节奏

主体内容应落在页面正文区的视觉中心附近，不能贴着标题。故事发生变化时，相邻页面应切换视觉寄存器。截图必须有明确槽位、来源、裁剪规则和解释锚点。

## 视觉导向

项目应使用 `visual-direction.md` 作为视觉导演说明。`DESIGN.md` 定义设计系统和底线，`visual-direction.md` 定义最终效果目标、页面表达模式组合、图片/截图/image2 使用策略，以及渲染后如何看图。

## 层次与深度

使用克制的边框和填充。避免把层层悬浮卡片当成装饰。

## 图形与连线

圆角使用 4px 到 8px。表达结构时连接线应使用正交折线；只有曲线能更清楚表达流动关系时才使用曲线。

## 组件使用

组件按逻辑关系和表达能力选择。优先使用 page pattern + layout block + visual parts 的组合方式，避免把两个完整页面级组件硬拼在一页里。

## 必须做与禁止做

- 必须先确定表达模式，再选择组件。
- 红色必须有明确语义，不能作为装饰。
- 文件、系统、Agent、QA、状态类内容优先使用真实截图。
- 禁止默认添加底部总结条。
- 禁止添加没有分组、状态、选择、对比或证据作用的方框。
- 禁止让重叠、裁切、字体混用或无意歪线通过 QA。
- image2 不用于密集流程或小字内容，只用于简单示意图。
