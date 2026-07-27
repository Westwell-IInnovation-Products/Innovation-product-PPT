const fs = require("fs");
const path = require("path");

function loadExtensions(context) {
  const renderers = {};
  const files = fs.readdirSync(__dirname)
    .filter(file => file !== "index.js" && file.endsWith(".js"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const absolute = path.join(__dirname, file);
    delete require.cache[require.resolve(absolute)];
    const extension = require(absolute);
    if (!extension || typeof extension.name !== "string" || typeof extension.create !== "function") {
      throw new Error(`Invalid Innovation-Products_ppt extension module: ${file}`);
    }
    if (Object.prototype.hasOwnProperty.call(renderers, extension.name)) {
      throw new Error(`Duplicate Innovation-Products_ppt extension renderer: ${extension.name}`);
    }
    const renderer = extension.create(context);
    if (typeof renderer !== "function") {
      throw new Error(`Innovation-Products_ppt extension ${extension.name} did not create a renderer function.`);
    }
    renderers[extension.name] = renderer;
  }
  return renderers;
}

module.exports = { loadExtensions };
