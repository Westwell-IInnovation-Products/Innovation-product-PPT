const theme = {
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",
    fallback: "Arial"
  },
  colors: {
    bg: "F5F5F0",
    surface: "FFFFFF",
    surface2: "F3F6FA",
    surface3: "E6EAF3",   // 更清晰的填充底（在暖白 bg 上对比足够，用于色块底/面板/芯片，避免与 bg 太接近）
    text: "3D3A32",
    mute: "666666",
    faint: "A8A39A",
    line: "D9D5CB",
    primary: "07195A",
    accent: "C51516",
    accentSoft: "FBECEB",
    blue: "1F6289",
    blueSoft: "E6EEF3",
    green: "2F8A5B",
    warn: "E8A100",
    danger: "C51516"
  },
  brand: {
    nameEN: "WESTWELL",
    tagline: "Make a Well Change.",
    taglineSub: "We continuously expand, optimize and try out our products and solutions\nto pinpoint the optimal relationship between AI and human beings in different industries",
    logo: "theme/assets/logo-westwell.png",
    logoAspect: 1.235,
    logoW: 90,        // 统一 logo 宽度（对齐母版 ~89px），全组件唯一标准，勿在页面层覆盖
    logoMarginR: 72,  // logo 右边距（距画布右缘）
    logoTop: 82       // logo 顶边距
  },
  // chrome 签名层：仅影响 cover / header / footer / closing 的构图。Base 沿用西井红签名。
  signature: {
    id: "leander-base",
    titleColor: "accent",                                   // 内容页标题用西井红
    headerRule: { style: "solid", color: "accent", w: 760, h: 3 }, // 实心红分隔条
    footer: { style: "bar", color: "accent" },              // 红色页脚条
    divider: "big-number",                                  // 分页页：大号灰字 + 红标题 + 关键词 chip
    cover: "warm-right",                                     // 暖白底、右对齐红标题封面
    closing: "center-warm"                                  // 居中藏蓝+红口号封底
  },
  grid: {
    w: 1920,
    h: 1080,
    safe: { l: 96, t: 80, r: 1824, b: 980 },
    cols: 12,
    gutter: 24
  },
  // 统一字号阶梯（设计 px；实际 pt = px / 2）。核心=宽幅层级，"该大的大、该小的小"：
  // 标题/数字够大够醒目（18-25pt），但占多数的正文与海量支撑文字（标签/芯片/格子/图内小字）真正做小（6.5-10.5pt）。
  // 对齐 cactus 实测：栏题 ~20pt、lead ~16pt，而图内/明细标签 6-9pt 占多数 —— 靠"对比"显精致，绝不把正文统统放大。
  // 教训（2026-06）：曾把 body 统一推到 15pt，支撑文字被撑大显丑；正文用 body(10.5pt)，明细用 micro/tiny(6.5-7pt)。
  type: {
    hero: 50,   // 大数字 / 项目名 / 单一主词（25pt）
    h1: 40,     // 页面标题 header（20pt）
    h2: 40,     // 栏目 / 分区大标题（20pt）
    lead: 30,   // 关键结论 / lead 句（15pt）
    h3: 27,     // 卡片 / 区块标题（13.5pt，粗体）
    bodyLg: 24, // 主段落（疏朗页 / 少量要点）（12pt）
    body: 21,   // 标准正文 / 要点（10.5pt）
    bodySm: 18, // 密集页正文 / 表格格子（9pt）
    cap: 15,    // 标签 / 次要说明（7.5pt）
    micro: 13,  // 芯片 / 图形内小标签（6.5pt）
    tiny: 12    // 边界标注 / 图例 / 明细（6pt）
  },
  ppt: {
    layout: { name: "W", width: 13.333, height: 7.5 },
    pxPerIn: 144,
    pxPerPt: 2
  }
};

// ---- 多主题注册表 ----------------------------------------------------------
// 组件库共享：内容组件自动按所选 theme 换肤；chrome 按 theme.signature 切换构图。
//   leander-base   —— 内部 / 公司汇报（暖白 + 西井红 + 海军蓝）
//   leander-global —— 对外 / 国际 / 正式（冷白 + azure 蓝 + 海军蓝，红=仅状态）
// 用法：const { getTheme } = require("./theme/tokens"); const theme = getTheme("leander-global");
const { globalTheme } = require("./leander-global");

const themes = {
  "leander-base": theme,
  "leander-global": globalTheme
};

// 命名主题以 base 为默认底做合并：结构性 token（尤其 type 字号阶梯）由 base 下发并被命名主题按键覆盖，
// 这样将来给 base 新增一个 token 会自动惠及所有主题，不会再出现"只加到 base、global 缺失"的漂移 bug。
// signature 是内聚整体，整块取命名主题自身（不深合并），保证各主题 chrome 构图独立。
function getTheme(name) {
  const t = themes[name];
  if (!t || t === theme) return theme;   // 默认/未知 → base
  return {
    ...theme, ...t,
    fonts: { ...theme.fonts, ...t.fonts },
    colors: { ...theme.colors, ...t.colors },
    type: { ...theme.type, ...(t.type || {}) },
    grid: { ...theme.grid, ...t.grid },
    ppt: { ...theme.ppt, ...t.ppt },
    brand: { ...theme.brand, ...t.brand },
    signature: t.signature || theme.signature
  };
}

module.exports = { theme, themes, getTheme };
