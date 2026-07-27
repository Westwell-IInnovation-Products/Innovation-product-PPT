// Component library lint for maintenance work.
// This is intentionally not part of the normal deck production path.
// Usage:
//   node tools/lint-component-library.js
//   node tools/lint-component-library.js --strict
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { NON_SELECTABLE_STATUSES, loadComponentRuntime, rendererStatus } = require("./component-runtime");

const ROOT = path.join(__dirname, "..");
const registryPath = path.join(__dirname, "component-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8").replace(/^\uFEFF/, ""));
const strict = process.argv.includes("--strict");

const requiredFields = [
  "level",
  "relationPrimitive",
  "expressionCapability",
  "semanticBindings",
  "editable",
  "composable",
  "slots",
  "variants",
  "avoidWhen",
  "qaRisks",
  "themeTokensUsed",
  "contentCapacity",
  "themeCompatibility",
  "metadataSource",
  "metadataReviewStatus",
  "selectionConfidenceCap",
  "designStatus",
  "designReviewPriority"
];

const allowedLiteralHex = new Set([
  "FFFFFF", // inverse text or white stroke on dark fills
  "000000"  // rarely used by imported assets; should still be reviewed manually
]);

const tokenFiles = [
  path.join(ROOT, "theme", "tokens.js"),
  path.join(ROOT, "theme", "leander-global.js")
];

function collectThemeHex() {
  const set = new Set();
  tokenFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/["']([A-Fa-f0-9]{6})["']/g)) set.add(m[1].toUpperCase());
  });
  return set;
}

function listComponentFiles() {
  const dir = path.join(ROOT, "components");
  const files = [];
  function walk(current) {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (/\.js$/i.test(entry.name)) files.push(absolute);
    });
  }
  walk(dir);
  return files.sort((a, b) => a.localeCompare(b));
}

function scanHardcodedColors(themeHex) {
  const findings = [];
  listComponentFiles().forEach(file => {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const m of line.matchAll(/["']([A-Fa-f0-9]{6})["']/g)) {
        const color = m[1].toUpperCase();
        if (themeHex.has(color) || allowedLiteralHex.has(color)) continue;
        findings.push({
          file: rel,
          line: idx + 1,
          color,
          message: "Hard-coded color should become a theme token or an explicitly allowed inverse/status value."
        });
      }
    });
  });
  return findings;
}

function syntaxFindings() {
  return listComponentFiles().flatMap(file => {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const res = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (res.status === 0) return [];
    return [{
      file: rel,
      message: "Component file failed node --check.",
      detail: (res.stderr || res.stdout || "").split(/\r?\n/).slice(0, 5).join("\n")
    }];
  });
}

function coverage() {
  const total = registry.components.length;
  return requiredFields.map(field => {
    const count = registry.components.filter(c => {
      const value = c[field];
      if (field === "themeCompatibility") return Array.isArray(value);
      return Array.isArray(value) ? value.length > 0 : value != null && value !== "";
    }).length;
    return { field, count, total, ok: count === total };
  });
}

function metadataFindings() {
  const out = [];
  registry.components.forEach(c => {
    requiredFields.forEach(field => {
      const value = c[field];
      const missing = Array.isArray(value) ? value.length === 0 : value == null || value === "";
      if (missing) out.push({ component: c.name, field, message: "Missing component metadata." });
    });
    if (c.level === "page-pattern" && c.composable === "high") {
      out.push({ component: c.name, field: "composable", message: "Page patterns should not be high-composable; extract layout blocks or visual parts instead." });
    }
    if (c.route === "image2" && c.editable === "yes") {
      out.push({ component: c.name, field: "editable", message: "image2 routes should be partial or no editability." });
    }
    if (c.designStatus === "usable" && c.metadataReviewStatus === "pending") {
      out.push({ component: c.name, field: "metadataReviewStatus", message: "A usable component cannot rely on pending inferred metadata." });
    }
    if (!(c.selectionConfidenceCap > 0 && c.selectionConfidenceCap <= 1)) {
      out.push({ component: c.name, field: "selectionConfidenceCap", message: "Selection confidence cap must be in (0, 1]." });
    }
    if (!c.contentCapacity || !(c.contentCapacity.maxItems > 0)) {
      out.push({ component: c.name, field: "contentCapacity", message: "Component must declare a positive maxItems capacity." });
    }
  });
  return out;
}

function rendererFindings() {
  const runtime = loadComponentRuntime();
  return registry.components.flatMap(c => {
    const status = rendererStatus(c, runtime);
    if (status.hasRenderer) return [];
    if (NON_SELECTABLE_STATUSES.has(c.designStatus || "")) return [];
    return [{
      component: c.name,
      field: "renderer",
      route: c.route,
      designStatus: c.designStatus || "usable",
      message: status.reason,
      fix: "Move the page-specific drawing into a reusable component factory, or mark it needs-renderer/planned and remove it from selection."
    }];
  });
}

function rendererCoverage() {
  const runtime = loadComponentRuntime();
  const rows = registry.components.map(c => ({
    name: c.name,
    route: c.route,
    designStatus: c.designStatus || "usable",
    ...rendererStatus(c, runtime)
  }));
  const componentRows = rows.filter(r => r.route === "component-library");
  return {
    total: registry.components.length,
    componentLibraryTotal: componentRows.length,
    renderable: componentRows.filter(r => r.renderStatus === "renderable").length,
    noRenderer: componentRows.filter(r => r.renderStatus === "no-renderer").length,
    nonSelectable: rows.filter(r => !r.selectable).length,
    rows
  };
}

const themeHex = collectThemeHex();
const componentRendererCoverage = rendererCoverage();
const report = {
  version: "component-library-lint.v1",
  generatedAt: new Date().toISOString(),
  componentCount: registry.components.length,
  syntaxFindings: syntaxFindings(),
  metadataCoverage: coverage(),
  metadataFindings: metadataFindings(),
  rendererCoverage: componentRendererCoverage,
  rendererFindings: rendererFindings(),
  hardcodedColorFindings: scanHardcodedColors(themeHex)
};

const outPath = path.join(ROOT, "output", "component-library-lint.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(`# Component Library Lint`);
console.log(`components: ${report.componentCount}`);
console.log(`syntax findings: ${report.syntaxFindings.length}`);
report.syntaxFindings.forEach(f => console.log(`FAIL ${f.file} ${f.message}`));
report.metadataCoverage.forEach(row => {
  console.log(`${row.ok ? "OK" : "WARN"} metadata ${row.field}: ${row.count}/${row.total}`);
});
console.log(`metadata findings: ${report.metadataFindings.length}`);
console.log(`renderer coverage: ${componentRendererCoverage.renderable}/${componentRendererCoverage.componentLibraryTotal} renderable, ${componentRendererCoverage.noRenderer} no-renderer`);
report.rendererFindings.forEach(f => console.log(`FAIL ${f.component} ${f.message}`));
console.log(`hard-coded color findings: ${report.hardcodedColorFindings.length}`);
if (report.hardcodedColorFindings.length) {
  report.hardcodedColorFindings.slice(0, 20).forEach(f => {
    console.log(`WARN ${f.file}:${f.line} ${f.color} ${f.message}`);
  });
  if (report.hardcodedColorFindings.length > 20) {
    console.log(`... ${report.hardcodedColorFindings.length - 20} more`);
  }
}
console.log(`wrote ${path.relative(process.cwd(), outPath)}`);

if (strict && (report.syntaxFindings.length || report.metadataFindings.length || report.rendererFindings.length || report.hardcodedColorFindings.length)) {
  process.exit(1);
}
