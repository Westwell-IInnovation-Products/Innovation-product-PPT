# IInnovation-Products_ppt Team Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and prove a zero-extra-software workflow in which multiple people submit isolated IInnovation-Products_ppt component candidates, a curator promotes approved candidates into the executable component library, GitHub validates the result, and teammates install a stable release.

**Architecture:** GitHub `main` is the canonical source. Contributors submit one candidate bundle per branch under `contributions/iinnovation-products-ppt/components/<github-user>/<candidate-id>/`; candidate branches never overwrite the installed Skill. A curator promotion command validates the bundle, copies its renderer into the extension runtime, adds a reviewed registry entry, rebuilds the compact index, and runs IInnovation-Products_ppt component gates. Local Git and PowerShell handle branch/push operations; a Node script uses the existing Git credential helper to create Draft PRs through GitHub REST, so GitHub CLI is not required.

**Tech Stack:** Git, PowerShell, Node.js built-ins, IInnovation-Products_ppt Node toolchain, GitHub Actions, GitHub REST API.

---

## File map

- `.github/CODEOWNERS`: initial ownership for Skill core, contribution inbox, and component promotion paths.
- `.github/pull_request_template.md`: separates candidate, promotion, core, and release changes.
- `.github/workflows/iinnovation-products-ppt-team-sharing.yml`: runs candidate tests, Skill hygiene, registry/index consistency, component lint, and dual-theme preview checks.
- `.github/workflows/iinnovation-products-ppt-release.yml`: validates `iinnovation-products-ppt-v*` tags and publishes the clean Skill archive.
- `docs/governance/iinnovation-products-ppt-team-sharing.md`: team policy, roles, change classes, review gates, release and rollback process.
- `team-sharing/lib/candidate.js`: candidate loading, validation, safe path rules, and promotion helpers.
- `team-sharing/scripts/validate-candidate.js`: CLI validator for one bundle or the complete contribution inbox.
- `team-sharing/scripts/promote-candidate.js`: curator-only promotion into the executable extension library and registry.
- `team-sharing/scripts/create-draft-pr.js`: creates a Draft PR using the existing Git credential helper without printing credentials.
- `team-sharing/scripts/publish-candidate.ps1`: creates an isolated contribution branch, validates, commits, pushes, and requests a Draft PR.
- `team-sharing/scripts/install-iinnovation-products-ppt.ps1`: installs a validated repository/tag copy into the user's Codex Skill directory with rollback backup.
- `team-sharing/scripts/simulate-flow.js`: creates a temporary bare Git remote, simulates two contributors, merges both contribution branches, promotes them, tags a release, and installs it for a simulated consumer.
- `team-sharing/tests/candidate.test.js`: Node tests for valid bundles, duplicate IDs, traversal, missing fields, and sensitive/project-specific data.
- `team-sharing/tests/fixtures/`: two generic valid component candidates plus invalid bundles.
- `iinnovation-products-ppt/templates/iinnovation-products-ppt-scaffold/components/extensions/index.js`: loads promoted extension renderer modules.
- `iinnovation-products-ppt/templates/iinnovation-products-ppt-scaffold/tools/component-runtime.js`: includes promoted extensions in renderer discovery.
- `iinnovation-products-ppt/templates/iinnovation-products-ppt-scaffold/tools/render-component-library-preview.js`: renders through the unified component runtime.
- `iinnovation-products-ppt/CHANGELOG.md`: release history beginning with the shared beta baseline.

### Task 1: Establish the clean Skill baseline

- [ ] Mirror `C:\Users\admin\.codex\skills\iinnovation-products-ppt` into the repository `iinnovation-products-ppt/` on `agent/iinnovation-products-ppt-team-sharing-pilot`.
- [ ] Run `node scripts/release-hygiene.js` from `iinnovation-products-ppt` and expect `PASS release hygiene`.
- [ ] Run `node templates/iinnovation-products-ppt-scaffold/tools/lint-scope-hygiene.js --skill-root .` and expect `PASS scope hygiene`.
- [ ] Add `iinnovation-products-ppt/CHANGELOG.md` with `0.6.0-beta.8` as the initial governed baseline.

### Task 2: Write candidate validation tests first

- [ ] Add valid generic candidates `multiActorContributionPool` and `evidenceMetricBand` under `team-sharing/tests/fixtures/valid/`.
- [ ] Add invalid fixtures for duplicate component name, missing preview, path traversal, absolute local path, and forbidden project terms.
- [ ] Add `candidate.test.js` with explicit assertions for every valid and invalid case.
- [ ] Run `node --test team-sharing/tests/candidate.test.js`; expect failure because `team-sharing/lib/candidate.js` does not exist yet.

### Task 3: Implement candidate validation

- [ ] Implement `team-sharing/lib/candidate.js` using only Node built-ins.
- [ ] Require `candidate.json`, `component.js`, `preview.svg`, and `README.md`.
- [ ] Validate stable IDs, contributor path ownership, required registry metadata, extension module exports, relative paths, and forbidden local/project content.
- [ ] Implement `validate-candidate.js` for a single candidate and recursive inbox validation.
- [ ] Re-run `node --test team-sharing/tests/candidate.test.js`; expect all tests to pass.

### Task 4: Add executable extension promotion

- [ ] Add `components/extensions/index.js` with deterministic renderer discovery and duplicate-name rejection.
- [ ] Modify `component-runtime.js` to merge extension renderers after built-in renderers.
- [ ] Modify `render-component-library-preview.js` to use `loadComponentRuntime()` rather than constructing a second renderer map.
- [ ] Implement `promote-candidate.js` to copy the reviewed module, append reviewed registry metadata, rebuild the index, and preserve an audit record.
- [ ] Add tests proving an approved fixture becomes `renderable` and `selectable`, while an unreviewed fixture stays blocked.

### Task 5: Add local contributor and consumer scripts

- [ ] Implement `publish-candidate.ps1` with explicit repository, candidate, contributor, and base branch parameters.
- [ ] Make the script refuse a dirty worktree, refuse direct `main` commits, validate before copying, and push only `contrib/<user>/<candidate-id>`.
- [ ] Implement `create-draft-pr.js` using `git credential fill` and GitHub REST; never log the password/token.
- [ ] Implement `install-iinnovation-products-ppt.ps1` with source validation, backup, mirror copy, and rollback on failed post-install hygiene.
- [ ] Replace `C:\西井\06AI\sync-codex-skills-to-leander.ps1` with a thin wrapper that publishes candidates rather than mirroring the whole Skill to `main`.

### Task 6: Add GitHub governance

- [ ] Add CODEOWNERS using `@caijiahui0426` as the initial pilot owner.
- [ ] Add a PR template with candidate, promotion, core, and release checklists.
- [ ] Add `iinnovation-products-ppt-team-sharing.yml` for Node tests, candidate validation, release hygiene, scope hygiene, index consistency, strict component lint, and dual-theme previews.
- [ ] Add `iinnovation-products-ppt-release.yml` for `iinnovation-products-ppt-v*` tags and a clean release archive.
- [ ] Document roles, weekly cadence, semantic versioning, conflict policy, security boundaries, rollback, and scheduled task setup.

### Task 7: Run the complete local simulation

- [ ] Run `node team-sharing/scripts/simulate-flow.js`.
- [ ] Confirm two clones push independent contribution branches to a temporary bare remote.
- [ ] Confirm the maintainer merges both branches without conflict.
- [ ] Promote both candidates into the extension library and rebuild the registry/index.
- [ ] Run strict component lint and both theme previews in the simulated maintained copy.
- [ ] Tag `iinnovation-products-ppt-sim-v0.1.0`, clone as a consumer, run the installer, and confirm both component IDs are installed.
- [ ] Save a machine-readable simulation report outside the shared Skill runtime outputs.

### Task 8: Validate and publish the pilot

- [ ] Run `node --test team-sharing/tests/candidate.test.js`.
- [ ] Run `node team-sharing/scripts/validate-candidate.js contributions/iinnovation-products-ppt/components`.
- [ ] Run IInnovation-Products_ppt release and scope hygiene.
- [ ] Run component registry enrichment, index build, strict lint, and dual-theme preview generation.
- [ ] Inspect `git status -sb` and `git diff --check`.
- [ ] Commit only the team-sharing pilot files and the clean Skill baseline.
- [ ] Push `agent/iinnovation-products-ppt-team-sharing-pilot` using local Git.
- [ ] Create a Draft PR with `node team-sharing/scripts/create-draft-pr.js`.
- [ ] Inspect the online PR and GitHub Actions results; do not merge the shared core change without user review.
