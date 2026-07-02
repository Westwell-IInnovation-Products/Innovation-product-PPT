// Shared context builder for both the aggregator and per-page isolated render.
const pptxgen = require("pptxgenjs");
const { getTheme } = require("../theme/tokens");
const { makeComponents } = require("../components/ppt-components");
const { makeEditorial } = require("../components/editorial");
const { makeBespoke } = require("../components/bespoke");

function newPptx(theme) {
  const p = new pptxgen();
  p.defineLayout(theme.ppt.layout);
  p.layout = theme.ppt.layout.name;
  p.author = "Leander PPT";
  p.company = "Westwell";
  p.lang = "zh-CN";
  return p;
}

function makeCtx(pptx, theme) {
  const ui = makeComponents(pptx, theme);
  const ed = makeEditorial({ ui, theme, pptx });
  const bp = makeBespoke({ ui, theme, pptx });
  return { ui, ed, bp, theme, pptx };
}

module.exports = { newPptx, makeCtx };
