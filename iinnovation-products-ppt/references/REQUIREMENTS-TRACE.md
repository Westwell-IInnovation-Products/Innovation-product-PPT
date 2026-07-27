# 原始需求追踪与跨任务交接

本机制防止任务轮换时只保留“下一步怎么做”，却丢失“为什么做、必须回答什么、什么才算完成”。

## 两层文件

- `state/requirements-contract.json`：Gate 1 批准的语义范围合同。保存项目内的原始对话/消息快照、全部需求、范围决定、页面映射和验收条件。批准后不得修改；需要改变范围时重新打开 `plan`。
- `state/requirements-coverage.json`：生产过程中更新的覆盖证据。记录每项活跃需求是否已覆盖，以及可以检查的项目内证据路径。

`revision-contract.json` 约束“哪些页面文件可以改”，requirements contract 约束“哪些业务目标不能消失”。两者不可互相替代。

## 建立合同

先把宿主中的原始用户消息或关键历史对话保存成项目内快照，再初始化：

```bash
node tools/requirements-trace.js init \
  --source-task <codex-task-id> \
  --source-snapshot source/conversations/original-request.md \
  --source-id src-original
```

编辑 `state/requirements-contract.json`，逐项填写：

- `id`：稳定且可读的需求 ID。
- `text`：原始目标、内容要求、素材要求、约束或验收条件。
- `category`：`objective|content|asset|constraint|acceptance`。
- `priority`：`must|should`。
- `sourceIds`：指向项目内已哈希的原始消息/对话快照。
- `disposition`：`active|deferred|removed`。
- `plannedTargets`：活跃需求对应的页面 ID，整片约束可写 `deck`。
- `acceptance`：可检查的完成标准。

若需求被 `deferred` 或 `removed`，必须写 `scopeDecision`，包含原因、证据快照 ID 和用户明确措辞。用户对页数、重排或“继续”的批准不能自动变成删除业务目标的批准。

完成 `brief.md` 和 `outline.md` 后运行：

```bash
node tools/requirements-trace.js seal
node tools/requirements-trace.js verify --stage plan
```

Gate 1 的 approval receipt 必须把 `state/requirements-contract.json` 作为被审批产物。这样对 brief、outline、原始消息快照或需求合同的修改都会使审批失效。

## 生产与最终验收

生产过程中更新 `state/requirements-coverage.json`：

```json
{
  "requirementId": "req-real-screenshot",
  "status": "covered",
  "evidencePaths": ["source/screenshots/approval.png"],
  "note": "真实审批截图已进入证据页"
}
```

状态使用：

- `pending`：尚未实现。
- `covered`：已有项目内证据。
- `blocked`：当前无法完成；不得宣称完成。
- `not-applicable`：只用于已批准的 deferred/removed 项。

强制边界：

- 进入生产前，所有活跃的 `asset` 需求必须是 `covered`，且证据路径真实存在。用户要求真实截图时，不得以示意卡、仿制界面或文字说明静默替代。
- 最终验证时，所有活跃需求都必须是 `covered`，证据路径存在，规划页面也必须存在。
- 若关键素材拿不到，停在当前 Gate，报告阻塞并向用户索取；不要继续 build 后再在交付说明里降级。

## 跨任务恢复

`phase-handoff.json` 必须包含两层文件的摘要、哈希和 `resumeEligible=true`。新任务运行：

```bash
node tools/resume-job.js
```

该命令在生成 context pack 前先验证 requirements trace。只有需求合同完整时才允许 `replayConversationHistory=false`；否则恢复被阻塞，必须重新读取宿主原始任务并建立项目内快照。

新任务默认必读：

- `state/requirements-contract.json`
- `state/requirements-coverage.json`
- `state/phase-handoff.json`

不得只读 `revision-contract.json` 或“下一步动作”就开始生产。
