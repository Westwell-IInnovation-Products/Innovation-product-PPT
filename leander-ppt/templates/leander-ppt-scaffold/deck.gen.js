const pptxgen = require("pptxgenjs");
const { theme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");

const chapters = [
  {
    meta: require("./chapters/ch01-foundation/chapter.json"),
    pages: [
      require("./chapters/ch01-foundation/pages/p01-cover"),
      require("./chapters/ch01-foundation/pages/p02-section")
    ]
  },
  {
    meta: require("./chapters/ch02-core-components/chapter.json"),
    pages: [
      require("./chapters/ch02-core-components/pages/p03-metric-cards"),
      require("./chapters/ch02-core-components/pages/p04-big-word-matrix"),
      require("./chapters/ch02-core-components/pages/p05-four-column")
    ]
  },
  {
    meta: require("./chapters/ch03-system-components/chapter.json"),
    pages: [
      require("./chapters/ch03-system-components/pages/p06-architecture"),
      require("./chapters/ch03-system-components/pages/p07-hub-spoke"),
      require("./chapters/ch03-system-components/pages/p08-roadmap"),
      require("./chapters/ch03-system-components/pages/p09-closing")
    ]
  }
];

const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout);
pptx.layout = theme.ppt.layout.name;
pptx.author = "Leander PPT";
pptx.company = "Westwell";
pptx.subject = "Leander PPT scaffold sample";
pptx.title = "Leander PPT Scaffold Sample";
pptx.lang = "zh-CN";

const ui = makeComponents(pptx, theme);

function findPageContract(chapter, pageId) {
  const page = chapter.meta.pages.find(item => item.pageId === pageId);
  if (!page) throw new Error(`Missing ${pageId} in ${chapter.meta.chapterId}/chapter.json`);
  return page;
}

function addPage(chapter, pageModule) {
  const contract = findPageContract(chapter, pageModule.pageId);
  const slide = pptx.addSlide();
  slide.addNotes([
    `Chapter ID: ${chapter.meta.chapterId}`,
    `Page ID: ${contract.pageId}`,
    `Takeaway: ${contract.takeaway}`,
    `Visual intent: ${contract.visualIntent}`,
    `Component source: ${contract.componentSource}`
  ].join("\n"));
  pageModule.build(slide, { pptx, ui, theme, chapter: chapter.meta, page: contract });
}

chapters.forEach(chapter => {
  chapter.pages.forEach(pageModule => addPage(chapter, pageModule));
});

pptx.writeFile({ fileName: "output/leander-ppt-scaffold-sample.pptx" })
  .then(file => console.log("wrote", file))
  .catch(err => { console.error(err); process.exit(1); });
