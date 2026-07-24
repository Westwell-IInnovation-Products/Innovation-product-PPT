// Scaffold-local regression suite for syntax and deterministic behavior.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const TOOLS = __dirname;
const ROOT = path.join(__dirname, "..");
function assertReleaseVersion() {
  const manifestFile = path.resolve(ROOT, "..", "..", "manifest.json");
  const scaffoldFile = path.join(ROOT, ".leander-scaffold-version.json");
  const packageFile = path.join(ROOT, "package.json");
  const deckFile = path.join(ROOT, "tools", "deck.js");
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
  const scaffold = JSON.parse(fs.readFileSync(scaffoldFile, "utf8"));
  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  const deck = fs.readFileSync(deckFile, "utf8");
  const deckVersion = (deck.match(/SCAFFOLD_VERSION\s*=\s*"([^"]+)"/) || [])[1];
  const versions = [scaffold.version, pkg.version, deckVersion, ...(manifest ? [manifest.version] : [])];
  if (versions.some(value => !value) || new Set(versions).size !== 1) {
    throw new Error(`release version mismatch: ${JSON.stringify({ manifest: manifest?.version || "not-installed-project", scaffold: scaffold.version, package: pkg.version, deck: deckVersion })}`);
  }
  console.log(`PASS release version contract: ${scaffold.version}`);
}
function run(label, args) {
  const result = cp.spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(`FAIL ${label}\n${result.stdout || ""}${result.stderr || ""}`);
    process.exit(result.status || 1);
  }
  const last = `${result.stdout || ""}${result.stderr || ""}`.trim().split(/\r?\n/).slice(-1)[0] || "PASS";
  console.log(`PASS ${label}: ${last}`);
}
function assertThemeContract() {
  const { getTheme, themes } = require(path.join(ROOT, "theme", "tokens"));
  if (!themes?.["global-v2"]) {
    console.log("SKIP GlobalV2 theme contract: optional theme is not installed in this project");
    return;
  }
  const theme = getTheme("GlobalV2");
  const expected = {
    id: "global-v2",
    accent: "276FBF",
    primary: "192033",
    blue: "2F6BFF",
    teal: "0AA5A5",
    purple: "7C65C9",
    green: "41A66B",
    warn: "F2A541",
    danger: "DF6B6B",
    headerStyle: "reference-kicker",
    footerStyle: "reference-baseline",
    divider: "reference-index",
    cover: "reference-split",
    closing: "white-minimal"
  };
  const actual = {
    id: theme.id,
    accent: theme.colors.accent,
    primary: theme.colors.primary,
    blue: theme.colors.blue,
    teal: theme.colors.teal,
    purple: theme.colors.purple,
    green: theme.colors.green,
    warn: theme.colors.warn,
    danger: theme.colors.danger,
    headerStyle: theme.signature.headerStyle,
    footerStyle: theme.signature.footer.style,
    divider: theme.signature.divider,
    cover: theme.signature.cover,
    closing: theme.signature.closing
  };
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`GlobalV2 theme contract mismatch: ${JSON.stringify(actual)}`);
  }
  const chrome = theme.signature.header;
  const footer = theme.signature.footer;
  if (JSON.stringify(chrome.marker) !== JSON.stringify({ x: 90, y: 78, w: 33, h: 3, color: "teal" })
      || chrome.title.x !== 87 || chrome.title.y !== 117
      || chrome.subtitle.x !== 90 || chrome.subtitle.y !== 192
      || footer.x !== 87 || footer.y !== 1014 || footer.w !== 1590
      || footer.page.x !== 1752 || footer.page.y !== 1026) {
    throw new Error(`GlobalV2 reference chrome geometry mismatch: ${JSON.stringify({ chrome, footer })}`);
  }
  if (getTheme("global-v2").id !== "global-v2" || getTheme("globalv2").id !== "global-v2") {
    throw new Error("GlobalV2 aliases must resolve to global-v2");
  }
  console.log("PASS GlobalV2 theme contract");
}
assertReleaseVersion();
assertThemeContract();
function assertBase2Contract() {
  const { getTheme } = require(path.join(ROOT, "theme", "tokens"));
  const theme = getTheme("Base2");
  const expected = {
    id: "base2",
    accent: "C51516",
    primary: "07195A",
    radiusControl: 12,
    radiusInset: 14,
    radiusCard: 18,
    radiusPanel: 22,
    cardShadowOpacity: 0.14,
    cardShadowBlur: 8,
    focusShadowOpacity: 0.18,
    focusShadowBlur: 2,
    headerRule: "solid",
    footerStyle: "bar",
    divider: "big-number",
    cover: "warm-right",
    closing: "center-warm"
  };
  const actual = {
    id: theme.id,
    accent: theme.colors.accent,
    primary: theme.colors.primary,
    radiusControl: theme.shape.radius.control,
    radiusInset: theme.shape.radius.inset,
    radiusCard: theme.shape.radius.card,
    radiusPanel: theme.shape.radius.panel,
    cardShadowOpacity: theme.elevation.card.opacity,
    cardShadowBlur: theme.elevation.card.blur,
    focusShadowOpacity: theme.elevation.focus.opacity,
    focusShadowBlur: theme.elevation.focus.blur,
    headerRule: theme.signature.headerRule.style,
    footerStyle: theme.signature.footer.style,
    divider: theme.signature.divider,
    cover: theme.signature.cover,
    closing: theme.signature.closing
  };
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Base2 theme contract mismatch: ${JSON.stringify(actual)}`);
  }
  if (getTheme("base2").id !== "base2" || getTheme("base-2").id !== "base2") {
    throw new Error("Base2 aliases must resolve to base2");
  }
  if (getTheme("leander-base").signature.id !== "leander-base") {
    throw new Error("Leander Base must remain the backward-compatible default");
  }
  console.log("PASS Base2 theme contract");
}
assertBase2Contract();
function assertBase3Contract() {
  const { getTheme } = require(path.join(ROOT, "theme", "tokens"));
  const t = getTheme("Base3");
  const expected = {
    id: "base3", bg: "FFFFFF", surface2: "F4F6F8", primary: "07195A", accent: "C51516",
    blue: "1C7293", line: "D9D5CB", radiusCard: 0, radiusPanel: 0, radiusBand: 0,
    cardElevation: "none", titleColor: "primary", cover: "left-index", footerRunning: true,
    cardTop: "blue,accent,primary", iconStyle: "line"
  };
  const actual = {
    id: t.id, bg: t.colors.bg, surface2: t.colors.surface2, primary: t.colors.primary,
    accent: t.colors.accent, blue: t.colors.blue, line: t.colors.line,
    radiusCard: t.shape.radius.card, radiusPanel: t.shape.radius.panel, radiusBand: t.shape.radius.band,
    cardElevation: t.elevation.card.type, titleColor: t.signature.titleColor, cover: t.signature.cover,
    footerRunning: t.signature.footer.running, cardTop: (t.signature.cardTop.colors || []).join(","),
    iconStyle: t.signature.icon.style
  };
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Base3 theme contract mismatch: ${JSON.stringify(actual)}`);
  }
  if (getTheme("base3").id !== "base3" || getTheme("base-3").id !== "base3") {
    throw new Error("Base3 aliases must resolve to base3");
  }
  const r = getTheme("base3").shape.radius;
  for (const k of ["micro", "control", "inset", "card", "panel", "band"]) {
    if (r[k] !== 0) throw new Error(`Base3 must stay flat: radius.${k} should be 0, got ${r[k]}`);
  }
  console.log("PASS Base3 theme contract");
}
assertBase3Contract();
function assertStateFlowContract() {
  const componentFile = path.join(ROOT, "components", "ppt-components.js");
  const registryFile = path.join(ROOT, "tools", "component-registry.json");
  const source = fs.readFileSync(componentFile, "utf8");
  const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
  const stateFlow = (registry.components || []).find(item => item.name === "stateFlow");
  if (!stateFlow || stateFlow.relationPrimitive !== "state-transition") {
    throw new Error("stateFlow registry must declare the state-transition primitive");
  }
  if (!stateFlow.slots.includes("currentState") || !stateFlow.slots.includes("exceptionState")) {
    throw new Error("stateFlow registry must expose currentState and exceptionState");
  }
  if (!source.includes("current: C.accent") || !source.includes("const currentState = data.currentState")) {
    throw new Error("stateFlow renderer must implement explicit current-state semantics");
  }
  if (!source.includes('s.status === "current"') || !source.includes("failed: C.danger")) {
    throw new Error("stateFlow current and failed semantics must remain distinct");
  }
  console.log("PASS stateFlow current/failed semantic contract");
}
assertStateFlowContract();
function assertBlueprintRendererContract() {
  const { buildScene, BUILDERS } = require(path.join(ROOT, "tools", "render-layout-blueprint"));
  const { lintScene } = require(path.join(ROOT, "tools", "blueprint-geometry"));
  if (typeof BUILDERS["tension-bridge"] !== "function") {
    throw new Error("tension-bridge blueprint renderer must remain registered");
  }
  const preview = buildScene({
    page: "p02",
    title: "Governance gap",
    skeletonFamily: "tension-bridge",
    complexityBudget: "high"
  });
  const result = lintScene(preview);
  if (preview.rendererError || result.verdict !== "PASS") {
    throw new Error(`tension-bridge preview must remain geometrically valid: ${JSON.stringify(result.findings || [])}`);
  }
  console.log("PASS tension-bridge blueprint renderer contract");
}
assertBlueprintRendererContract();
const scripts = fs.readdirSync(TOOLS).filter(name => name.endsWith(".js")).sort();
scripts.forEach(name => run(`syntax ${name}`, ["--check", path.join(TOOLS, name)]));
const behaviors = [
  ["environment doctor bounded probes", "environment-doctor.js"],
  ["rollout usage", "rollout-usage.js"], ["token ledger", "token-ledger.js"], ["context budget", "context-budget-gate.js"],
  ["page digests", "page-digests.js"], ["change impact", "change-impact.js"], ["QA result", "verify-qa-result.js"],
  ["QA batch specificity", "qa-batch.js"], ["page preflight extensions", "verify-page-preflight.js"], ["component contract", "component-contract.js"],
  ["component metadata overrides", "lint-component-metadata-overrides.js"], ["component metadata audit", "component-metadata-audit.js"],
  ["visual route competition", "select-visual-route.js"], ["visual selection diversity", "visual-selection-diversity.js"], ["render risk", "render-risk.js"],
  ["render diversity", "render-diversity.js"], ["grounded full-size inspection", "render-quality-gate.js"], ["agent independence", "verify-agent-collaboration.js"],
  ["approval receipt", "approval-receipt.js"], ["source evidence", "verify-source-evidence.js"], ["agent run receipt", "agent-run-receipt.js"],
  ["final artifact pixels", "final-artifact-gate.js"], ["gate adversarial suite", "gate-adversarial-suite.js"],
  ["agent collaboration migration", "migrate-agent-collaboration-v3.js"], ["hard Gate contract", "hard-gate-contract.js"],
  ["hard Gate adversarial black-box", "hard-gate-blackbox.js"], ["revision mode", "revision-mode.js"],
  ["workflow gate carry-forward", "workflow-gate.js"], ["candidate harvest", "candidate-harvest.js"]
];
behaviors.forEach(([label, file]) => run(label, [path.join(TOOLS, file), "--self-test"]));
console.log(`PASS Leander regression suite: ${scripts.length} syntax checks, ${behaviors.length} behavior tests.`);
