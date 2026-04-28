"use client";

import { useMemo, useState } from "react";
import SkillSecurityWorkbench from "./SkillSecurityWorkbench";
import type {
  SkillManagerProps,
  SkillUiLedgerEntry,
  SkillUiManagedSkill,
} from "../types";

function managedFromLedger(entry: SkillUiLedgerEntry): SkillUiManagedSkill {
  const categories = Object.keys(entry.scan.categories ?? {});
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
    category: categories[0] ?? "general",
    description: entry.scan.safeToInstall
      ? "Verified skill from the ledger."
      : "Skill requires review before use.",
    instructions: `# ${entry.name ?? entry.id}\n\nSource: ${entry.source}\n\nIntegrity: ${entry.integrity}`,
    tools: [],
    assignedAgents: [],
    createdAt: entry.installedAt,
    updatedAt: entry.updatedAt,
    ledger: entry,
  };
}

function statusText(status: SkillUiManagedSkill["status"]): string {
  if (status === "allow") return "Verified";
  if (status === "review") return "Review";
  return "Blocked";
}

function categoryCounts(skills: SkillUiManagedSkill[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const skill of skills) counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
  return [["all", skills.length], ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))];
}

export function SkillManager({
  skills,
  manifest,
  report,
  doctor,
  validation,
  suppressionAudit,
  policyPreset = "workspace",
  defaultView = "manager",
  onAction,
  onSelectSkill,
}: SkillManagerProps) {
  const managedSkills = useMemo(
    () => skills ?? manifest?.skills.map(managedFromLedger) ?? [],
    [skills, manifest],
  );
  const [view, setView] = useState<"manager" | "workbench">(defaultView);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(managedSkills[0]?.id);

  const filtered = managedSkills.filter((skill) => {
    const matchesCategory = category === "all" || skill.category === category;
    const haystack = `${skill.name} ${skill.source} ${skill.category} ${skill.description}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });
  const selected = managedSkills.find((skill) => skill.id === selectedId) ?? filtered[0] ?? managedSkills[0];

  if (view === "workbench") {
    return (
      <div className="skill-manager-shell">
        <nav className="skill-manager-topbar">
          <strong>Skill Manager</strong>
          <button type="button" onClick={() => setView("manager")}>Manager</button>
          <button type="button" className="is-active">Workbench</button>
        </nav>
        <SkillSecurityWorkbench
          manifest={manifest}
          report={report}
          doctor={doctor}
          validation={validation}
          suppressionAudit={suppressionAudit}
          policyPreset={policyPreset}
          onSelectSkill={onSelectSkill}
        />
      </div>
    );
  }

  return (
    <section className="skill-manager-shell">
      <nav className="skill-manager-topbar">
        <strong>Skill Manager</strong>
        <button type="button" className="is-active">Manager</button>
        <button type="button" onClick={() => setView("workbench")}>Workbench</button>
      </nav>

      <div className="skill-manager-layout">
        <aside className="skill-manager-sidebar">
          <div className="skill-manager-path">/ Skills</div>
          <div className="skill-manager-section-title">Categories</div>
          <div className="skill-manager-categories">
            {categoryCounts(managedSkills).map(([name, count]) => (
              <button
                type="button"
                key={name}
                className={category === name ? "is-active" : undefined}
                onClick={() => setCategory(name)}
              >
                <span>{name === "all" ? "All Skills" : name}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </aside>

        <main className="skill-manager-main">
          <header className="skill-manager-header">
            <div>
              <p className="skill-ui-kicker">skills</p>
              <h1>{filtered.length} managed skills</h1>
            </div>
            <div className="skill-manager-actions">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills..."
              />
              <button type="button" onClick={() => onAction?.("import")}>Import</button>
              <button type="button" onClick={() => onAction?.("new")}>New Skill</button>
            </div>
          </header>

          <div className="skill-manager-tabs">
            <button type="button" className="is-active">Skills {managedSkills.length}</button>
            <button type="button">Discovered 0</button>
            <button type="button">Evolution 0</button>
          </div>

          <div className="skill-card-grid">
            {filtered.map((skill) => (
              <button
                type="button"
                key={skill.id}
                className={`skill-card ${selected?.id === skill.id ? "is-selected" : ""}`}
                onClick={() => {
                  setSelectedId(skill.id);
                  onSelectSkill?.(skill);
                }}
              >
                <div className="skill-card-head">
                  <span className={`skill-icon ${skill.status}`}>+</span>
                  <div>
                    <strong>{skill.name}</strong>
                    <small>{skill.category}</small>
                  </div>
                </div>
                <div className="skill-card-divider" />
                <span className="skill-card-label">Instructions</span>
                <p>{skill.instructions}</p>
              </button>
            ))}
          </div>
        </main>

        <aside className="skill-manager-detail">
          <div className="skill-manager-section-title">Selected Skill Details</div>
          {selected ? (
            <>
              <dl className="skill-detail-list">
                <div><dt>Name</dt><dd>{selected.name}</dd></div>
                <div><dt>Category</dt><dd>{selected.category}</dd></div>
                <div><dt>Status</dt><dd>{statusText(selected.status)}</dd></div>
                <div><dt>Agents</dt><dd>{selected.assignedAgents.join(", ") || "none"}</dd></div>
                <div><dt>Created</dt><dd>{selected.createdAt ?? "unknown"}</dd></div>
                <div><dt>Updated</dt><dd>{selected.updatedAt ?? "unknown"}</dd></div>
              </dl>
              <div className="skill-detail-block">
                <strong>Description</strong>
                <p>{selected.description}</p>
              </div>
              <div className="skill-detail-block">
                <strong>Instructions</strong>
                <pre>{selected.instructions}</pre>
              </div>
              <div className="skill-detail-actions">
                <button type="button" onClick={() => onAction?.("assign", selected)}>Assign</button>
                <button type="button" onClick={() => onAction?.("export", selected)}>Export SKILL.md</button>
                <button type="button" className="danger" onClick={() => onAction?.("delete", selected)}>Delete Skill</button>
              </div>
            </>
          ) : (
            <p className="skill-ui-empty">No skill selected.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default SkillManager;
