function safe(value) { return String(value == null ? "" : value).replace(/[\r\n]+/g, " ").trim(); }
function buildReviewCard(input = {}) {
  const status = safe(input.status || "review-required");
  const normalized = status.toLowerCase();
  const template = ["failed", "blocked", "changes-requested"].includes(normalized)
    ? "red"
    : normalized === "closed" ? "grey"
      : ["success", "passed", "ready", "approved", "merged"].includes(normalized) ? "green" : "orange";
  const title = safe(input.title || "Leander 组件候选状态更新");
  const details = safe(input.details || "请在 GitHub 中查看检查结果和审核信息。");
  const url = /^https:\/\//i.test(input.url || "") ? input.url : "https://github.com";
  const actionUrl = /^https:\/\//i.test(input.actionUrl || "") ? input.actionUrl : url;
  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: { template, title: { tag: "plain_text", content: title } },
      elements: [
        { tag: "div", text: { tag: "lark_md", content: `**状态：** ${status}\n**说明：** ${details}` } },
        { tag: "action", actions: [
          { tag: "button", type: "primary", text: { tag: "plain_text", content: "查看 PR / 检查" }, url },
          { tag: "button", text: { tag: "plain_text", content: "进入审核" }, url: actionUrl }
        ] }
      ]
    }
  };
}
module.exports = { buildReviewCard };
