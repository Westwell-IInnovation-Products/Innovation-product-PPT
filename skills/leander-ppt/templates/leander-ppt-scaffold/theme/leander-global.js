// Leander Global — 对外 / 国际 / 正式场合主题。
// Distilled from three external/international Westwell decks:
//   国际展会_海外客户_英文_TOC_ReeWell presentation（旗舰：深色港口剪影封面 + azure 强调 + Century Gothic）
//   技术介绍_英文_FMS Clarification（白底 + 海军蓝标题 + azure 蓝 + 小 logo）
//   CTN 2025 Scheduler（白底技术文档 + 蓝表头 + ✓/✗ 状态色）
//
// 与 Leander Base 的差异：冷白底（非暖白）、信号色由西井红改为 azure 蓝、
// 标题用海军蓝（非红）、标题分隔线由实心红条改为点状 azure、封面用深色港口大图。
// 红色在本主题降级为「仅状态色」（✗ / error），不再作为主强调色。
//
// 组件库是「共享」的：所有内容组件从 theme.colors / theme.fonts 取色，切换本对象即自动换肤。
// 仅「chrome / 签名层」（cover / header / footer / closing / logo）会按 theme.signature 切换构图。

const globalTheme = {
  id: "leander-global",
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",   // 对外材料英文优先，全部 Century Gothic
    fallback: "Arial"
  },
  colors: {
    bg: "FFFFFF",          // 干净冷白底（对比 Base 的暖白 F5F5F0）
    surface: "FFFFFF",
    surface2: "F2F6FB",    // 冷灰浅面板
    surface3: "E1E9F3",    // 更清晰的冷色地色（与白底 bg 拉开对比；用于色块底/面板/芯片）
    text: "1F2A37",        // 冷调深石板
    mute: "5B6B7B",
    faint: "9AA7B4",
    line: "D8E0E8",        // 冷浅分隔线
    primary: "002060",     // 海军蓝（结构 / 标题，实测自 ReeWell）
    accent: "00B0F0",      // azure 亮蓝（唯一信号色 / 单点焦点，实测自 ReeWell）
    accentSoft: "E5F5FD",  // 极浅 azure 填充 / chip
    blue: "0070C0",        // 中蓝（真正的第二类别，实测自 ReeWell）
    blueSoft: "DBEBF8",    // 中蓝浅底（AI 底座赋能箭头等）
    green: "2F8A5B",       // 成功 / ✓
    warn: "E8A100",        // 警告 / 注意（状态色）
    danger: "C51516"       // 仅状态：error / ✗（不作主强调）
  },
  brand: {
    nameEN: "WESTWELL",
    tagline: "Make a Well Change.",
    taglineSub: "We continuously expand, optimize and try out our products and solutions\nto pinpoint the optimal relationship between AI and human beings in different industries",
    logo: "theme/assets/logo-westwell.png",
    logoAspect: 1.235,
    logoW: 90,
    logoMarginR: 72,
    logoTop: 82,
    footerTagline: "FROM HUMAN TO HUMAN"                      // CTN/FMS 页脚字标下方标语
  },
  // chrome 签名层：仅影响 cover / header / footer / closing / divider 的构图，不影响内容组件。
  // 横线与页脚对齐 CTN 2025 Scheduler：标题下点状海军蓝细线 + 右下角灰色 WESTWELL 字标。
  // 标题/副标题/横线/页脚尺寸与样式对齐 FMS 技术介绍：海军蓝大标题(~40pt) + 点状海军蓝线 + 浅蓝副标题 + 右下角灰字标。
  signature: {
    id: "leander-global",
    titleColor: "primary",                                       // 内容页标题用海军蓝
    titleSize: 76,                                               // ≈38pt（对齐 FMS ~40pt，base 默认 40→20pt）
    subtitleColor: "539ED4",                                     // 浅蓝副标题（实测自 FMS）
    // 主副标题中间横线：1:1 复刻 CTN 连接符（#0070C0 大虚线 lgDash 0.25pt，宽度随标题）。
    headerRule: { style: "dash", color: "blue", weight: 0.25, dash: "lgDash", track: true },
    // 页面底部横线：直接使用 CTN 页脚条图形（line+WESTWELL 字标 baked，透明 PNG），不再自绘。
    footer: { style: "image", img: "theme/assets/footer-westwell.png", x: 23, y: 987, w: 1806, h: 63 },
    divider: "white-underline",                                  // 分页页：白底 + 海军蓝实线下划标题（参考 FMS）
    cover: "white-minimal",                                      // 默认白底极简封面（深色港口图改为可选 coverStyle:"photo-dark"）
    closing: "white-minimal",                                    // 默认白底封底，呼应封面
    coverPhoto: "theme/assets/cover-port-dark.png",             // photo-dark 封面用的港口剪影（可选）
    coverInk: "0A0E14"                                           // 无图时的深色回退底
  },
  grid: {
    w: 1920,
    h: 1080,
    safe: { l: 96, t: 80, r: 1824, b: 980 },
    cols: 12,
    gutter: 24
  },
  ppt: {
    layout: { name: "W", width: 13.333, height: 7.5 },
    pxPerIn: 144,
    pxPerPt: 2
  }
};

module.exports = { globalTheme };
