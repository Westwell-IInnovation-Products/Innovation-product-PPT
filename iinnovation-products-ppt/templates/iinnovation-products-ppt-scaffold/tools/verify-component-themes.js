// Merge real-render manifests into component theme compatibility metadata.
// Usage: node tools/verify-component-themes.js <manifest> <manifest> [...] [--write]
const fs = require("fs");
const path = require("path");
const registryFile = path.join(__dirname, "component-registry.json");
function read(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function successful(manifest) { return new Set((manifest.manifest || []).filter(item => ["rendered", "rendered-blocked"].includes(item.status)).map(item => item.name)); }
function main() {
  const files = process.argv.slice(2).filter(arg => arg !== "--write");
  if (files.length < 2) { console.error("usage: node tools/verify-component-themes.js <manifest> <manifest> [...] [--write]"); process.exit(1); }
  const manifests = files.map(file => read(path.resolve(file)));
  if (manifests.some(item => !item.theme)) { console.error("every manifest must declare a theme"); process.exit(1); }
  if (new Set(manifests.map(item => item.theme)).size !== manifests.length) { console.error("manifest themes must be unique"); process.exit(1); }
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
