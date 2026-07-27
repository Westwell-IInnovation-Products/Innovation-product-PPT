const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");
const { pathToFileURL } = require("url");

function firstExisting(items) { return items.filter(Boolean).find(item => fs.existsSync(item)) || ""; }
function onPath(name) {
  try {
    const command = process.platform === "win32" ? "where.exe" : "which";
    return cp.execFileSync(command, [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split(/\r?\n/).find(Boolean) || "";
  } catch { return ""; }
}
function findWinGetPoppler() {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) return "";
  const packages = path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
  if (!fs.existsSync(packages)) return "";
  for (const entry of fs.readdirSync(packages)) {
    if (!/^oschwartz.*Poppler/i.test(entry)) continue;
    const root = path.join(packages, entry);
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      for (const child of fs.readdirSync(current, { withFileTypes: true })) {
        const abs = path.join(current, child.name);
        if (child.isDirectory()) stack.push(abs);
        else if (/^pdftoppm\.exe$/i.test(child.name)) return abs;
      }
    }
  }
  return "";
}
function resolveToolchain() {
  const soffice = firstExisting([
    process.env.SOFFICE_PATH,
    onPath(process.platform === "win32" ? "soffice.exe" : "soffice"),
    process.platform === "win32" ? path.join(process.env.ProgramFiles || "", "LibreOffice", "program", "soffice.exe") : "",
    process.platform === "win32" ? path.join(process.env["ProgramFiles(x86)"] || "", "LibreOffice", "program", "soffice.exe") : ""
  ]);
  const pdftoppm = firstExisting([
    process.env.PDFTOPPM_PATH,
    onPath(process.platform === "win32" ? "pdftoppm.exe" : "pdftoppm"),
    findWinGetPoppler()
  ]);
  return { soffice, pdftoppm };
}
function libreOfficeProfile(prefix = "leander") {
  const dir = path.join(os.tmpdir(), `${prefix}_${process.pid}_${Date.now()}`);
  return pathToFileURL(dir).href;
}
function requireToolchain() {
  const tools = resolveToolchain();
  const missing = Object.entries(tools).filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Missing render tool(s): ${missing.join(", ")}. Set SOFFICE_PATH/PDFTOPPM_PATH or add them to PATH.`);
  return tools;
}

module.exports = { resolveToolchain, requireToolchain, libreOfficeProfile };
