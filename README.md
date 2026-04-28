# @gsknnft/skill-ui

[![npm version](https://img.shields.io/npm/v/@gsknnft/skill-ui)](https://www.npmjs.com/package/@gsknnft/skill-ui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![CI](https://github.com/gsknnft/sigilnet/actions/workflows/ci.yml/badge.svg)](https://github.com/gsknnft/sigilnet/actions/workflows/ci.yml)

Clean React UI components for managing agent skills and reviewing their
security state.

`skill-ui` is the presentation layer for:

- `@gsknnft/skill-safe` reports
- `@gsknnft/skill-ledger` manifests
- suppression audit results
- doctor / manifest health summaries

The package is intentionally UI-only. It does not scan skills, resolve sources,
or execute runtime policy.

## Install

```sh
pnpm add @gsknnft/skill-ui
```

Import the styles once in your app shell:

```ts
import "@gsknnft/skill-ui/styles.css";
```

## Manager Usage

```tsx
import { SkillManager } from "@gsknnft/skill-ui";

export function SkillsPage({ manifest, report, suppressionAudit }) {
  return (
    <SkillManager
      manifest={manifest}
      report={report}
      suppressionAudit={suppressionAudit}
      policyPreset="marketplace"
      onAction={(action, skill) => console.log(action, skill?.id)}
    />
  );
}
```

## Workbench Usage

```tsx
import { SkillSecurityWorkbench } from "@gsknnft/skill-ui";

export function SecurityPage({ manifest, report, suppressionAudit }) {
  return (
    <SkillSecurityWorkbench
      manifest={manifest}
      report={report}
      suppressionAudit={suppressionAudit}
      policyPreset="marketplace"
    />
  );
}
```

## Components

- `SkillManager` — manager surface with categories, search, cards, selected
  detail, assignment/export/delete actions, and a workbench tab.
- `SkillSecurityWorkbench` — full review surface for inventory, policy,
  findings, mappings, suppressions, and ledger health.
- `SkillList` — compact skill inventory table.
- `App` — demo app shell.

## Curation Helpers

```ts
import {
  exportSkillMarkdown,
  filterManagedSkills,
  managedSkillsFromManifest,
  summarizeSkillLibrary,
} from "@gsknnft/skill-ui";

const skills = managedSkillsFromManifest(manifest);
const queue = filterManagedSkills(skills, { status: "review" });
const summary = summarizeSkillLibrary(skills);
const markdown = exportSkillMarkdown(queue[0]);
```

## The Skill Suite

`skill-ui` is the presentation layer in a broader ecosystem of composable skill governance packages.

| Package | Responsibility |
|---|---|
| `@gsknnft/skill-safe` | **Scan / report / gate** — static pre-install scanner |
| `@gsknnft/skill-ledger` | **Manifest / inventory / doctor** — what is installed |
| `@gsknnft/skill-ui` | **Review workbench** — visual review and approval UI (this package) |
| `@gsknnft/skill-safe-judge` | **Semantic review** — optional LLM review layer |
| `@gsknnft/skill-safe-runtime` | **Runtime enforcement** — tool-call and trace policy |

See [skill-safe docs/SKILL_SUITE.md](../skill-safe/docs/SKILL_SUITE.md) for canonical boundary definitions
and [skill-safe examples/DEMO_FLOW.md](../skill-safe/examples/DEMO_FLOW.md) for a hands-on walkthrough.

## Suppression Panel

The `SkillSecurityWorkbench` surfaces suppression audit state in a dedicated panel:

- **Found** — total suppression comments parsed across all scanned documents
- **Honored** — suppression comments that filtered a flag (only in `honor` mode)
- **Invalid** — suppression comments referencing unknown rule IDs
- **Unused** — suppression comments that matched no active finding
- **Mode** — the active suppression mode (`disabled` / `report-only` / `honor`)

Pass a `SkillUiSuppressionAuditReport` from `skill-safe`'s `auditSuppressions()` to populate the panel.

## Known Limitations

`skill-ui` is a presentation layer. It does not:

- **Scan skills.** It renders data from `skill-safe` and `skill-ledger`.
- **Resolve sources.** Fetching and resolving skill markdown is `skill-safe`'s job.
- **Execute runtime policy.** That belongs to `skill-safe-runtime`.
- **Own data.** All state is passed in by the caller. The components are stateless renderers.

## Roadmap

- [Roadmap](docs/ROADMAP.md)

## Local Demo

```sh
pnpm --dir packages/skill-ui exec next dev
```

Then open the local Next URL.

## Build

```sh
pnpm --dir packages/skill-ui build
pnpm --dir packages/skill-ui test
pnpm --dir packages/skill-ui exec next build
```
