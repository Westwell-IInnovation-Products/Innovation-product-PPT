// Leander Global: external, international, formal Westwell theme.
// Content components are shared with Leander Base and reskin through theme tokens.
// Only cover/header/footer/closing chrome should vary through signature tokens.
const globalTheme = {
  id: "leander-global",
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",
    fallback: "Arial"
  },
  colors: {
    bg: "FFFFFF",
    surface: "FFFFFF",
    surface2: "F2F6FB",
    surface3: "E1E9F3",
    text: "1F2A37",
    mute: "5B6B7B",
    faint: "9AA7B4",
    line: "D8E0E8",
    primary: "002060",
    accent: "00B0F0",
    accentSoft: "E5F5FD",
    blue: "0070C0",
    blueSoft: "DBEBF8",
    green: "2F8A5B",
    warn: "E8A100",
    danger: "C51516",
    onPrimary: "FFFFFF",
    onAccent: "002060",
    inverseText: "FFFFFF",
    inverseMuted: "DDE5FF",
    inverseSubtle: "EAF0FA",
    shadow: "1A2030",
    coverInk: "0A0E14",
    primaryDeep: "24347A",
    primaryShade: "36468F",
    blueShade: "5E97B6",
    primaryTint: "DDE5FF",
    chromeText: "8C8C8C",
    chromeTextSoft: "9A9A9A",
    chromeLine: "6496B9",
    accentLineSoft: "B9E8FA",
    accentPanelSoft: "E5F5FD",
    accentPale: "E5F5FD"
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
    footerTagline: "FROM HUMAN TO HUMAN"
  },
  signature: {
    id: "leander-global",
    titleColor: "primary",
    titleSize: 76,
    subtitleColor: "539ED4",
    headerRule: { style: "dash", color: "blue", weight: 0.25, dash: "lgDash", track: true },
    footer: { style: "image", img: "theme/assets/footer-westwell.png", x: 23, y: 987, w: 1806, h: 63 },
    divider: "white-underline",
    cover: "white-minimal",
    closing: "white-minimal",
    coverPhoto: "",
    coverInk: "0A0E14"
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
