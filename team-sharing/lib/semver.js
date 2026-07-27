function parseVersion(input) {
  const value = String(input || "").replace(/^iinnovation-products-ppt-v/, "");
  const match = value.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return { raw: value, major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] ? match[4].split(".") : [] };
}
function compareIdentifier(a, b) {
  const an = /^\d+$/.test(a), bn = /^\d+$/.test(b);
  if (an && bn) return Number(a) - Number(b);
  if (an !== bn) return an ? -1 : 1;
  return a.localeCompare(b);
}
function compareVersions(left, right) {
  const a = typeof left === "string" ? parseVersion(left) : left;
  const b = typeof right === "string" ? parseVersion(right) : right;
  if (!a || !b) throw new Error("Invalid semantic version");
  for (const key of ["major", "minor", "patch"]) if (a[key] !== b[key]) return a[key] - b[key];
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    if (a.prerelease[index] == null) return -1;
    if (b.prerelease[index] == null) return 1;
    const compared = compareIdentifier(a.prerelease[index], b.prerelease[index]);
    if (compared) return compared;
  }
  return 0;
}
function selectLatest(tags, channel = "stable") {
  const values = tags.map(tag => ({ tag, version: parseVersion(tag) })).filter(item => item.version);
  const allowed = channel === "stable" ? values.filter(item => item.version.prerelease.length === 0) : values;
  allowed.sort((a, b) => compareVersions(b.version, a.version));
  return allowed[0] || null;
}
function bumpVersion(input, type, preid = "") {
  const current = parseVersion(input);
  if (!current || !["prerelease", "patch", "minor", "major"].includes(type)) throw new Error("bumpVersion requires a valid version and prerelease|patch|minor|major");
  let { major, minor, patch } = current;
  if (type === "prerelease") {
    const label = preid || String(current.prerelease[0] || "beta");
    if (current.prerelease[0] === label && /^\d+$/.test(current.prerelease[current.prerelease.length - 1] || "")) {
      const parts = [...current.prerelease];
      parts[parts.length - 1] = String(Number(parts[parts.length - 1]) + 1);
      return `${major}.${minor}.${patch}-${parts.join(".")}`;
    }
    if (!current.prerelease.length) patch += 1;
    return `${major}.${minor}.${patch}-${label}.1`;
  }
  if (type === "major") { major += 1; minor = 0; patch = 0; }
  if (type === "minor") { minor += 1; patch = 0; }
  if (type === "patch") patch += 1;
  return `${major}.${minor}.${patch}${preid ? `-${preid}.1` : ""}`;
}
module.exports = { parseVersion, compareVersions, selectLatest, bumpVersion };
