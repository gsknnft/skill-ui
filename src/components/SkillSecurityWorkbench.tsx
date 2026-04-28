"use client";

import { useMemo, useState } from "react";
import { SkillList } from "./SkillList";
import type {
  SkillSecurityWorkbenchProps,
  SkillUiLedgerEntry,
  SkillUiPolicyPreset,
  SkillUiRow,
} from "../types";

const policies: Record<SkillUiPolicyPreset, {
  preset: SkillUiPolicyPreset;
  failOn: "review" | "block";
  suppressionMode: "disabled" | "report-only";
}> = {
  strict: { preset: "strict", failOn: "review", suppressionMode: "disabled" },
  marketplace: { preset: "marketplace", failOn: "review", suppressionMode: "report-only" },
  workspace: { preset: "workspace", failOn: "block", suppressionMode: "report-only" },
};

function rowFromLedger(entry: SkillUiLedgerEntry): SkillUiRow {
  return {
    id: entry.id,
    name: entry.name ?? entry.id,
    source: entry.source,
    scope: entry.scope,
    status: entry.scan.recommendedAction,
    severity: entry.scan.severity,
    riskScore: entry.scan.riskScore,
    findings: entry.scan.flagCount,
    scanner: `${entry.scanner.name}@${entry.scanner.version}`,
    ledger: entry,
  };
}

function numberFormat(value: number | string): string {
  return typeof value === "number" ? new Intl.NumberFormat().format(value) : value;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

export function SkillSecurityWorkbench({
  title = "Skill Security Workbench",
  subtitle = "Review installed skills, scan results, governance mappings, suppressions, and ledger health.",
  manifest,
  report,
  doctor,
  validation,
  suppressionAudit,
  policyPreset = "workspace",
  onSelectSkill,
}: SkillSecurityWorkbenchProps) {
  const rows = useMemo<SkillUiRow[]>(() => {
    if (manifest?.skills?.length) return manifest.skills.map(rowFromLedger);
    return (report?.documents ?? []).map((document) => ({
      id: document.id,
      name: document.id,
      source: document.source,
      scope: document.trust,
      status: document.scan.report.recommendedAction,
      severity: document.scan.severity,
      riskScore: document.scan.report.riskScore,
      findings: document.scan.flags.length,
      scanner: "skill-safe",
    }));
  }, [manifest, report]);
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const policy = policies[policyPreset];
  const categories = selected?.ledger?.scan.categories ?? report?.categories ?? {};
  const mappings = selected?.ledger?.scan.mappings ?? report?.mappings ?? {
    owasp: [],
    mitreAtlas: [],
    nistAiRmf: [],
  };

  const blocked = report?.summary.blocked ?? doctor?.blocked ?? rows.filter((row) => row.status === "block").length;
  const review = report?.summary.review ?? doctor?.needsReview ?? rows.filter((row) => row.status === "review").length;
  const passed = report?.summary.passed ?? rows.filter((row) => row.status === "allow").length;
  const findings = report?.summary.findings ?? rows.reduce((sum, row) => sum + row.findings, 0);

  return (
    <section className="skill-ui-shell">
      <header className="skill-ui-header">
        <div>
          <p className="skill-ui-kicker">agent skill governance</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="skill-ui-policy">
          <span>Preset</span>
          <strong>{policy.preset}</strong>
          <small>fail on {policy.failOn} · suppressions {policy.suppressionMode}</small>
        </div>
      </header>

      <div className="skill-ui-stats">
        <article>
          <span>Skills</span>
          <strong>{numberFormat(rows.length)}</strong>
        </article>
        <article>
          <span>Allowed</span>
          <strong>{numberFormat(passed)}</strong>
        </article>
        <article>
          <span>Review</span>
          <strong>{numberFormat(review)}</strong>
        </article>
        <article className={blocked > 0 ? "danger" : undefined}>
          <span>Blocked</span>
          <strong>{numberFormat(blocked)}</strong>
        </article>
        <article>
          <span>Findings</span>
          <strong>{numberFormat(findings)}</strong>
        </article>
      </div>

      <div className="skill-ui-grid">
        <div className="skill-ui-panel skill-ui-main">
          <div className="skill-ui-panel-head">
            <span>Inventory</span>
            <small>{manifest?.sourceId ?? report?.mode ?? "demo"}</small>
          </div>
          <SkillList
            skills={rows}
            selectedId={selected?.id}
            onSelectSkill={(row) => {
              setSelectedId(row.id);
              onSelectSkill?.(row);
            }}
          />
        </div>

        <aside className="skill-ui-panel">
          <div className="skill-ui-panel-head">
            <span>Selected Skill</span>
            <small>{selected?.status ?? "none"}</small>
          </div>
          {selected ? (
            <div className="skill-ui-detail">
              <h2>{selected.name}</h2>
              <p>{selected.source}</p>
              <dl>
                <div><dt>Scope</dt><dd>{selected.scope}</dd></div>
                <div><dt>Risk</dt><dd>{selected.riskScore}</dd></div>
                <div><dt>Findings</dt><dd>{selected.findings}</dd></div>
                <div><dt>Scanner</dt><dd>{selected.scanner}</dd></div>
              </dl>
            </div>
          ) : (
            <p className="skill-ui-empty">No skills loaded.</p>
          )}
        </aside>
      </div>

      <div className="skill-ui-grid lower">
        <section className="skill-ui-panel">
          <div className="skill-ui-panel-head"><span>Categories</span></div>
          <div className="skill-ui-list">
            {Object.entries(categories).length ? Object.entries(categories).map(([name, count]) => (
              <div key={name}><span>{name}</span><strong>{count}</strong></div>
            )) : <p className="skill-ui-empty">No category findings.</p>}
          </div>
        </section>

        <section className="skill-ui-panel">
          <div className="skill-ui-panel-head"><span>Governance</span></div>
          <div className="skill-ui-mappings">
            <strong>OWASP</strong>
            <p>{unique(mappings.owasp).join(", ") || "none"}</p>
            <strong>MITRE ATLAS</strong>
            <p>{unique(mappings.mitreAtlas).join(", ") || "none"}</p>
            <strong>NIST AI RMF</strong>
            <p>{unique(mappings.nistAiRmf).join(", ") || "none"}</p>
          </div>
        </section>

        <section className="skill-ui-panel">
          <div className="skill-ui-panel-head"><span>Ledger Health</span></div>
          <div className="skill-ui-list">
            <div><span>Duplicates</span><strong>{doctor?.duplicates ?? "n/a"}</strong></div>
            <div><span>Changed remote</span><strong>{doctor?.changedSinceInstall ?? "unknown"}</strong></div>
            <div><span>Validation</span><strong>{validation ? (validation.valid ? "valid" : "errors") : "n/a"}</strong></div>
          </div>
        </section>

        <section className="skill-ui-panel">
          <div className="skill-ui-panel-head"><span>Suppressions</span></div>
          <div className="skill-ui-list">
            <div><span>Invalid</span><strong>{suppressionAudit?.invalid ?? 0}</strong></div>
            <div><span>Unused</span><strong>{suppressionAudit?.unused ?? 0}</strong></div>
            <div><span>Status</span><strong>{suppressionAudit ? (suppressionAudit.ok ? "clean" : "audit") : "n/a"}</strong></div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default SkillSecurityWorkbench;
