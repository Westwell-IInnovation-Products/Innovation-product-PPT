# 产物清单

- 阶段：anchor-sample
- 版本：leander-artifact-map.v3

当前需要看的文件会逐项列出；重复页面和历史输出只给分组数量。

## 用户确认

- `DESIGN.md`：项目设计系统。确认视觉意图和颜色语义。
- [必看] `output/preview/contact_sheet.png`：整套视觉预览。检查节奏和一致性。

## 最终产物

- 无

## 下一步输入

- `checkpoint-status.json`：阶段状态。下一阶段按需读取。
- `deck.config.js`：运行配置。下一阶段按需读取。
- `terminology.json`：术语合同。下一阶段按需读取。
- `state/run-state.json`：运行状态。下一阶段按需读取。
- `state/conversation-summary.md`：会话摘要。下一阶段按需读取。
- `agent-collaboration.json`：角色状态。下一阶段按需读取。
- 页面合同：2 个文件，11061 B；最新示例：`pages/p02-values/page.json`、`pages/p01-cover/page.json`。按受影响页面读取。

## 内部证据

- 页面实现：2 个文件，1150 B；最新示例：`pages/p02-values/page.js`、`pages/p01-cover/page.js`。只在实现或修复时读取。
- 页面渲染与 QA：6 个文件，90320 B；最新示例：`pages/p02-values/out/component-trace.json`、`pages/p01-cover/out/component-trace.json`、`pages/p02-values/out/p02.png`。重复证据按组统计，不逐文件写入 JSON。
- 角色报告：1 个文件，387 B；最新示例：`agent-reviews/README.md`。按事件读取对应角色的最新报告。

## 归档参考

- 历史输出：183 个文件，42983499 B；最新示例：`output/_renderpng/slide-2.png`、`output/_renderpng/slide-1.png`、`output/_renderpng/_render.pdf`。仅在追溯时读取。

