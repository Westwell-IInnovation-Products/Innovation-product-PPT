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
assertReleaseVersion();
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
    railThickness: 6,
    railEdgeInset: 1,
    railCrossInset: 12,
    reviewRail: "blue",
    blockedRail: "danger",
    statusCardFill: "surface",
    activeStateFill: "accentSoft",
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
    railThickness: theme.rail.thickness,
    railEdgeInset: theme.rail.edgeInset,
    railCrossInset: theme.rail.crossInset,
    reviewRail: theme.rail.meanings.review,
    blockedRail: theme.rail.meanings.blocked,
    statusCardFill: theme.componentStyle.statusCard.fill,
    activeStateFill: theme.componentStyle.activeState.fill,
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
function assertBase2ComponentContract() {
  const { loadComponentRuntime } = require(path.join(ROOT, "tools", "component-runtime"));
  const runtime = loadComponentRuntime("base2");
  for (const name of ["surface", "semanticRail", "insetRow", "statusCard", "semanticConclusion", "base2GovernanceChain"]) {
    if (typeof runtime.components[name] !== "function") throw new Error(`Base2 renderer missing: ${name}`);
  }
  const fakeSlide = {
    addShape() {},
    addText() {}
  };
  const review = runtime.components.statusCard(fakeSlide, 0, 0, 320, 100, {
    state: "review",
    active: true,
    title: "Review"
  });
  const blocked = runtime.components.statusCard(fakeSlide, 0, 0, 320, 100, {
    state: "blocked",
    title: "Blocked"
  });
  const high = runtime.components.statusCard(fakeSlide, 0, 0, 320, 100, {
    state: "high",
    title: "High"
  });
  if (review.active || review.surfaceRole !== "statusCard" || review.railMeaning !== "review") {
    throw new Error(`Base2 review must remain neutral with a blue rail: ${JSON.stringify(review)}`);
  }
  if (!blocked.active || blocked.surfaceRole !== "activeState") {
    throw new Error(`Base2 blocked state must use the active red surface: ${JSON.stringify(blocked)}`);
  }
  if (!high.active || high.surfaceRole !== "activeState" || high.railMeaning !== "blocked") {
    throw new Error(`Base2 high state must normalize to blocked danger semantics: ${JSON.stringify(high)}`);
  }
  const reviewRail = runtime.components.semanticRail(fakeSlide, 0, 0, 320, 100, "review");
  if (reviewRail.color !== runtime.theme.colors.blue || reviewRail.edgeInset !== 1 || reviewRail.crossInset !== 12) {
    throw new Error(`Base2 review rail geometry/meaning drifted: ${JSON.stringify(reviewRail)}`);
  }
  const highRail = runtime.components.semanticRail(fakeSlide, 0, 0, 320, 100, "high");
  if (highRail.color !== runtime.theme.colors.danger) {
    throw new Error(`Base2 high rail must normalize to danger: ${JSON.stringify(highRail)}`);
  }
  console.log("PASS Base2 component and state semantic contract");
}
assertBase2ComponentContract();
function assertCrossThemeStateSemantics() {
  const { loadComponentRuntime } = require(path.join(ROOT, "tools", "component-runtime"));
  const expected = {
    "leander-base": { review: "blue", blocked: "danger", blockedSurface: "FBECEB" },
    base2: { review: "blue", blocked: "danger", blockedSurface: "FBECEB" },
    "leander-global": { review: "blue", blocked: "danger", blockedSurface: "FBECEB" }
  };
  for (const [themeId, contract] of Object.entries(expected)) {
    const runtime = loadComponentRuntime(themeId);
    const capture = (state, extra = {}) => {
      const shapes = [];
      const slide = {
        addShape(type, options) {
          shapes.push({
            fill: options?.fill?.color || "",
            line: options?.line?.color || ""
          });
        },
        addText() {}
      };
      const result = runtime.components.statusCard(slide, 0, 0, 320, 100, { state, title: state, ...extra });
      return { result, surface: shapes[0] || {}, rail: shapes[1] || {} };
    };
    const review = capture("review", { active: true });
    const blocked = capture("blocked");
    const high = capture("high");
    const explicitActive = capture(undefined, { active: true, title: "active" });
    if (review.result.active || review.surface.fill !== runtime.theme.colors.surface || review.rail.fill !== runtime.theme.colors[contract.review]) {
      throw new Error(`${themeId} review must remain neutral with a blue rail: ${JSON.stringify(review)}`);
    }
    if (!blocked.result.active || blocked.surface.fill !== contract.blockedSurface || blocked.rail.fill !== runtime.theme.colors[contract.blocked]) {
      throw new Error(`${themeId} blocked must use danger semantics: ${JSON.stringify(blocked)}`);
    }
    if (!high.result.active || high.result.railMeaning !== "blocked" || high.surface.fill !== contract.blockedSurface || high.rail.fill !== runtime.theme.colors[contract.blocked]) {
      throw new Error(`${themeId} high must normalize to danger semantics: ${JSON.stringify(high)}`);
    }
    if (!explicitActive.result.active || explicitActive.result.railMeaning !== "blocked" || explicitActive.surface.fill !== contract.blockedSurface || explicitActive.rail.fill !== runtime.theme.colors[contract.blocked]) {
      throw new Error(`${themeId} explicit active must use one coherent danger state: ${JSON.stringify(explicitActive)}`);
    }
    const barShapes = [];
    runtime.components.barCard({
      addShape(type, options) {
        barShapes.push({
          fill: options?.fill?.color || "",
          line: options?.line?.color || ""
        });
      },
      addText() {}
    }, 0, 0, 320, 100, { tier: "high", label: "Blocked" });
    if (barShapes[0]?.line !== runtime.theme.colors.danger || barShapes[1]?.fill !== runtime.theme.colors.danger) {
      throw new Error(`${themeId} high/blocked barCard must use danger semantics: ${JSON.stringify(barShapes)}`);
    }
  }
  console.log("PASS cross-theme review/blocked state semantic contract");
}
assertCrossThemeStateSemantics();
function assertThemeFidelityContract() {
  const { getTheme } = require(path.join(ROOT, "theme", "tokens"));
  const { loadComponentRuntime } = require(path.join(ROOT, "tools", "component-runtime"));
  const global = getTheme("leander-global");
  if (global.contentFidelity?.id !== "leander-global") throw new Error("Global theme must expose its content-fidelity profile");
  for (const feature of ["evidence-dominant-main", "compact-kpi-rail", "engineering-variable-table", "delta-comparison", "pending-simulation-state"]) {
    if (!global.contentFidelity.features[feature]) throw new Error(`Global content-fidelity feature missing: ${feature}`);
  }
  const runtime = loadComponentRuntime("leander-global");
  for (const name of ["evidenceBoard", "compactKpiRail", "engineeringVariableTable", "deltaCompare"]) {
    if (typeof runtime.components[name] !== "function") throw new Error(`Shared high-capacity renderer missing: ${name}`);
  }
  const base2 = getTheme("base2");
  for (const feature of ["layered-evidence-board", "state-rail", "tiered-radius-depth", "region-eyebrows", "semantic-focus-panel", "decision-band"]) {
    if (!base2.contentFidelity.features[feature]) throw new Error(`Base2 content-fidelity feature missing: ${feature}`);
  }
  if (!base2.contentFidelity.componentFeatureMap.base2GovernanceChain?.includes("decision-band")) {
    throw new Error("Base2 governance-chain renderer must map to the decision-band fidelity feature");
  }
  console.log("PASS theme fidelity profile and shared renderer contract");
}
assertThemeFidelityContract();
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
  ["theme content fidelity profiles", path.join(ROOT, "theme", "content-fidelity.js")],
  ["theme fidelity negative/positive fixtures", "verify-theme-fidelity.js"],
  ["environment doctor bounded probes", "environment-doctor.js"],
  ["rollout usage", "rollout-usage.js"], ["token ledger", "token-ledger.js"], ["context budget", "context-budget-gate.js"],
  ["page digests", "page-digests.js"], ["change impact", "change-impact.js"], ["QA result", "verify-qa-result.js"],
  ["QA batch specificity", "qa-batch.js"], ["page preflight extensions", "verify-page-preflight.js"], ["component contract", "component-contract.js"],
  ["component metadata overrides", "lint-component-metadata-overrides.js"], ["component metadata audit", "component-metadata-audit.js"],
  ["visual route competition", "select-visual-route.js"], ["visual selection diversity", "visual-selection-diversity.js"], ["render risk", "render-risk.js"],
  ["render diversity", "render-diversity.js"], ["render geometry typography and vertical balance", "render-geometry-audit.js"], ["grounded full-size inspection", "render-quality-gate.js"], ["agent independence", "verify-agent-collaboration.js"],
  ["approval receipt", "approval-receipt.js"], ["source evidence", "verify-source-evidence.js"], ["agent run receipt", "agent-run-receipt.js"],
  ["final artifact pixels", "final-artifact-gate.js"], ["gate adversarial suite", "gate-adversarial-suite.js"],
  ["agent collaboration migration", "migrate-agent-collaboration-v3.js"], ["hard Gate contract", "hard-gate-contract.js"],
  ["hard Gate adversarial black-box", "hard-gate-blackbox.js"], ["revision mode", "revision-mode.js"], ["requirements trace", "requirements-trace.js"],
  ["workflow gate carry-forward", "workflow-gate.js"]
];
behaviors.forEach(([label, file]) => run(label, [path.isAbsolute(file) ? file : path.join(TOOLS, file), "--self-test"]));
console.log(`PASS Innovation-Products_ppt regression suite: ${scripts.length} syntax checks, ${behaviors.length} behavior tests.`);
