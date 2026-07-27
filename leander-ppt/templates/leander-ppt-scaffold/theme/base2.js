// Base2: a softer, lightly dimensional derivative of Leander Base.
// It keeps the same brand chrome while adding reusable geometry and elevation
// tokens for mechanism, evidence, status, governance, and decision decks.
const base2Theme = {
  id: "base2",
  name: "Base2",
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
    shadow: "1A2030"
  },
  shape: {
    radius: {
      micro: 5,
      control: 12,
      inset: 14,
      card: 18,
      panel: 22,
      band: 18,
      pill: 999
    }
  },
  elevation: {
    card: {
      type: "outer",
      color: "1A2030",
      opacity: 0.14,
      blur: 8,
      offset: 2,
      angle: 90
    },
    focus: {
      type: "outer",
      color: "B7B2A8",
      opacity: 0.18,
      blur: 2,
      offset: 2,
      angle: 45
    }
  },
  stroke: {
    neutral: 1,
    emphasized: 1.4,
    focus: 1.8,
    gate: 2.2,
    connector: 1.5
  },
  componentStyle: {
    card: { fill: "surface", line: "line", radius: "card", elevation: "card" },
    inset: { fill: "surface2", line: "none", radius: "control", elevation: "none" },
    support: { fill: "surface3", line: "none", radius: "inset", elevation: "none" },
    activeState: { fill: "accentSoft", line: "accent", radius: "card", elevation: "card" },
    conclusionBand: { fill: "accentSoft", line: "accent", radius: "band", elevation: "card" }
  },
  signature: {
    id: "base2",
    structStyle: "soft",
    titleColor: "accent",
    headerRule: { style: "solid", color: "accent", w: 760, h: 3 },
    footer: { style: "bar", color: "accent" },
    divider: "big-number",
    cover: "warm-right",
    closing: "center-warm",
    conclusion: "band"
  }
};

module.exports = { base2Theme };
