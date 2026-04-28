# @gsknnft/skill-ui

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
