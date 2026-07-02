// Optional Claude Code Stop-hook guard. Tied to THIS deck via its own location.
// Wire it in the project's .claude/settings.json:
//   { "hooks": { "Stop": [ { "matcher": "", "hooks": [
//       { "type": "command", "command": "node \"<abs path>/build/tools/stop-hook.js\"" } ] } ] } }
// On stop it runs the QA gate for this deck; a non-zero exit blocks completion and feeds the failures back.
const path = require("path"), fs = require("fs"), cp = require("child_process");
const deckDir = path.join(__dirname, "..");
if (!fs.existsSync(path.join(deckDir, "deck.config.js")) || !fs.existsSync(path.join(deckDir, "pages"))) process.exit(0); // not a deck → no-op
try {
  cp.execFileSync(process.execPath, [path.join(__dirname, "deck.js"), "verify"], { cwd: deckDir, stdio: "inherit" });
} catch (e) {
  console.error("\n[leander-ppt] Stop blocked: QA gate failed for this deck — re-render / re-review the ✗ pages above before finishing.");
  process.exit(2); // exit 2 = blocking error fed back to the agent
}
