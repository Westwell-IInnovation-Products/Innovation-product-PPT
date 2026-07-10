// Prevent project-specific facts from leaking into the reusable Leander-PPT skill.
// Usage:
//   node tools/lint-scope-hygiene.js --skill-root <path>
//   node tools/lint-scope-hygiene.js --self-test
const fs = require("fs");
const path = require("path");

const DEFAULT_SKILL_ROOT = path.resolve(__dirname, "../../..");
const TEXT_EXTENSIONS = new Set([".md", ".js", ".json", ".py", ".ps1", ".sh"]);
const EXCLUDED_DIRS = new Set([
  "node_modules", "output", "archive", ".git", "assets", "source", "feedback"
]);

function parseArgs(argv) {
  const args = { skillRoot: DEFAULT_SKILL_ROOT, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--skill-root" && argv[i + 1]) args.skillRoot = path.resolve(argv[++i]);
    else if (argv[i] === "--self-test") args.selfTest = true;
  }
  return args;
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, files);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(abs);
  }
  return files;
}

function isExplicitExample(line) {
  return /(示例|例如|example|历史案例|占位|placeholder)/i.test(line);
}

function inspectText(text, file = "<memory>") {
  const findings = [];
  const lines = String(text).replace(/^\uFEFF/, "").split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const normalized = line.replace(/\\/g, "/");
    const add = (rule, message) => findings.push({ file, line: lineNo, rule, message, sample: line.trim().slice(0, 180) });

    // User or workspace paths make a shared skill non-portable. Skill-root examples
    // may appear in explicit examples, but executable template code may not hard-code them.
    if (/[A-Za-z]:\/[\w\u4e00-\u9fff ._()\-]+\//.test(normalized)) {
      const executable = /\.(js|py|ps1|sh)$/i.test(file);
      const portableSkillExample = /\.codex\/skills\//i.test(normalized) && isExplicitExample(line);
      if (executable || !portableSkillExample) add("absolute-local-path", "共享规则或脚本中出现绝对本地路径。请改为项目根目录、环境变量或工具发现。" );
    }

    // A stable gate must not depend on one historical renderer revision.
    if (/layout-blueprint-[^\s"'`]*-v\d+/i.test(line)) {
      add("versioned-artifact-name", "通用门禁依赖带版本号的固定蓝图产物名。请使用稳定文件名并把版本写入文件内容。" );
    }

    // Page-specific instructions are allowed only in clearly marked examples.
    if (/\bP(?:[4-9]|\d{2,3})\b/.test(line) && /(必须|改成|删除|移动|使用|放在|修复)/.test(line) && !isExplicitExample(line)) {
      add("unmarked-page-specific-rule", "疑似把单页修复写成通用规则；请抽象为关系、表达模式或风险类型，或明确标注为示例。" );
    }
  });
  return findings;
}

function inspectSkill(skillRoot) {
  const targets = [path.join(skillRoot, "SKILL.md"), path.join(skillRoot, "references"), path.join(skillRoot, "templates")];
  const files = targets
    .flatMap(target => fs.existsSync(target) && fs.statSync(target).isDirectory() ? walk(target) : [target])
    .filter(fs.existsSync)
    .filter(file => !["lint-scope-hygiene.js", "SCOPE-HYGIENE.md"].includes(path.basename(file)));
  return files.flatMap(file => inspectText(fs.readFileSync(file, "utf8"), file));
}

function selfTest() {
  const clean = "示例：P12 可以作为页面状态展开的一个历史案例。\nconst root = path.join(__dirname, '..');";
  const leaking = "P12 必须改成当前项目的结构。\nconst exe = 'C:/Users/example/AppData/tool.exe';\nconst qa = 'layout-blueprint-preview-qa-v9.json';";
  const cleanFindings = inspectText(clean, "clean.md");
  const leakFindings = inspectText(leaking, "leak.js");
  if (cleanFindings.length !== 0 || leakFindings.length !== 3) {
    console.error(JSON.stringify({ cleanFindings, leakFindings }, null, 2));
    process.exit(1);
  }
  console.log("PASS scope hygiene self-test");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) return selfTest();
  const findings = inspectSkill(args.skillRoot);
  if (findings.length) {
    console.error(`FIX-FIRST scope hygiene: ${findings.length} issue(s)`);
    findings.forEach(item => console.error(`- ${item.rule} ${item.file}:${item.line} ${item.message}\n  ${item.sample}`));
    process.exit(1);
  }
  console.log(`PASS scope hygiene: ${args.skillRoot}`);
}

if (require.main === module) main();
module.exports = { inspectText, inspectSkill };
