# 既有 Deck 的修改模式

本文件用于已有可编辑页面或已交付 deck 的反馈、改版、润色、重排和返修。它解决两个必须分开的决定：

1. 是否需要初始化一轮新的 IInnovation-Products_ppt 工作流收据。
2. 是否获得了替换现有内容基线的授权。

`workflow-gate.js init redesign` 只处理第一个决定，绝不自动回答第二个决定。

`revision-contract.json` 只约束页面文件差异，不能证明原始业务目标仍被覆盖。每轮 redesign 还必须更新并重新 seal `requirements-contract.json`，让新的 Gate 1 审批同时确认“页面怎么改”和“哪些原始问题仍然必须回答”。

## 两种内容基线模式

### `delta-revision`

适用于以下任一情况：

- 用户基于一份已交付 deck 提出反馈、意见或批注。
- 用户要求修改、润色、统一、局部重绘、增删页或调整顺序。
- 用户反复使用“保留”“沿用”“原版本”“在此基础上”等表达。
- 虽然最终页数或故事顺序变化，但仍有既有页面需要保留或局部修改。

这是既有 deck 的默认模式。新增、删除、重排并不等于整套重做。

### `full-rebuild`

只有当用户明确表示不沿用原实现、推倒重来、整套重做或从空白重新设计时才可采用。以下内容单独出现时不足以授权 full rebuild：

- “redesign”“改版”“优化一下”。
- 页数变化。
- 新增或删除若干页。
- 重新初始化 workflow receipt。
- 用户对主题或某个阶段说“继续”。

必须在 `state/revision-contract.json` 中保存明确的用户证据摘要；不能靠模型推断补写授权。

## 强制顺序

已有 deck 在改变 `pages/` 基线前必须执行：

1. 运行 `node tools/revision-mode.js init delta-revision --note "<用户意图摘要>"`，或在确有明确授权时初始化 `full-rebuild`。
2. 对 `delta-revision`，完成逐页映射：`preserve`、`modify`、`reorder`、`delete`、`add`。
3. 每个旧页面必须且只能出现一次；每个非删除的新页面 ID 必须唯一。
4. 每条 `modify` 应区分“反馈要求改变的部分”和“必须保留的部分”。
5. 在编辑前运行 `node tools/revision-mode.js verify --intent redesign`,验证合同结构与授权；它不会要求尚未发生的 diff。
6. 初始化新的 redesign receipt,让用户通过 approval receipt 审批本轮 `pageMap`,然后只修改映射允许的页面。
   - 同时把 pageMap 对应到 requirements contract 的需求 ID；删除页面不等于删除需求，需求必须迁移到其他 planned target，或以用户明确证据标记 deferred/removed。
7. 编辑后运行 `node tools/revision-mode.js verify`,强制核对真实文件 diff；通过后才能进入终版门禁。

## 审批结转与增量短流水线

当已存在一份已 `verify` 通过的 `delta-revision` 合同时，`node tools/workflow-gate.js init redesign` 不再把整套检查点清零重来，而是：

- **结转**上一轮已批的 `designTermsState`、`theme`、`layoutBlueprint`、`anchorSample`、`productionMode`。只有原检查点带可验证 approval receipt 才能结转；它们以新的 `runId` 重新签章，并记录 `carriedFromRunId` 和原 receipt run ID 溯源，不是“沿用一行旧状态”。
- **只重开 `plan`**。因为本轮唯一需要用户重新确认的，是这次修订的**范围**——也就是合同的 `pageMap`。生成新的 `plan` approval receipt 并重新 `approve plan --receipt ...`,才等于用户确认了本轮改哪些页、保留哪些页。
- `full-rebuild` 与首次 `create` 不结转，仍然重置全部检查点。

结转之后走**增量短流水线**，而不是重走造 deck 全程：

1. 只 patch 合同里 `operation` 为 `modify`/`add` 的页；`preserve` 页原样不动。`preserve` 只属于 editScope；正式终验的 `finalValidationScope` 固定为 `all-current-pages`，全部页面都要重新通过当前版本的机器几何审计。
2. 只对这些页 `node tools/deck.js render`，只对它们回填 QA。
3. 再运行 `node tools/revision-mode.js verify`,确认 `preserve` 未变、`modify` 确有变化、`add/delete/reorder` 与真实目录一致,且没有未映射页面。
4. `node tools/deck.js verify --final` 与 `build`。因为下游检查点仍是带回执结转的 approved，短流水线可以直达 build，不必重画蓝图、不必重出锚点、不必整片重评。

**关键警示：** 如果本轮反馈实际动了主题、共享 token 或共享组件，必须**显式重新审批**对应检查点（重新 `approve theme`/`layoutBlueprint`），并按 Gate 7 对受影响页做整片级重渲。不要因为它被结转成了 approved 就跳过这次本该发生的共享重渲——结转只服务于“下游没变”的常见情形，不能用来掩盖一次真实的共享改动。

## 基线操作规则

- workflow receipt、checkpoint 和 content baseline 是三类不同状态，不能互相代替。
- `delta-revision` 中先复制或可恢复重命名，再编辑；不要先清空 `pages/`。
- 错误方向的样稿进入单独 archive，不得覆盖已交付 deck 或原页面源码。
- 只修改反馈涉及的最小单元；未触及的布局、素材、组件和文案保持原实现。
- 共享 theme 或 component 改动仍按 Gate 7 扩大 QA，但不把全局 QA 等同于全稿重做。
- 用户 checkpoint 仍然阻塞。逐页映射是 Gate 1 的用户确认产物，不因用户概括性地说“继续”而自动批准。

## 合同结构

`state/revision-contract.json` 使用 `leander-revision-contract.v2`。初始化时会冻结每个旧页面的 `page.js`、`page.json` 和页面素材树 SHA-256；终验以这些哈希核对实际 diff：

```json
{
  "version": "leander-revision-contract.v2",
  "mode": "delta-revision",
  "status": "draft",
  "baseline": {
    "pageCount": 2,
    "pageIds": ["p01-example", "p02-example"],
    "pages": {
      "p01-example": {
        "pageJsSha256": "<sha256>",
        "pageJsonSha256": "<sha256>",
        "assetTreeSha256": "<sha256>"
      },
      "p02-example": {
        "pageJsSha256": "<sha256>",
        "pageJsonSha256": "<sha256>",
        "assetTreeSha256": "<sha256>"
      }
    },
    "source": "existing editable pages"
  },
  "authorization": {
    "explicitFullRebuild": false,
    "evidence": "User requested changes to the existing deck."
  },
  "pageMap": [
    {
      "sourcePage": "p01-example",
      "targetPage": "p01-example",
      "operation": "modify",
      "change": ["Update the requested claim."],
      "preserve": ["Keep the existing composition and evidence image."]
    },
    {
      "sourcePage": "p02-example",
      "targetPage": null,
      "operation": "delete",
      "change": ["Remove per explicit feedback."],
      "preserve": []
    }
  ]
}
```

## 失败即停止

以下任一情况出现时，不得移动或替换现有 `pages/`：

- 既有 deck 没有 revision contract。
- `delta-revision` 未覆盖全部旧页面。
- 同一个旧页面或新页面被映射多次。
- `preserve` 页实际发生变化,或 `modify` 页没有发生任何变化。
- `add/delete/reorder` 与真实页面目录不一致,或出现合同未映射的页面。
- `full-rebuild` 没有明确用户证据。
- 用户意图同时包含“沿用原版”和“整套重做”且尚未澄清。
