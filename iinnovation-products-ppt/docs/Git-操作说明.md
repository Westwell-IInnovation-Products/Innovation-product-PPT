# IInnovation-Products_ppt · Git 操作说明

本文写给维护和发布 `iinnovation-products-ppt` 的同事，覆盖日常更新、分支、提交、Pull Request、版本标签、安装同步和回滚。默认环境为 Windows PowerShell，仓库地址为：

<https://github.com/Westwell-IInnovation-Products/Leander>

## 一、仓库与目录

克隆后，仓库结构应类似：

```text
Leander/
├── .git/
├── README.md
└── iinnovation-products-ppt/
    ├── SKILL.md
    ├── README.md
    ├── manifest.json
    ├── references/
    ├── scripts/
    ├── templates/
    └── docs/
```

Git 中维护的是 `Leander/iinnovation-products-ppt/`。不要直接把 `%USERPROFILE%\.codex\skills\iinnovation-products-ppt` 当作共享仓库；安装目录可能包含个人试验或运行痕迹。

## 二、第一次克隆

```powershell
Set-Location C:\work
git clone https://github.com/Westwell-IInnovation-Products/Leander.git
Set-Location .\Leander
git status
```

当前仓库按公开访问编写说明，浏览和克隆通常不需要登录；提交和推送仍需拥有相应 GitHub 权限。

## 三、每次修改前

先确认当前目录、分支和工作区：

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short
git remote -v
```

同步主分支：

```powershell
git switch main
git pull --ff-only origin main
```

`--ff-only` 会在本地历史与远端分叉时停止，避免自动生成不清楚的合并提交。

## 四、创建工作分支

不要直接在 `main` 上开发。一次修改使用一个可读的分支名：

```powershell
git switch -c release/iinnovation-products-ppt-team-share
```

后续普通更新可使用：

```powershell
git switch -c docs/iinnovation-products-ppt-readme
git switch -c fix/iinnovation-products-ppt-theme-registry
git switch -c feat/iinnovation-products-ppt-component-name
```

## 五、修改范围

本次团队分享版应包含：

- `iinnovation-products-ppt/` 的完整 Skill。
- 三个公开注册主题：`leander-base`、`base2`、`leander-global`。
- `iinnovation-products-ppt/docs/theme-samples/` 中三套参考材料和总览图。
- 安装说明、Git 操作说明和 Skill README。

不要提交：

- `node_modules/`。
- deck 项目运行时生成的 `output/`、`state/`、审批回执和 QA 中间证据。
- 本机绝对路径、密钥、令牌、账号信息。
- 未经确认的大体积原始业务 PPT、视频或数据文件。

## 六、提交前验证

在仓库根目录执行：

```powershell
Set-Location .\iinnovation-products-ppt
node .\templates\iinnovation-products-ppt-scaffold\tools\regression-tests.js
node .\templates\iinnovation-products-ppt-scaffold\tools\lint-scope-hygiene.js --skill-root .
node .\scripts\release-hygiene.js
```

再检查主题注册表：

```powershell
node -e "const {themes}=require('./templates/iinnovation-products-ppt-scaffold/theme/tokens'); console.log(Object.keys(themes))"
```

预期只输出：

```text
leander-base
base2
leander-global
```

回到仓库根目录查看差异：

```powershell
Set-Location ..
git status --short
git diff --check
git diff --stat
```

二进制 PPT 不会显示文本差异，因此还要人工打开 `iinnovation-products-ppt/docs/theme-samples/` 下的三份 PPT 和三张总览图。

## 七、暂存与提交

只暂存本次 Skill 目录，不要习惯性使用 `git add .`：

```powershell
git add iinnovation-products-ppt
git status --short
git diff --cached --stat
git diff --cached --check
```

确认范围后提交：

```powershell
git commit -m "release(iinnovation-products-ppt): prepare three-theme team share"
```

提交后再确认：

```powershell
git status
git show --stat --oneline HEAD
```

## 八、推送与 Pull Request

第一次推送该分支：

```powershell
git push -u origin release/iinnovation-products-ppt-team-share
```

然后在 GitHub 上创建 Pull Request：

- Base：`main`
- Compare：`release/iinnovation-products-ppt-team-share`
- 标题：`release(iinnovation-products-ppt): prepare three-theme team share`
- 描述中写明主题清单、参考材料来源、验证结果和回滚方式。

建议至少由一位未参与本次修改的同事检查：

- 三个主题是否能被正确选择。
- 参考 PPT 与主题映射是否正确。
- 文档是否能让第一次使用的人完成安装。
- 仓库内是否存在不应共享的业务材料或本机路径。

## 九、合并后的版本标签

Pull Request 合并后，先更新本地主分支：

```powershell
git switch main
git pull --ff-only origin main
```

为 Skill 使用带名称前缀的标签，避免和同仓库其他 Skill 混淆：

```powershell
git tag -a iinnovation-products-ppt-v0.6.0-beta.20-team.1 -m "IInnovation-Products_ppt three-theme team share"
git push origin iinnovation-products-ppt-v0.6.0-beta.20-team.1
```

若之后发布新版本，应同步更新 `manifest.json`、scaffold 的 `package.json` / `package-lock.json` 和 `CHANGELOG.md`，再换用新的标签。

## 十、安装或更新到 Codex

先克隆或更新仓库，然后在仓库根目录执行以下 PowerShell。它会先把旧安装目录整体改名备份，再复制一份干净的新版本，可避免旧文件残留：

```powershell
$repoRoot = (Resolve-Path .).Path
$skillSource = Join-Path $repoRoot "iinnovation-products-ppt"
$skillsRoot = Join-Path $env:USERPROFILE ".codex\skills"
$skillTarget = Join-Path $skillsRoot "iinnovation-products-ppt"
$backupTarget = "$skillTarget.backup-$(Get-Date -Format yyyyMMdd-HHmmss)"

New-Item -ItemType Directory -Path $skillsRoot -Force | Out-Null
if (Test-Path -LiteralPath $skillTarget) {
  Move-Item -LiteralPath $skillTarget -Destination $backupTarget
}
Copy-Item -LiteralPath $skillSource -Destination $skillTarget -Recurse
```

完成后重启 Codex，让它重新扫描 Skill。

确认入口文件存在：

```powershell
Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".codex\skills\iinnovation-products-ppt\SKILL.md")
```

## 十一、以后同步更新

```powershell
Set-Location C:\work\Leander
git switch main
git pull --ff-only origin main
```

然后重新执行上一节的“备份旧目录并复制新版本”命令。不要只覆盖同名文件，否则已从新版本移除的旧文件仍可能留在安装目录。

## 十二、撤销与回滚

尚未提交、只想撤销某个文件时，先确认文件确实属于本次修改，再执行：

```powershell
git restore -- iinnovation-products-ppt\path\to\file
```

已经推送或合并的提交，不要改写公共历史，使用 `revert`：

```powershell
git log --oneline --max-count=10
git revert <commit-sha>
git push origin main
```

需要把本机安装回退到上一个备份时：

1. 关闭 Codex。
2. 将当前 `%USERPROFILE%\.codex\skills\iinnovation-products-ppt` 改名保留。
3. 将所需的 `iinnovation-products-ppt.backup-时间戳` 改回 `iinnovation-products-ppt`。
4. 重启 Codex。

## 十三、常见问题

- `git pull` 提示本地有修改：先执行 `git status`，决定提交、暂存还是放弃具体文件；不要直接清空整个工作区。
- `git push` 被拒绝：先检查权限和分支保护，再拉取最新远端状态。
- PPT 超过 GitHub 单文件限制：不要强推。先确认是否真的需要入库；确有必要时再由仓库管理员启用 Git LFS。
- Skill 更新后仍出现旧行为：通常是安装目录残留或 Codex 未重启。按“备份旧目录并复制新版本”的方式重新安装。
- 发布检查失败：不要绕过。根据输出修复后，重新跑回归、scope hygiene 和 release hygiene。

## 十四、发布检查单

- [ ] 工作分支基于最新 `main`。
- [ ] 只修改并暂存计划内文件。
- [ ] 三个主题注册正确。
- [ ] 参考材料与主题映射正确。
- [ ] 回归测试通过。
- [ ] scope hygiene 通过。
- [ ] release hygiene 通过。
- [ ] `git diff --check` 通过。
- [ ] 未提交密钥、本机路径、运行时产物和未批准材料。
- [ ] Pull Request 完成独立检查。
- [ ] 合并后已打带 `iinnovation-products-ppt-` 前缀的版本标签。
