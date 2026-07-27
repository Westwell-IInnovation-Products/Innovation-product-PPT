# 图片素材——预留槽位 + Prompt 规格 工作流

有些内容用**生成/真实图片**比手绘矢量形状更好。硬把一个写实场景用矩形和线条拼出来,会显得僵硬、有 AI 味("死板")。本文件定义 deck 如何在布局里**预留一个图片槽位**,并**产出一份 prompt 规格 markdown**,让图片可以(通过 `gpt-image-2` / 真实截图 / 照片)在之后产出并放入——而这期间 deck 始终能正常渲染。

提取自若干内部技术 deck 的图片工作流;示例仅作说明,不是默认的页面分配。

## 何时画矢量、何时预留图片槽位

**用组件画(矢量)**——用于关系与结构:流程、矩阵、时间线、架构、对比、表格、图表、简单的承载含义的图标。可编辑、符合品牌、快。这是默认。

**预留图片槽位**——当主体是矢量渲染起来很粗糙的**场景或写实描绘**时:
- 解释当前主题、安装、工作流或运行环境的真实世界场景。
- 传感器 / 点云 / 检测可视化("输出长什么样"——彩色点云、检测框)。
- 产品外形、有纹理/有机的主体,以及任何需要景深/透视的东西。
- 给封面/结尾/分隔页做点缀的装饰性场景条(港口天际线)。
- 经验法则:*如果手绘它需要几十个图元、而且仍然显得僵硬 → 预留一个图片槽位。*

一份 deck 应该**两者混用**——全矢量的 deck 读起来很死板(见 `LESSONS.md`:矢量图示与真实图片需平衡)。

## 工作流

1. **大纲。** 在 `outline.md` 里,把这类页面的 `Component source` 标为 `image2`(或 `real-image`),并把该素材连同它的槽位列进 Asset 清单。把页面规划成:为图片预留一个真实矩形。
2. **用图片槽位来搭建。** 用 `ui.imageSlot(...)`(框架 helper)放那个预留矩形。若文件存在,它渲染透明 PNG;否则渲染**矢量备用**(着色底上的字形),这样 deck 永不崩。页面数据带 `img: "assets/<group>/<name>.png"`。
3. **产出一份 prompt 规格 markdown**,放在 deck 旁边:`<deck>-images.gpt-image-2.md`——每个素材一条(id、页面+槽位、文件名、尺寸、透明度、可直接运行的 prompt、共享风格行)。把它交给用户(或者,如果有 `OPENAI_API_KEY` / 宿主图片工具,就跑 `gpt-image-2`——见 `LESSONS.md` 的工具检查)。
4. **放入 + 重渲染。** 用户把**透明** PNG 存到 `assets/`。重渲染——图片融进主题背景。完成。

## 硬约定

- **透明 PNG(RGBA,colorType 6),绝不压平/不透明。** 核实:一个"抠像"/导出的文件可能暗地里是 RGB(colorType 2)= 不透明的白盒子。要用的是那个非抠像的透明导出。(不确定就解码/检查 alpha。)
- **图片背后不要白卡。** 透明线条插画必须直接坐在主题底上并**融合**。背后放一块白/`surface` 面板就前功尽弃(头号错误——"为什么是白色的底图")。如果画面需要一个容器来做对比,用着色底 `surface3`,绝不用纯白。
- **风格是每个主题的一个 token。** Base:深藏青 `#07195A`,单一线宽(~3px)的线条或点画,平面或轻微等距,**透明底、无文字**。点状插画用正方形 `1:1`;条幅用宽幅 `3:1`(天际线)。
- **尺寸:** 把(通常是正方形的)画面 contain 在槽位内、居中;不要拉伸到一个非正方形的盒子里。
- **命名:** `assets/<group>/` 下用 kebab-case(如 `assets/scenes/p05-operating-scene.png`)。
- **边界:** 真实截图/照片保留其来源标签(公开引用)。不要伪造 logo/产品照片。

## `imageSlot` helper(框架 `components/editorial.js`)

```js
// Reserve a slot. Transparent PNG → blends on theme ground (no card). Missing → vector fallback.
ui.imageSlot(slide, {
  x, y, w, h,                 // reserved rectangle (px, 1920×1080 space)
  img: "assets/scenes/p05-operating-scene.png",
  fallback: (s, cx, cy) => icon(pptx, s, U, cx, cy, "layers", { color: ink }), // any glyph if img missing
  ground: false               // false = blend on bg (default for transparent art);
                              // "surface3" = tinted ground card if the art needs contrast
});
```

## Prompt 规格 markdown 模板

```markdown
# <Deck 名> · 待生成图清单 (gpt-image-2)
统一风格：deep navy #07195A single-weight line/stipple, flat/isometric, transparent bg, no text.
参数：size=1024x1024（条幅 1536x512），background=transparent，quality=high。

## <id> `assets/scenes/<name>.png` — P<n> <slot>, <尺寸>, 透明
> <英文 prompt……, transparent background, no text, 1:1>
```

项目专属的 prompt 规格属于项目框架。不要把上一个项目的 prompt 作为新 deck 的默认加载。
