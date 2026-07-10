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
    surface3: "E6EAF3",
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
    danger: "C51516",
    onPrimary: "FFFFFF",
    onAccent: "FFFFFF",
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
    accentLineSoft: "EAC7C7",
    accentPanelSoft: "F6DEDE",
    accentPale: "FFE9E9"
  },
  brand: {
    nameEN: "WESTWELL",
    tagline: "Make a Well Change.",
    taglineSub: "We continuously expand, optimize and try out our products and solutions\nto pinpoint the optimal relationship between AI and human beings in different industries",
    logo: "theme/assets/logo-westwell.png",
    logoAspect: 1.235,
    logoW: 90,
    logoMarginR: 72,
    logoTop: 82
  },
  signature: {
    id: "leander-base",
    titleColor: "accent",
    headerRule: { style: "solid", color: "accent", w: 760, h: 3 },
    footer: { style: "bar", color: "accent" },
    divider: "big-number",
    cover: "warm-right",
    closing: "center-warm"
  },
  grid: {
    w: 1920,
    h: 1080,
    safe: { l: 96, t: 80, r: 1824, b: 980 },
    cols: 12,
    gutter: 24
  },
  type: {
    hero: 50,
    h1: 40,
    h2: 40,
    lead: 30,
    h3: 27,
    bodyLg: 24,
    body: 21,
    bodySm: 18,
    cap: 15,
    micro: 13,
    tiny: 12
  },
  ppt: {
    layout: { name: "W", width: 13.333, height: 7.5 },
    pxPerIn: 144,
    pxPerPt: 2
  }
};

const { globalTheme } = require("./leander-global");

const themes = {
  "leander-base": theme,
  "leander-global": globalTheme
};

function getTheme(name) {
  const t = themes[name];
  if (!t || t === theme) return theme;
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
