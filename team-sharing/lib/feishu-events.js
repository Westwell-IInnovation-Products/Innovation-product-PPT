function string(value) { return String(value == null ? "" : value).replace(/[\r\n\t]+/g, " ").trim(); }
function https(value, fallback = "https://github.com") { return /^https:\/\//i.test(string(value)) ? string(value) : fallback; }
function githubUrl(value, fallback = "https://github.com") { return /^https:\/\/github\.com(?:\/|$)/i.test(string(value)) ? string(value) : fallback; }

function classifyPullRequest(pullRequest = {}, files = []) {
  const branch = string(pullRequest.head && pullRequest.head.ref);
  if (branch.startsWith("contrib/")) return "candidate-intake";
  if (branch.startsWith("promote/")) return "component-promotion";
  const names = files.map(file => string(file && file.filename ? file.filename : file));
  if (names.some(name => /^(?:\.github\/|team-sharing\/)|^iinnovation-products-ppt\/(?:SKILL\.md|agents\/|references\/|scripts\/|templates\/iinnovation-products-ppt-scaffold\/(?:theme\/|tools\/))/i.test(name))) return "core-change";
  return "governance-change";
}

function classLabel(changeClass) {
  return ({
    "candidate-intake": "候选入库",
    "component-promotion": "正式组件晋升",
    "core-change": "Skill 核心变更",
    "governance-change": "治理/文档变更"
  })[changeClass] || "仓库变更";
}

function reviewNotification(input) {
  const pullRequest = input.pullRequest || {};
  const number = pullRequest.number || "?";
  const url = https(pullRequest.html_url, input.runUrl);
  const state = string(input.reviewState).toLowerCase();
  if (state === "approved") return { status: "approved", title: `IInnovation-Products_ppt PR #${number} 已批准`, details: "审核人已批准该 PR；最终合并仍由维护者在 GitHub 页面执行。", url, actionUrl: url };
  if (state === "changes_requested") return { status: "changes-requested", title: `IInnovation-Products_ppt PR #${number} 被要求修改`, details: "审核人已提出必须修改的意见，请处理评审意见后重新提交检查。", url, actionUrl: `${url}/files` };
  return null;
}

function closedNotification(input) {
  const pullRequest = input.pullRequest || {};
  const number = pullRequest.number || "?";
  const url = https(pullRequest.html_url);
  if (pullRequest.merged) return { status: "merged", title: `IInnovation-Products_ppt PR #${number} 已合并`, details: "人工审批闭环完成；后续版本与发布流程将继续自动执行。", url, actionUrl: url };
  return { status: "closed", title: `IInnovation-Products_ppt PR #${number} 已关闭`, details: "该 PR 未合并，候选或变更不会进入 main。", url, actionUrl: url };
}

function validationNotification(input) {
  const pullRequest = input.pullRequest || {};
  const number = pullRequest.number || "?";
  const runUrl = https(input.runUrl);
  const url = https(pullRequest.html_url, runUrl);
  const changeClass = classifyPullRequest(pullRequest, input.files || []);
  const label = classLabel(changeClass);
  const conclusion = string(input.conclusion).toLowerCase();
  if (conclusion !== "success") return {
    status: "failed",
    title: `IInnovation-Products_ppt ${label} PR #${number} 检查失败`,
    details: `自动检查结论：${conclusion || "unknown"}。请查看 Actions 日志并修复后重新提交。`,
    url: runUrl,
    actionUrl: url
  };
  const assessment = input.assessment || {};
  const lane = string(assessment.lane);
  const reasons = Array.isArray(assessment.reasons) ? assessment.reasons.map(string).filter(Boolean).slice(0, 3) : [];
  const risk = lane ? `风险通道：${lane}；评分：${Number.isFinite(Number(assessment.score)) ? Number(assessment.score) : "-"}` : "自动检查全部通过";
  const reasonText = reasons.length ? `；关注项：${reasons.join("、")}` : "";
  const status = lane === "curator-review" ? "review-required" : "ready";
  const guidance = ({
    "candidate-intake": "候选只进入隔离区，仍需人工决定合并或退回",
    "component-promotion": "Curator 与 Skill Owner 必须确认正式晋升",
    "core-change": "如涉及不兼容、Gate 或权限变化，合并前必须完成 Issue/RFC 与会议确认",
    "governance-change": "维护者需确认制度、文档或自动化边界"
  })[changeClass];
  return {
    status,
    title: `IInnovation-Products_ppt ${label} PR #${number} 待人工审批`,
    details: `${risk}${reasonText}。提交者：${string(pullRequest.user && pullRequest.user.login) || "unknown"}；${guidance}；最终合并必须由人工完成。`,
    url,
    actionUrl: `${url}/files`
  };
}

function releaseNotification(input) {
  const conclusion = string(input.conclusion).toLowerCase();
  const success = conclusion === "success";
  const version = string(input.version) || "待从运行记录确认";
  const workflow = string(input.workflowName);
  return {
    status: success ? "success" : "failed",
    title: `IInnovation-Products_ppt 版本流程${success ? "成功" : "失败"}`,
    details: `版本：${version}；流程：${workflow || "release"}。${success ? "请确认 Release 与回滚点。" : "请由 Release Owner 检查 Actions 日志。"}`,
    url: https(input.runUrl),
    actionUrl: https(input.runUrl)
  };
}

function localAlertNotification(input) {
  const alert = input.localAlert || {};
  const kind = string(alert.kind);
  if (!["candidate-cycle-blocked", "consumer-update-failed", "automation-disabled"].includes(kind)) return null;
  const definition = ({
    "candidate-cycle-blocked": { title: "候选处理被安全规则阻断", details: "候选上传或安全检查没有完成，请检查对应电脑上的 IInnovation-Products_ppt 审计日志。" },
    "consumer-update-failed": { title: "稳定版本更新失败", details: "对应电脑未能完成版本检查或安装，请检查计划任务日志。" },
    "automation-disabled": { title: "自动化已停止", details: "对应电脑检测到紧急停止开关，团队周期没有执行。" }
  })[kind] || { title: string(alert.title) || kind || "需要处理", details: string(alert.details) || "请检查本机 IInnovation-Products_ppt 审计日志。" };
  const status = kind === "automation-disabled" ? "warning" : "blocked";
  const source = /^[A-Za-z0-9_.-]{1,80}$/.test(string(alert.source)) ? string(alert.source) : "team-member";
  return {
    status,
    title: `IInnovation-Products_ppt 本地自动化：${definition.title}`,
    details: `${definition.details}；成员：${source}。`,
    url: githubUrl(alert.url),
    actionUrl: githubUrl(alert.url)
  };
}

function buildLifecycleNotification(input = {}) {
  const eventName = string(input.eventName);
  if (eventName === "pull_request_review") return reviewNotification(input);
  if (eventName === "pull_request_target" && input.action === "closed") return closedNotification(input);
  if (eventName === "repository_dispatch") return localAlertNotification(input);
  if (eventName === "workflow_dispatch") return { status: "success", title: "IInnovation-Products_ppt 飞书生命周期通知测试", details: "可信通知工作流连接正常；本卡片不对应真实审批。", url: https(input.runUrl), actionUrl: https(input.runUrl) };
  if (eventName === "workflow_run") {
    if (input.workflowName === "IInnovation-Products_ppt Team Sharing") return input.pullRequest ? validationNotification(input) : null;
    if (input.workflowName === "Tag Approved IInnovation-Products_ppt Version" && input.conclusion === "success") return null;
    if (["Tag Approved IInnovation-Products_ppt Version", "Release IInnovation-Products_ppt Skill"].includes(input.workflowName)) return releaseNotification(input);
  }
  return null;
}

module.exports = { classifyPullRequest, classLabel, buildLifecycleNotification };
