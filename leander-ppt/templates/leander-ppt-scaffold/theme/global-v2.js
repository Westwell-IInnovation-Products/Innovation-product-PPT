// GlobalV2: blue-white high-key precision theme for industrial, automation, and technical product decks.
// Content components remain shared; only tokens and signature-driven chrome vary.
// Project imagery is injected through page data and is never bundled with this theme.
const globalV2Theme = {
  id: "global-v2",
  name: "GlobalV2",
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",
    fallback: "Arial"
  },
  colors: {
    bg: "FFFFFF",
    surface: "FFFFFF",
    surface2: "F7FAFD",
    surface3: "EAF3FC",
    text: "192033",
    mute: "7B8794",
    faint: "9AA6B2",
    line: "DCE7F0",
    primary: "192033",
    accent: "276FBF",
    accentSoft: "EAF3FC",
    blue: "2F6BFF",
    blueSoft: "EDF4FF",
    teal: "0AA5A5",
    tealSoft: "D4EEF0",
    purple: "7C65C9",
    green: "41A66B",
    warn: "F2A541",
    danger: "DF6B6B",
    onPrimary: "FFFFFF",
    onAccent: "FFFFFF",
    inverseText: "FFFFFF",
    inverseMuted: "DDE7EC",
    inverseSubtle: "EAF3FC",
    shadow: "192033",
    coverInk: "111827",
    primaryDeep: "111827",
    primaryShade: "4B5565",
    blueShade: "5FBED4",
    primaryTint: "EAF3FC",
    chromeText: "9AA6B2",
    chromeTextSoft: "A5AFBD",
    chromeLine: "DCE7F0",
    accentLineSoft: "C9DFF4",
    accentPanelSoft: "EAF3FC",
    accentPale: "F7FAFD"
  },
  brand: {
    nameEN: "WESTWELL",
    tagline: "Make a Well Change.",
    logo: "theme/assets/logo-westwell.png",
    logoAspect: 1.235,
    logoW: 78,
    logoMarginR: 72,
    logoTop: 58
  },
  signature: {
    id: "global-v2",
    eyebrow: "PRODUCT DESIGN",
    titleColor: "primary",
    titleSize: 40.5,
    subtitleColor: "7B8794",
    subtitleSize: 21,
    headerStyle: "reference-kicker",
    header: {
      marker: { x: 90, y: 78, w: 33, h: 3, color: "teal" },
      label: { x: 138, y: 63, w: 450, h: 33, size: 15, color: "primary" },
      title: { x: 87, y: 117, w: 1350, h: 69 },
      subtitle: { x: 90, y: 192, w: 1320, h: 48 }
    },
    footer: {
      style: "reference-baseline",
      color: "chromeLine",
      x: 87,
      y: 1014,
      w: 1590,
      source: { x: 87, y: 1029, w: 540, h: 24, size: 15 },
      page: { x: 1752, y: 1026, w: 66, h: 27, size: 16.5 },
      cover: { x: 83, y: 975, w: 1717, pageY: 998 }
    },
    divider: "reference-index",
    cover: "reference-split",
    closing: "white-minimal"
  },
  grid: {
    w: 1920,
    h: 1080,
    safe: { l: 96, t: 64, r: 1824, b: 988 },
    cols: 12,
    gutter: 24
  },
  type: {
    hero: 64,
    h1: 54,
    h2: 40.5,
    lead: 28,
    h3: 32,
    bodyLg: 24,
    body: 21,
    bodySm: 18,
    cap: 15,
    micro: 14,
    tiny: 12
  },
  ppt: {
    layout: { name: "W", width: 13.333, height: 7.5 },
    pxPerIn: 144,
    pxPerPt: 2
  }
};

module.exports = { globalV2Theme };
