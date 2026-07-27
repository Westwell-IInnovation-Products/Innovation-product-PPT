# Innovation-product

本仓库只发布一个 Codex Skill：`Innovation-Products_ppt`。

它用于创建、重设计和规范化正式 PowerPoint，通过需求与大纲、布局蓝图、标杆样张、全量生产和渲染检查，最终交付可编辑的 `.pptx`。

| 项目 | 说明 |
|---|---|
| Skill 目录 | `innovation-products-ppt` |
| 调用方式 | `$innovation-products-ppt` |
| 当前版本 | `0.6.0-beta.20` |
| 公开主题 | `leander-base`、`base2`、`leander-global` |

## 目录

1. [安装与更新](#1-安装与更新)
2. [开始使用](#2-开始使用)
3. [制作流程](#3-制作流程)
4. [主题与样张](#4-主题与样张)

## 1. 安装与更新

### 1.1 环境要求

正式制作 PPT 前，请确认电脑已经安装：

- Codex；
- [Node.js LTS](https://nodejs.org/)；
- Microsoft PowerPoint（Windows），用于页面渲染和视觉检查。

### 1.2 下载

第一次使用推荐在当前页面选择 **Code → Download ZIP**，解压后找到 `innovation-products-ppt` 文件夹。

需要长期同步更新时，可以使用 Git：

```powershell
git clone https://github.com/Westwell-IInnovation-Products/Innovation-product.git
```

### 1.3 安装到 Codex

将整个 `innovation-products-ppt` 文件夹复制到：

```text
%USERPROFILE%\.codex\skills\
```

正确的入口文件路径应为：

```text
C:\Users\你的用户名\.codex\skills\innovation-products-ppt\SKILL.md
```

不要把外层 `Innovation-product` 文件夹一起放进 `skills` 目录。

安装后重启 Codex，并在 PowerShell 中确认：

```powershell
Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".codex\skills\innovation-products-ppt\SKILL.md")
```

返回 `True` 即表示入口文件安装正确。

### 1.4 更新

ZIP 用户重新下载仓库并替换本地 Skill。Git 用户先执行：

```powershell
git switch main
git pull --ff-only origin main
```

更新时建议先备份旧的 `innovation-products-ppt` 文件夹，再完整复制新版本，避免已删除的旧文件残留。

## 2. 开始使用

在 Codex 中直接说明任务，并明确调用 Skill：

```text
请使用 $innovation-products-ppt，把这些项目材料整理成一份 15 页左右的管理层汇报。
```

建议同时提供：

- 受众和演示场景；
- 希望受众理解或采取的行动；
- 必须出现和不得公开的内容；
- 文档、数据、图片、截图和参考 PPT；
- 语言、页数、演讲时长和交付时间；
- 希望采用的主题。

常用指令示例：

```text
请使用 $innovation-products-ppt，重设计这份 PPT，保留事实内容和页序。
```

```text
制作一份面向海外客户的英文技术介绍，采用 leander-global。
```

```text
第 4 页结论改为 X，第 6 页重新设计，其他页面保持不变。
```

## 3. 制作流程

Skill 按以下顺序推进：

```text
需求与材料
  → Brief 与逐页大纲
  → 主题与布局蓝图
  → 2–3 页标杆样张
  → 选择生产模式
  → 全量生产
  → 渲染、检查与修复
  → 交付可编辑 PPTX
```

使用者需要确认：

| 确认点 | 重点判断 |
|---|---|
| 需求与大纲 | 目标、页序、详略和必备内容是否正确 |
| 布局蓝图 | 页面结构、信息密度和全稿节奏是否合理 |
| 标杆样张 | 主题、字体、颜色和视觉完成度是否符合预期 |
| 生产模式 | 后续生产批次与反馈频率是否适合当前任务 |

更完整的适用范围、生产模式、交付和修改说明见 [`innovation-products-ppt/README.md`](innovation-products-ppt/README.md)。

## 4. 主题与样张

三套主题的样张总览直接展示如下，PPT 可从表格下载。

| 主题 | 适用场景 | PPT |
|---|---|---|
| `leander-base` | 常规内部汇报、管理沟通、方法介绍 | [下载 27 页参考 PPT](innovation-products-ppt/docs/theme-samples/01-leander-base-reference.pptx) |
| `base2` | 机制说明、证据板、状态治理、决策路径 | [下载 17 页参考 PPT](innovation-products-ppt/docs/theme-samples/02-base2-reference.pptx) |
| `leander-global` | 对外、国际、客户与正式技术说明 | [下载 13 页分享样稿](innovation-products-ppt/docs/theme-samples/03-leander-global-sample-13p.pptx) |

### `leander-base`｜27 页参考 PPT

![leander-base 主题 27 页样张总览](innovation-products-ppt/docs/theme-samples/01-leander-base-contact-sheet.jpg)

### `base2`｜17 页参考 PPT

![base2 主题 17 页样张总览](innovation-products-ppt/docs/theme-samples/02-base2-contact-sheet.jpg)

### `leander-global`｜13 页分享样稿

![leander-global 主题 13 页样张总览](innovation-products-ppt/docs/theme-samples/03-leander-global-contact-sheet.png)

`leander-base` 与 `base2` 是团队提供的参考材料；`leander-global` 是使用当前工作流制作的分享样稿。参考材料用于主题选型和设计对照，不代表 Skill 会复用其中的业务内容。
