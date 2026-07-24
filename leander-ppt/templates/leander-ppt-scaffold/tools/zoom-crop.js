// Crop a region from a rendered PNG and upscale it for pixel-level defect review
// (annotation overlap, clipped borders). Coordinates are in the source PNG's own
// pixel space (default render size 1280x720).
// Usage: node tools/zoom-crop.js <pages/<dir>|path.png> <x> <y> <w> <h> [scale=4] [--out <file>]
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const ROOT = path.join(__dirname, "..");

function fail(message) { console.error(message); process.exit(1); }
const [target, xs, ys, ws, hs, maybeScale] = process.argv.slice(2);
if (!target || [xs, ys, ws, hs].some(value => !Number.isFinite(Number(value)))) {
  fail("usage: node tools/zoom-crop.js <pages/<dir>|path.png> <x> <y> <w> <h> [scale=4] [--out <file>]");
}
const scale = Number.isFinite(Number(maybeScale)) ? Math.max(1, Number(maybeScale)) : 4;
const dir = path.resolve(ROOT, target);
const source = /\.png$/i.test(target) ? path.resolve(ROOT, target) : path.join(dir, "out", `${path.basename(dir)}.png`);
if (!fs.existsSync(source)) fail(`render not found: ${source}`);
const x = Number(xs), y = Number(ys), w = Number(ws), h = Number(hs);
const src = PNG.sync.read(fs.readFileSync(source));
if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > src.width || y + h > src.height) fail(`crop ${x},${y} ${w}x${h} exceeds source ${src.width}x${src.height}`);
const out = new PNG({ width: w * scale, height: h * scale });
for (let oy = 0; oy < h * scale; oy++) for (let ox = 0; ox < w * scale; ox++) {
  const si = (src.width * (y + Math.floor(oy / scale)) + x + Math.floor(ox / scale)) << 2;
  const di = (out.width * oy + ox) << 2;
  out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 255;
}
const outArg = (() => { const i = process.argv.indexOf("--out"); return i >= 0 && process.argv[i + 1] ? path.resolve(ROOT, process.argv[i + 1]) : ""; })();
const destination = outArg || path.join(path.dirname(source), `zoom-${x}-${y}-${w}x${h}.png`);
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, PNG.sync.write(out));
console.log(`wrote ${path.relative(ROOT, destination)} (${w}x${h} @${scale}x from ${path.relative(ROOT, source)})`);
