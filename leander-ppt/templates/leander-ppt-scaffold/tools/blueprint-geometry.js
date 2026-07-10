const EPS = 0.5;

function rectsOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w <= b.x + padding ||
    b.x + b.w <= a.x + padding ||
    a.y + a.h <= b.y + padding ||
    b.y + b.h <= a.y + padding
  );
}

function pointInRect(point, rect, padding = 0) {
  return point.x > rect.x + padding && point.x < rect.x + rect.w - padding &&
    point.y > rect.y + padding && point.y < rect.y + rect.h - padding;
}

function segmentIntersectsRect(a, b, rect, padding = 0) {
  const r = { x: rect.x - padding, y: rect.y - padding, w: rect.w + padding * 2, h: rect.h + padding * 2 };
  if (Math.abs(a.x - b.x) < EPS) {
    if (a.x <= r.x || a.x >= r.x + r.w) return false;
    const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
    return maxY > r.y && minY < r.y + r.h;
  }
  if (Math.abs(a.y - b.y) < EPS) {
    if (a.y <= r.y || a.y >= r.y + r.h) return false;
    const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
    return maxX > r.x && minX < r.x + r.w;
  }
  // Non-axis-aligned segments are already rejected unless explicitly allowed.
  return pointInRect(a, r) || pointInRect(b, r);
}

function boundsOf(rects) {
  if (!rects.length) return null;
  const x1 = Math.min(...rects.map(r => r.x));
  const y1 = Math.min(...rects.map(r => r.y));
  const x2 = Math.max(...rects.map(r => r.x + r.w));
  const y2 = Math.max(...rects.map(r => r.y + r.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function lintScene(scene, options = {}) {
  const safe = options.safe || scene.safe || { x: 70, y: 140, w: 1460, h: 650 };
  const centerTolerance = options.centerTolerance == null ? 95 : options.centerTolerance;
  const findings = [];
  const blocks = (scene.objects || []).filter(o => o.type === "rect" && !["decor", "container"].includes(o.role));
  const connectors = (scene.objects || []).filter(o => o.type === "connector");

  blocks.forEach(block => {
    if (block.x < safe.x - EPS || block.y < safe.y - EPS || block.x + block.w > safe.x + safe.w + EPS || block.y + block.h > safe.y + safe.h + EPS) {
      findings.push({ severity: "error", type: "out-of-safe-area", object: block.id, message: `${block.id} 超出主体安全区。` });
    }
  });

  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i], b = blocks[j];
      const allowed = (a.allowOverlapWith || []).includes(b.id) || (b.allowOverlapWith || []).includes(a.id);
      if (!allowed && rectsOverlap(a, b, 2)) {
        findings.push({ severity: "error", type: "unintended-overlap", object: `${a.id}/${b.id}`, message: `${a.id} 与 ${b.id} 发生非意图重叠。` });
      }
    }
  }

  connectors.forEach(connector => {
    const points = connector.points || [];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1], b = points[i];
      const axisAligned = Math.abs(a.x - b.x) < EPS || Math.abs(a.y - b.y) < EPS;
      if (!axisAligned && connector.kind !== "curve" && connector.intentionalDiagonal !== true) {
        findings.push({ severity: "error", type: "accidental-diagonal", object: connector.id, message: `${connector.id} 含未声明的斜线。` });
      }
      if (connector.kind === "curve") continue;
      blocks.forEach(block => {
        if ([connector.source, connector.target].includes(block.id)) return;
        if (segmentIntersectsRect(a, b, block, 1)) {
          findings.push({ severity: "error", type: "connector-crosses-block", object: `${connector.id}/${block.id}`, message: `${connector.id} 穿过无关对象 ${block.id}。` });
        }
      });
    }
  });

  const centerBlocks = blocks.filter(block => block.excludeFromCenter !== true);
  const contentBounds = boundsOf(centerBlocks);
  if (contentBounds && scene.checkCenter !== false) {
    const contentCenterY = contentBounds.y + contentBounds.h / 2;
    const safeCenterY = safe.y + safe.h / 2;
    if (Math.abs(contentCenterY - safeCenterY) > centerTolerance) {
      findings.push({ severity: "error", type: "vertical-centering", object: "scene", message: `主体视觉中心偏离安全区中心 ${Math.round(Math.abs(contentCenterY - safeCenterY))} px。` });
    }
  }

  const groups = new Map();
  blocks.filter(block => block.peerGroup).forEach(block => {
    if (!groups.has(block.peerGroup)) groups.set(block.peerGroup, []);
    groups.get(block.peerGroup).push(block);
  });
  groups.forEach((peers, name) => {
    if (peers.length < 2) return;
    const first = peers[0];
    const sizeMismatch = peers.some(peer => Math.abs(peer.w - first.w) > EPS || Math.abs(peer.h - first.h) > EPS);
    if (sizeMismatch) findings.push({ severity: "error", type: "peer-size-mismatch", object: name, message: `同级组 ${name} 的尺寸不一致。` });
  });

  return {
    verdict: findings.some(item => item.severity === "error") ? "FIX-FIRST" : "PASS",
    findings,
    metrics: { blocks: blocks.length, connectors: connectors.length, contentBounds }
  };
}

function selfTest() {
  const safe = { x: 0, y: 0, w: 400, h: 300 };
  const valid = { safe, objects: [
    { id: "a", type: "rect", role: "block", x: 40, y: 100, w: 80, h: 60 },
    { id: "b", type: "rect", role: "block", x: 280, y: 100, w: 80, h: 60 },
    { id: "ab", type: "connector", source: "a", target: "b", points: [{ x: 120, y: 130 }, { x: 280, y: 130 }] }
  ] };
  const invalid = { safe, objects: [
    { id: "a", type: "rect", role: "block", x: 40, y: 100, w: 120, h: 60 },
    { id: "b", type: "rect", role: "block", x: 130, y: 120, w: 120, h: 60 },
    { id: "c", type: "rect", role: "block", x: 280, y: 100, w: 80, h: 60 },
    { id: "ac", type: "connector", source: "a", target: "c", points: [{ x: 160, y: 130 }, { x: 280, y: 130 }] }
  ] };
  if (lintScene(valid, { centerTolerance: 200 }).verdict !== "PASS") throw new Error("valid geometry fixture failed");
  const fail = lintScene(invalid, { centerTolerance: 200 });
  if (fail.verdict !== "FIX-FIRST" || !fail.findings.some(item => item.type === "unintended-overlap") || !fail.findings.some(item => item.type === "connector-crosses-block")) {
    throw new Error("invalid geometry fixture did not fail for overlap and crossing");
  }
  console.log("PASS blueprint geometry self-test");
}

if (require.main === module) selfTest();
module.exports = { lintScene, rectsOverlap, segmentIntersectsRect, boundsOf };
