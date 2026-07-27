// Shared component runtime introspection.
// Keeps registry, lint, preview, index, and visual selection aligned on the
// same question: can this registry entry actually be rendered by the JS library?
const pptxgen = require("pptxgenjs");
const { getTheme } = require("../theme/tokens");
const { makeComponents } = require("../components/ppt-components");
const { makeEditorial } = require("../components/editorial");
const { makeBespoke } = require("../components/bespoke");
const { makeToolSystemTree } = require("../components/tool-system-tree");
const { loadExtensions } = require("../components/extensions");

const NON_SELECTABLE_STATUSES = new Set([
  "planned",
  "review-required",
  "needs-renderer",
  "needs-redesign",
  "deprecated",
  "archived"
]);

const cache = new Map();

function loadComponentRuntime(themeName = "leander-base") {
  if (cache.has(themeName)) return cache.get(themeName);
  const pptx = new pptxgen();
  const theme = getTheme(themeName);
  pptx.defineLayout(theme.ppt.layout);
  pptx.layout = theme.ppt.layout.name;
  const ui = makeComponents(pptx, theme);
  const builtIns = {
    ...ui,
    ...makeEditorial({ ui, theme, pptx }),
    ...makeBespoke({ ui, theme, pptx }),
    ...makeToolSystemTree({ ui, theme, pptx })
  };
  const extensions = loadExtensions({ ui, theme, pptx });
  for (const name of Object.keys(extensions)) {
    if (Object.prototype.hasOwnProperty.call(builtIns, name)) {
      throw new Error(`Innovation-Products_ppt extension renderer collides with a built-in component: ${name}`);
    }
  }
  const components = { ...builtIns, ...extensions };
  const rendererNames = new Set(
    Object.entries(components)
      .filter(([, value]) => typeof value === "function")
      .map(([name]) => name)
  );
  const runtime = { pptx, theme, ui, components, rendererNames };
  cache.set(themeName, runtime);
  return runtime;
}

function rendererStatus(component, runtime = loadComponentRuntime()) {
  if (!component || component.route !== "component-library") {
    return {
      renderStatus: "not-js-component",
      hasRenderer: true,
      selectable: true,
      reason: "Route is not backed by the editable JS component library."
    };
  }
  const hasRenderer = runtime.rendererNames.has(component.name);
  const designStatus = component.designStatus || "usable";
  const blockedByStatus = NON_SELECTABLE_STATUSES.has(designStatus);
  const selectable = hasRenderer && !blockedByStatus;
  return {
    renderStatus: hasRenderer ? "renderable" : "no-renderer",
    hasRenderer,
    selectable,
    reason: !hasRenderer
      ? "Registry entry has no matching exported JS component function."
      : blockedByStatus
        ? `Component designStatus=${designStatus} is not selectable.`
        : "Component has a matching JS renderer."
  };
}

module.exports = {
  NON_SELECTABLE_STATUSES,
  loadComponentRuntime,
  rendererStatus
};
