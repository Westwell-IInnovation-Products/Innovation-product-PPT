// Merge two real-render manifests into component theme compatibility metadata.
// Usage: node tools/verify-component-themes.js <base-manifest> <global-manifest> [--write]
const fs = require("fs");
const path = require("path");
const registryFile = path.join(__dirname, "component-registry.json");
function read(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function successful(manifest) { return new Set((manifest.manifest || []).filter(item => ["rendered", "rendered-blocked"].includes(item.status)).map(item => item.name)); }
function main() {
  const baseFile = process.argv[2], globalFile = process.argv[3];
  if (!baseFile || !globalFile) { console.error("usage: node tools/verify-component-themes.js <base-manifest> <global-manifest> [--write]"); process.exit(1); }
  const manifests = [read(path.resolve(baseFile)), read(path.resolve(globalFile))];
  const byTheme = new Map(manifests.map(item => [item.theme, successful(item)]));
  const registry = read(registryFile), report = [];
  registry.components = registry.components.map(component => {
    const compatibility = [...byTheme.entries()].filter(([, names]) => names.has(component.name)).map(([theme]) => theme).sort();
    report.push({ name: component.name, compatibility, missing: [...byTheme.keys()].filter(theme => !compatibility.includes(theme)) });
    return { ...component, themeCompatibility: compatibility };
  });
  const missing = report.filter(item => item.missing.length);
  if (process.argv.includes("--write")) fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ version: "component-theme-compatibility.v1", themes: [...byTheme.keys()], components: report.length, fullCompatibility: report.length - missing.length, missing }, null, 2));
  if (missing.length) process.exitCode = 1;
}
main();
