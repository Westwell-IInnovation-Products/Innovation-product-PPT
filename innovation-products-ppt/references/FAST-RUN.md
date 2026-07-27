# 快速运行与 Token 纪律

当任务是修复、迭代、QA 或小幅扩展时,使用本文件。目标是保住最终幻灯片质量,同时避免整份 context 重读。

既有 deck 开始修复前,先确认内容基线模式。反馈、润色、页级修改、增删页和重排默认是 `delta-revision`;运行 `node tools/revision-mode.js status`。合同缺失时先按 `REVISION-MODE.md` 建立逐页映射。新的 workflow receipt 不会把 delta revision 变成 full rebuild,也不授权替换 `pages/`。

## 已有项目里的第一步

当框架已经存在时,不要一上来就重读每个 reference 文件。先跑紧凑的 status phase:

```bash
node <skill-root>/scripts/sync-scaffold-tools.js <project-root>
node tools/run-phase.js status
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
```

`run-phase.js` 会写出 context 数据包和产物映射,同时把成功的机械日志排除在模型响应之外。做定向修复或角色数据包时,用直接的 `context-pack.js` 命令。

## 重历史边界

- 一个 deck 在一个 Codex 任务里做完(不按 token 拆任务、不轮换、无 token 上限)。不要在用来改 Skill 的那个任务里跑 deck。
- Gate 0 在建立基线之前会检查根任务已有的用量。它拒绝一个已经很重、已 compact 或不可观测的任务,而不是用新基线把旧历史藏起来。
- 在每个已审批的 Gate 和成功的、会产生改动的 `run-phase` 边界,记录 Token 成本检查点,再刷新 `state/phase-handoff.json`。Token 账本只度量成本、不设上限、不轮换。
- 不要把整段旧对话粘贴或临时概括进任务。先把原始消息/历史任务保存为项目内快照,并由 `requirements-contract.json` 提炼且哈希绑定;合同、coverage 和项目产物才是续做约束。
- 绝不靠散文携带审批:同样的 workflow receipt 和检查点哈希仍然是强制的。

用数据包来决定打开哪些文件。把 `recommendedReads` 当作默认的 context 边界;只有当数据包显示路线过期、QA 缺失、故事改变、主题改变或共享组件受影响时才扩大。

在报告任何续做或修复的结果之前,更新产物标签:

```bash
node tools/artifact-map.js --write
```

然后只报告重要的分组:用户应确认什么、最终输出是什么、以及还有什么作为下一步输入保留。

## 运行模式

### 完整模式(Full Mode)

用于新 deck、新主题,或组件库的重大变更。

读:
- `SKILL.md`
- 当前 phase 的 reference 文件
- `PAGE-DESIGN-METHOD.md`
- `VISUAL-SELECTION.md`
- `QA.md`
- 先读紧凑的组件索引,只在需要时才读完整目录

预期工作:
- 大纲
- 布局蓝图
- 标杆样张
- 全量生产
- 完整渲染与评审

### 紧凑续做模式(Compact Continuation Mode)

用于在检查点已存在之后续做一份已有 deck。

从这里开始:
- 用 `node tools/context-pack.js --mode status` 拿紧凑数据包(跨会话重开旧项目时可先 `node tools/resume-job.js`)
- 只有当数据包显示审批缺失时,才读 `checkpoint-status.json`
- 只读受影响的 `page.json/page.js/qa.md` 文件
- 只有当布局节奏或视觉特征变化时,才读 `layout-blueprint.json`
- 只有当页面故事、说法或页数变化时,才读 `outline.md`

不要重读:
- 完整的 `COMPONENT-CATALOG.md`
- 完整的 `LESSONS.md`
- 所有页面文件
- 所有角色报告

——除非当前数据包暴露出需要那些文件的不匹配。

### 修复模式(Repair Mode)

用于页面反馈、小幅文字/布局修复,或单个组件修复。

只读:
- 受影响的 `pages/<id>/page.json`
- 受影响的 `pages/<id>/page.js`
- 受影响的 `pages/<id>/qa.md`
- 那个页面用到的组件函数
- 相关的活跃教训
- 只有当修复改变视觉质量或交付状态时,才读 `QA.md`

不要重读完整组件目录或整份 deck,除非:
- 修复改变共享 theme token 或共享组件
- 页面路线错了
- 用户要求整片评审

### 快速 QA 模式(Fast QA Mode)

用于展示一个迭代预览之前。

检查:
- 渲染新鲜度
- 页面视觉路线绑定
- 可见的重叠/裁切
- 同级文字尺寸一致性
- 连接线几何
- 主题 chrome 一致性
- 受影响的用户反馈项

只检查受影响页面,加上任何被共享组件触及的页面。

### 深度 QA 模式(Deep QA Mode)

用于终版交付之前、全局 theme/组件编辑之后,或用户说 deck 仍然感觉不对时。

检查完整 contact sheet 和全尺寸关键页。跑完整 QA 清单,并读相关的活跃教训。

## Context 预算规则

- Gate 1.5 之后默认用紧凑续做模式,除非用户要求重建整个故事或主题。
- 对已有框架项目,把 `tools/context-pack.js` 作为第一个读取面。
- 把 status 读取控制在约 3k 估算文本 token、修复数据包约 10k、角色数据包约 16k;只有为某个点名的缺失决策才超出。
- 常规选择优先用 `component-index.min.json`,而不是 `COMPONENT-CATALOG.md`。
- 只有在某个候选组件入围之后,才读完整组件文档。
- 按活跃类别读 `LESSONS.md`,不要当成记忆倾倒。如果不知道类别,只读最上面的活跃小节,或用审阅员 agent 去检查渲染产物。
- 对长 deck,只检查正在修复的页面切片,除非某个共享组件变了。
- 全量生产之前用布局蓝图预览,以便低成本地抓住结构问题。
- 用 `artifact-manifest.md`,以免让用户把下一步输入或内部证据当成评审产物来查看。
- 当一个文件路径加一个候选名就够时,不要把大段生成代码或完整注册表内容粘进推理里。
- 给 subagent 传:一个 context pack、角色规格、受影响的 PNG/page.json 路径,以及确切的问题。默认不要传完整 outline、完整目录、完整 QA 和所有历史报告。
- 做组件工作时,先从 `component-index.min.json` 入围;只有对选定的组件族、或当索引缺少所需的基本关系类型时,才打开 `COMPONENT-CATALOG.md`。

## 最小修复循环

```text
映射反馈 -> 定位 page/component/token -> 打补丁 -> 重渲染受影响页 -> 快速 QA -> 更新 qa.md -> 更新 artifact-manifest -> 若通用则记录 lesson
```

如果修复触及 `theme/` 或 `components/`,切到 Gate 7:渲染并评审整份 deck。

修复前用 `node tools/change-impact.js inspect`。QA/来源/候选路线证据可以在不做 PNG 渲染的情况下变化;选定路线的结果或渲染输入只使那一页失效;theme/组件变化使所有页面失效。用 `node tools/qa-batch.js init --pages <ids>`,让仍然有效的 QA 工作得到保留。
