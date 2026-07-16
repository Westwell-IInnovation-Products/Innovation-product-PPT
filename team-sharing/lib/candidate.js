const fs = require("fs");
const path = require("path");

const REQUIRED_FILES = ["candidate.json", "component.js", "preview.svg", "README.md"];
const REQUIRED_METADATA = [
  "id", "name", "contributor", "version", "status", "level", "route",
  "relationships", "tags", "density", "editable", "composable",
  "relationPrimitive", "expressionCapability", "semanticBindings", "slots",
  "variants", "avoidWhen", "qaRisks", "themeTokensUsed", "contentCapacity",
  "themeCompatibility", "metadataSource", "metadataReviewStatus",
  "selectionConfidenceCap", "designStatus", "designReviewPriority"
];
const TEXT_FILES = new Set([".json", ".js", ".md", ".svg", ".txt"]);
const FORBIDDEN_SOURCE_PATTERNS = [
  { rule: "absolute-local-path", regex: /(^|[\s"'=(])[A-Za-z]:[\\/]/m },
  { rule: "path-traversal", regex: /(^|[\s"'])\.\.[\\/]/m },
  { rule: "github-token", regex: /(?:ghp_|github_pat_)[A-Za-z0-9_]{12,}/ },
  { rule: "openai-token", regex: /\bsk-[A-Za-z0-9_-]{16,}/ },
  { rule: "aws-key", regex: /\bAKIA[A-Z0-9]{16}\b/ },
  { rule: "private-key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { rule: "unsafe-node-api", regex: /require\s*\(\s*["'](?:child_process|fs|net|tls|http|https)["']\s*\)/ }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else files.push(absolute);
  }
  return files;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string" && item.trim());
}

function validateCandidate(candidateDir, options = {}) {
  const root = path.resolve(candidateDir);
  const findings = [];
  const add = (rule, file, message) => findings.push({
    rule,
    file: path.relative(root, file).replace(/\\/g, "/") || ".",
    message
  });

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return { ok: false, root, metadata: null, findings: [{ rule: "missing-directory", file: ".", message: "Candidate directory does not exist." }] };
  }

  for (const name of REQUIRED_FILES) {
    const file = path.join(root, name);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) add("missing-file", file, `Required file is missing: ${name}`);
  }
  if (findings.some(item => item.rule === "missing-file")) return { ok: false, root, metadata: null, findings };

  let metadata = null;
  const metadataFile = path.join(root, "candidate.json");
  try {
    metadata = readJson(metadataFile);
  } catch (error) {
    add("invalid-json", metadataFile, error.message);
    return { ok: false, root, metadata: null, findings };
  }

  for (const field of REQUIRED_METADATA) {
    if (metadata[field] == null || metadata[field] === "") add("missing-field", metadataFile, `candidate.json is missing ${field}`);
  }
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(metadata.id || "")) add("invalid-id", metadataFile, "id must use lowercase kebab-case and be 3-64 characters.");
  if (!/^[A-Za-z][A-Za-z0-9]{2,63}$/.test(metadata.name || "")) add("invalid-name", metadataFile, "name must be a JavaScript-safe component name.");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(metadata.contributor || "")) add("invalid-contributor", metadataFile, "contributor must be a GitHub-style login.");
  if (metadata.status !== "candidate") add("invalid-status", metadataFile, "New submissions must use status=candidate.");
  if (metadata.route !== "component-library") add("invalid-route", metadataFile, "route must be component-library.");
  if (metadata.designStatus !== "review-required") add("unsafe-design-status", metadataFile, "Candidates must remain review-required until curator approval.");
  if (metadata.metadataReviewStatus !== "pending") add("unsafe-review-status", metadataFile, "Candidates must use metadataReviewStatus=pending.");
  if (typeof metadata.selectionConfidenceCap !== "number" || metadata.selectionConfidenceCap > 0.5) add("unsafe-confidence", metadataFile, "Unreviewed candidates must cap selection confidence at 0.5 or below.");

  for (const field of ["relationships", "tags", "semanticBindings", "slots", "variants", "avoidWhen", "qaRisks", "themeTokensUsed", "themeCompatibility"]) {
    if (!isStringArray(metadata[field])) add("invalid-array", metadataFile, `${field} must be a non-empty string array.`);
  }
  if (!metadata.contentCapacity || typeof metadata.contentCapacity !== "object") add("invalid-capacity", metadataFile, "contentCapacity must be an object.");

  if (options.expectedContributor && metadata.contributor !== options.expectedContributor) {
    add("contributor-mismatch", metadataFile, `Expected contributor ${options.expectedContributor}, got ${metadata.contributor}.`);
  }
  if (options.expectedId && metadata.id !== options.expectedId) {
    add("id-mismatch", metadataFile, `Expected id ${options.expectedId}, got ${metadata.id}.`);
  }

  const denyTerms = (options.denyTerms || []).filter(term => typeof term === "string" && term.trim());
  for (const file of walk(root)) {
    const relative = path.relative(root, file);
    if (relative.split(path.sep).includes("node_modules")) continue;
    if (!TEXT_FILES.has(path.extname(file).toLowerCase())) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
      if (pattern.regex.test(text)) add(pattern.rule, file, `Forbidden pattern detected: ${pattern.rule}`);
    }
    for (const term of denyTerms) {
      if (text.toLocaleLowerCase().includes(term.toLocaleLowerCase())) add("deny-term", file, `Project-specific deny term detected: ${term}`);
    }
  }

  const previewFile = path.join(root, "preview.svg");
  if (fs.statSync(previewFile).size > 1024 * 1024) add("preview-too-large", previewFile, "preview.svg must be 1 MiB or smaller.");

  const componentFile = path.join(root, "component.js");
  try {
    delete require.cache[require.resolve(componentFile)];
    const component = require(componentFile);
    if (!component || component.name !== metadata.name || typeof component.create !== "function") {
      add("invalid-module", componentFile, "component.js must export { name, create } matching candidate.json.");
    }
  } catch (error) {
    add("invalid-module", componentFile, error.message);
  }

  return { ok: findings.length === 0, root, metadata, findings };
}

function candidateRegistryEntry(metadata, approval) {
  const approved = approval && approval.approveForProduction === true;
  return {
    name: metadata.name,
    library: "extensions",
    route: metadata.route,
    relationships: metadata.relationships,
    tags: metadata.tags,
    density: metadata.density,
    level: metadata.level,
    relationPrimitive: metadata.relationPrimitive,
    expressionCapability: metadata.expressionCapability,
    semanticBindings: metadata.semanticBindings,
    editable: metadata.editable,
    composable: metadata.composable,
    slots: metadata.slots,
    variants: metadata.variants,
    avoidWhen: metadata.avoidWhen,
    qaRisks: metadata.qaRisks,
    themeTokensUsed: metadata.themeTokensUsed,
    contentCapacity: metadata.contentCapacity,
    themeCompatibility: approved ? ["leander-base", "leander-global"] : [],
    metadataSource: "manual",
    metadataReviewStatus: approved ? "manual-reviewed" : "pending",
    selectionConfidenceCap: approved ? 0.82 : Math.min(metadata.selectionConfidenceCap, 0.5),
    designStatus: approved ? "usable" : "review-required",
    designReviewPriority: metadata.designReviewPriority,
    contribution: {
      id: metadata.id,
      contributor: metadata.contributor,
      version: metadata.version,
      curator: approval.curator,
      approvedAt: approval.approvedAt
    }
  };
}

module.exports = {
  REQUIRED_FILES,
  REQUIRED_METADATA,
  readJson,
  validateCandidate,
  candidateRegistryEntry
};
