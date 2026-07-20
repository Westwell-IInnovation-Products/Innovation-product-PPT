# Leander PPT 团队共享与晋升制度

## 1. 唯一正式源

`Westwell-IInnovation-Products/Leander` 的 `main` 和 `leander-ppt-v*` Release 是正式源。个人 `.codex/skills/leander-ppt` 是安装副本，不允许整目录自动覆盖 `main`。

## 2. 三条通道

1. **候选通道**：个人成果进入 `contributions/leander-ppt/components/<github-user>/<candidate-id>/`，一人一目录、一候选一 PR。
2. **晋升通道**：组件 curator 脱敏、去重、双主题渲染后，使用 `promote-candidate.js` 加入扩展运行时与注册表。
3. **核心通道**：`SKILL.md`、Gate、Agent、Theme 和工具修改走单独 PR；不兼容变更先建 Issue/RFC，再由会议确认。

自动上传只是提交候选，不等于进入正式组件库。只有 `metadataReviewStatus=manual-reviewed`、`designStatus=usable`、真实渲染器存在且双主题验证通过，组件才允许进入自动选型。

## 3. 角色

| 角色 | 责任 |
|---|---|
| Contributor | 把项目成果脱敏、抽象为候选包；不得直接修改正式注册表 |
| Component Curator | 去重、判断复用层级、晋升组件、检查双主题预览 |
| Skill Owner | 审核 Skill 核心、Gate、Agent、权限和 Major 版本 |
| Release Owner | 创建 Tag/Release、确认回滚点和飞书通知 |
| Consumer | 只安装 Release，不从候选分支更新 |

试点阶段由 `@caijiahui0426` 同时承担 Curator、Skill Owner 和 Release Owner，稳定后应拆分为 GitHub Teams。

## 4. 候选包标准

每个候选必须包含：

```text
candidate.json
component.js
preview.svg
README.md
```

候选必须：

- 使用通用关系能力命名，不使用客户、项目或页面语义。
- 不包含本地绝对路径、密钥、原始反馈、客户资料或生成状态。
- 初始状态固定为 `review-required` 和 `pending`。
- 声明内容容量、主题、输入槽位、风险、避免条件和可编辑性。

## 5. 每周运行节奏

| 时间 | 动作 |
|---|---|
| 周一至周四 | Contributor 本地积累候选，定时任务创建 Draft PR |
| 周五上午 | Curator 查看预览、去重、退回或晋升 |
| 周五下午 | 合并晋升 PR，运行完整双主题检查 |
| 周五 18:00 | Release Owner 发布 Patch/Minor 版本并通知团队 |
| 下周一 | Consumer 定时任务安装最新允许版本 |

## 6. 冲突处理

- 不同人员写入不同候选目录，Git 自动合并。
- 相同 `id` 或相同组件 `name` 由 CI 阻断，不能覆盖。
- 同一正式组件被多人修改时，以最早打开的 PR 为基线，后续 PR 更新 `main` 后重新验证。
- 二进制 PPTX 不作为正式组件源；组件源使用 JS/JSON/SVG，PPTX 只作为参考产物。

## 7. 版本与审批

- Patch：文档、Bug、兼容性修复；Owner 审批。
- Minor：新增向后兼容组件或能力；Curator＋Owner 审批。
- Major：Gate、目录协议、权限、输入输出发生不兼容变化；Issue/RFC＋会议批准。
- Beta/RC：只进入试点用户，不作为全员自动更新目标。

Tag 使用 `leander-ppt-v0.6.0-beta.8` 形式。安装前保留旧目录备份；发现质量回退时恢复上一 Tag，不在个人电脑上临时修正式版本。

## 8. 实际命令

验证个人候选：

```powershell
node team-sharing/scripts/validate-candidate.js <候选目录>
```

发布个人候选：

```powershell
powershell -ExecutionPolicy Bypass -File team-sharing/scripts/publish-candidate.ps1 `
  -RepositoryRoot <Leander仓库> `
  -CandidatePath <个人候选目录> `
  -Contributor <GitHub用户名> `
  -CreateDraftPullRequest
```

Curator 晋升：

```powershell
node team-sharing/scripts/promote-candidate.js <仓库候选目录> `
  --skill-root leander-ppt `
  --curator caijiahui0426 `
  --approve-production
```

推荐使用单命令准备晋升分支、版本更新和 Draft PR：

```powershell
node team-sharing/scripts/prepare-promotion.js `
  --repo <Leander仓库> `
  --candidate <仓库内候选目录> `
  --curator caijiahui0426 `
  --release-type prerelease `
  --preid beta `
  --create-draft-pr
```

该命令自动准备所有变更，但不会批准或合并 PR；人工只需查看预览、风险摘要和差异后确认正式晋升。

安装正式版本工作树：

```powershell
powershell -ExecutionPolicy Bypass -File team-sharing/scripts/install-leander.ps1 `
  -RepositoryRoot <检出的Release目录>
```

## 9. 定时任务

每名 Contributor 只设置一个任务，扫描 `%USERPROFILE%\.codex\leander-contributions`。任务调用 `team-sharing/scripts/sync-scheduled.ps1`，不会镜像完整 Skill，也不会直接推送 `main`。

正式启用前必须先在 GitHub 中保护 `main`，要求 PR、CI、对话解决和 CODEOWNERS 审批。私有仓库套餐无法强制保护时，只有维护者保留写权限，其他成员通过候选分支提交。

## 10. Agent 自动候选提取

PPT 项目在最终渲染复核时运行 `candidate-harvest.js --write`，从页面专属自定义路线、低置信组件选型、项目本地候选渲染器和重复组件问题中收集信号。现有 `component-curator-zh` 使用候选提取模式完成：

1. 判断 `submit / skip / observe`。
2. 把页面代码抽为通用 `{ name, create }` 组件。
3. 去掉项目、客户、页码、数据、截图和本地路径。
4. 与正式组件索引做关系、槽位和表达能力对比。
5. 写入 `state/component-candidate-proposals.json`，并取得独立复核摘要。

`final-verify` 会把通过独立复核的 `submit` 提案自动物化到 `%USERPROFILE%\.codex\leander-contributions`。自动化只生成 `review-required / pending` 候选，不得直接修改正式注册表。

## 11. 风险分流与低人力审核

候选上传前自动生成 `automation-review.json`：

| Lane | 处理 |
|---|---|
| `auto-intake` | 自动建立分支和 Draft PR；只允许进入候选区 |
| `curator-review` | 自动建立 Draft PR并标出近似正式组件，等待 Curator 判断 |
| `blocked` | 同 ID、同候选名、冲突正式组件名或规范失败；建分支前停止 |

候选区的自动入库不等于正式可用。正式组件仍需人工批准一次晋升 PR；批准后 CI 通过可配置 GitHub Auto-merge，减少重复点击。

## 12. 飞书通知

在仓库 Actions Secret 中配置 `FEISHU_WEBHOOK_URL` 后，PR 检查成功或失败会发送飞书卡片，包含 PR、Actions 和审核入口。不配置该 Secret 时通知步骤安全跳过，不影响 GitHub CI。

Webhook 只能提供链接按钮；如需在飞书内直接执行“批准/拒绝”，还需要单独部署带回调验签的飞书应用，不能仅靠自定义机器人 Webhook 完成。

## 13. 自动发布与消费端更新

批准的晋升 PR 使用下面的命令统一提升版本：

```powershell
node team-sharing/scripts/bump-leander-version.js --root leander-ppt --type minor --note "Promote reviewed components"
```

Beta 试点的连续修订使用 `--type prerelease --preid beta`；正式新增组件通常使用 `minor`，兼容性修复使用 `patch`。

版本变更合并到 `main` 后，`leander-tag-approved-version.yml` 自动创建缺失的 `leander-ppt-v<version>` Tag；现有 Release 工作流生成压缩包和 SHA-256 文件。

每台电脑的统一周期入口为：

```powershell
powershell -ExecutionPolicy Bypass -File team-sharing/scripts/team-cycle.ps1 `
  -RepositoryRoot <Leander仓库> `
  -ContributionRoot "$env:USERPROFILE\.codex\leander-contributions" `
  -CreateDraftPullRequest `
  -UpdateChannel stable
```

`stable` 只安装正式版本；试点成员可使用 `beta`。更新器通过现有 Git 获取 Tag、核对 Tag 与 `manifest.json`、在临时 worktree 调用安全安装器，并保留旧版本回滚备份；不会降级已经安装的较新版本。
