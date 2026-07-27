// Shared context builder for both the aggregator and per-page isolated render.
const pptxgen = require("pptxgenjs");
const { getTheme } = require("../theme/tokens");
const { makeComponents } = require("../components/ppt-components");
const { makeEditorial } = require("../components/editorial");
const { makeBespoke } = require("../components/bespoke");
const { makeToolSystemTree } = require("../components/tool-system-tree");
const { setIconStyle } = require("../components/icons");

function newPptx(theme) {
  const p = new pptxgen();
  p.defineLayout(theme.ppt.layout);
  p.layout = theme.ppt.layout.name;
  p.author = "IInnovation-Products_ppt";
  p.company = "Westwell";
  p.lang = "zh-CN";
  return p;
}

function makeTrace() {
  let currentPage = null;
  const pages = new Map();
  function ensure() {
    if (!currentPage) return null;
    if (!pages.has(currentPage)) pages.set(currentPage, new Map());
    return pages.get(currentPage);
  }
  return {
    beginPage(pageId) { currentPage = pageId; pages.set(pageId, new Map()); },
    mark(namespace, name) {
      const calls = ensure();
      if (!calls) return;
      const key = `${namespace}.${name}`;
      calls.set(key, (calls.get(key) || 0) + 1);
    },
    endPage(pageId) {
      const calls = pages.get(pageId) || new Map();
      currentPage = null;
      return [...calls.entries()].map(([qualifiedName, count]) => {
        const split = qualifiedName.indexOf(".");
        return { namespace: qualifiedName.slice(0, split), name: qualifiedName.slice(split + 1), count };
      });
    }
  };
}

function tracedNamespace(namespace, source, trace) {
  return new Proxy(source, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (...args) => {
        trace.mark(namespace, String(property));
        return value(...args);
      };
    }
  });
}

function makeCtx(pptx, theme) {
  setIconStyle(theme); // per-theme icon style (line vs soft) before components bind
  const trace = makeTrace();
  const ui = tracedNamespace("ui", makeComponents(pptx, theme), trace);
  const ed = tracedNamespace("ed", makeEditorial({ ui, theme, pptx }), trace);
  const bp = tracedNamespace("bp", makeBespoke({ ui, theme, pptx }), trace);
  const toolTree = tracedNamespace("toolTree", makeToolSystemTree({ ui, theme, pptx }), trace);
  return { ui, ed, bp, toolTree, theme, pptx, trace };
}

module.exports = { newPptx, makeCtx, makeTrace, tracedNamespace };
