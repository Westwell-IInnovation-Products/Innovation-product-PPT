// Base3 ("Minimalist"): a flat, sharp, graphics-driven derivative of Leander Base.
// Abstracted from an internal WellOcean business-plan deck. Minimalist *chrome*
// (no shadows, no gradients, no rounded corners, hairline rules) over a dense
// label->detail grid carried by a tri-accent graphic layer: color-coded card
// tops, thin-line mono-color icons, teal flow-arrows, and numbered status timelines.
//
// Distinct from siblings: Base = warm off-white + red rule; Global/GlobalV2 demote
// red to status; Base2 = rounded + soft-shadow. Base3 is the flat-sharp,
// navy+red+teal, statement-title, high-density option.
const base3Theme = {
  id: "base3",
  name: "Base3",
  colors: {
    bg: "FFFFFF",        // white ground (not warm off-white)
    surface: "FFFFFF",   // emphasized / lead card
    surface2: "F4F6F8",  // cool light panel — secondary cards, insight band
    surface3: "ECEFF3",  // slightly deeper cool panel
    text: "3D3A32",      // warm dark ink
    mute: "666666",      // body grey
    faint: "9AA1AC",
    line: "D9D5CB",      // greige hairline rules, footer
    primary: "07195A",   // deep navy — structure, statement titles, numerals
    accent: "C51516",    // red — kicker, emphasis, risk, lead card top
    accentSoft: "FBECEB",
    blue: "1C7293",      // ocean teal — flow: connectors, links, capability accent
    blueSoft: "E7EEF1",
    green: "2F8A5B",
    warn: "E8A100",
    danger: "C51516",
    shadow: "07123A"
  },
  // FLAT & SHARP: every corner is square.
  shape: {
    radius: { micro: 0, control: 0, inset: 0, card: 0, panel: 0, band: 0, pill: 999 }
  },
  // NO elevation — contrast comes from fills, hairlines, the tri-accent and graphics.
  elevation: {
    card: { type: "none" },
    focus: { type: "none" }
  },
  // Enforce the flat & sharp intent at the rect()/shp() chokepoint.
  // shape.radius:0 is NOT enough on its own — a roundRect with rectRadius 0 still
  // falls back to PowerPoint's default corner, so true square corners need round:false.
  container: { round: false, shadow: false },
  // Hairline vocabulary observed in the source (0.75 / 1.5 / 2.25pt).
  stroke: {
    neutral: 0.75,
    emphasized: 1.5,
    focus: 1.5,
    gate: 2.25,
    connector: 1.5
  },
  componentStyle: {
    card:           { fill: "surface2", line: "line", radius: "card", elevation: "none", topEdge: "rotate" },
    leadCard:       { fill: "surface",  line: "line", radius: "card", elevation: "none", topEdge: "accent" },
    inset:          { fill: "surface",  line: "line", radius: "control", elevation: "none" },
    support:        { fill: "surface2", line: "none", radius: "inset", elevation: "none" },
    activeState:    { fill: "surface",  line: "accent", radius: "card", elevation: "none" },
    conclusionBand: { fill: "surface2", line: "none", radius: "band", elevation: "none", leftTick: "accent" }
  },
  signature: {
    id: "base3",
    // titles argue (full-sentence CN statement), in navy — red is NOT the title color.
    titleColor: "primary",
    // uppercase, letter-spaced English kicker in red over the title.
    kicker: { style: "en-caps", color: "accent", weight: 700, tracking: 0.22 },
    // full-width greige hairline under the header (not a colored bar).
    headerRule: { style: "hairline", color: "line", w: 1152, h: 1 },
    // color-coded 3px card top edges, rotating teal -> red(lead) -> navy.
    cardTop: { style: "rotate", h: 3, colors: ["blue", "accent", "primary"] },
    // thin-line, single-color icons (teal or red). Never filled, never multicolor.
    icon: { style: "line", weight: 1.6, colors: ["blue", "accent"] },
    // teal flow-arrows between cards / process nodes.
    connector: { style: "arrow", color: "blue" },
    // numbered timeline: hollow nodes, one filled "current" node in red, status chips between.
    timeline: { node: "hollow", current: "accent", chipColor: "mute" },
    // small teal dash marker before each label->detail row.
    rowMarker: { style: "dash", color: "blue", w: 8, h: 2 },
    // greige running footer: "<DECK> · MINIMALIST" + page.
    footer: { style: "hairline", color: "line", running: true },
    divider: "big-number",           // section pages: oversized number
    cover: "left-index",             // left title block + right numbered index
    closing: "center-minimal"
  }
};

module.exports = { base3Theme };
