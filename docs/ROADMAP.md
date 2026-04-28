# skill-ui Roadmap

`@gsknnft/skill-ui` is the consumable React surface for the skill-suite. It
should make skills manageable for humans while staying separate from the
verification and ledger packages.

## Role In The Skill Suite

- `skill-safe`: verifies skill content and produces security reports.
- `skill-ledger`: records inventory, source, integrity, and scan summaries.
- `skill-ui`: presents, filters, curates, assigns, exports, and reviews skills.
- `skill-safe-judge`: optional semantic/LLM review layer.
- `skill-safe-runtime`: optional runtime enforcement layer.

## v0.1 Hardening

- Keep the package UI-only: no scanner, resolver, filesystem, or runtime policy.
- Keep React as a peer dependency.
- Export CSS as `@gsknnft/skill-ui/styles.css`.
- Provide `SkillManager` as the default day-to-day curation surface.
- Provide `SkillSecurityWorkbench` for governance/audit review.
- Provide utility functions for filtering, sorting, summarizing, and exporting
  managed skills.
- Support structural `skill-safe` and `skill-ledger` report shapes without
  forcing those packages as runtime dependencies.
- Verify library build, tests, Next demo build, and pack dry-run before publish.

## High-Value Candidates

- Controlled manager state:
  - selected skill
  - active category
  - active status
  - search query
  - sort mode
- Assignment editor:
  - agent list
  - per-agent skill enablement
  - inherited team/workspace assignments
- Import flow:
  - paste `SKILL.md`
  - load manifest JSON
  - load skill-safe report JSON
  - preview before accepting
- Export flow:
  - single `SKILL.md`
  - curated bundle JSON
  - ledger-ready manifest fragment
- Review queue:
  - blocked skills
  - stale scans
  - unused suppressions
  - changed remote integrity
- Marketplace mode:
  - trust badges
  - provenance badges
  - source age warnings
  - install decision preview
- Theme tokens:
  - dark default
  - compact mode
  - host-app CSS variable overrides

## v0.2 Candidates

- Optional modal components for import, export, assign, and delete flows.
- Virtualized card/grid rendering for large libraries.
- Keyboard navigation and command palette.
- Diff view between current and incoming skill versions.
- First-party adapters:
  - `skill-safe` full report to manager state
  - `skill-ledger` manifest to manager state
  - suppression audit to review queue

## v1.0 Readiness

- Stable public component props.
- Stable curation helper APIs.
- Accessibility pass for table, cards, detail pane, and actions.
- Visual regression screenshots for manager and workbench.
- Framework examples for Next, Vite, and plain React.
- No private stack assumptions.
