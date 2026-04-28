"use client";

import { useMemo, useState } from "react";
import SkillSecurityWorkbench from "./SkillSecurityWorkbench";
import {
  exportSkillMarkdown,
  filterManagedSkills,
  getSkillCategories,
  managedSkillsFromManifest,
  sortManagedSkills,
  summarizeSkillLibrary,
  type SkillSortKey,
} from "../lib/curation";
import type { SkillManagerProps, SkillUiManagedSkill, SkillUiStatus } from "../types";

function statusText(status: SkillUiManagedSkill["status"]): string {
  if (status === "allow") return "Verified";
  if (status === "review") return "Review";
  return "Blocked";
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
  agents = [],
  onAction,
  onSelectSkill,
}: SkillManagerProps) {
  const managedSkills = useMemo(
    () => skills ?? managedSkillsFromManifest(manifest),
    [skills, manifest],
  );
  const [view, setView] = useState<"manager" | "workbench">(defaultView);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<SkillUiStatus | "all">("all");
  const [agent, setAgent] = useState("all");
  const [sort, setSort] = useState<SkillSortKey>("name");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(managedSkills[0]?.id);

  const agentOptions = agents.length
    ? agents
    : [...new Set(managedSkills.flatMap((skill) => skill.assignedAgents))].sort();
  const filtered = sortManagedSkills(
    filterManagedSkills(managedSkills, {
      category,
      query,
      status,
      agent: agent === "all" ? undefined : agent,
    }),
    sort,
  );
  const selected = managedSkills.find((skill) => skill.id === selectedId) ?? filtered[0] ?? managedSkills[0];
  const summary = summarizeSkillLibrary(managedSkills);

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
          <div className="skill-manager-summary">
            <div><span>Verified</span><strong>{summary.allow}</strong></div>
            <div><span>Review</span><strong>{summary.review}</strong></div>
            <div><span>Blocked</span><strong>{summary.block}</strong></div>
          </div>
          <div className="skill-manager-section-title">Categories</div>
          <div className="skill-manager-categories">
            {getSkillCategories(managedSkills).map(([name, count]) => (
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
              <select value={status} onChange={(event) => setStatus(event.target.value as SkillUiStatus | "all")}>
                <option value="all">All status</option>
                <option value="allow">Verified</option>
                <option value="review">Review</option>
                <option value="block">Blocked</option>
              </select>
              <select value={agent} onChange={(event) => setAgent(event.target.value)}>
                <option value="all">All agents</option>
                {agentOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select value={sort} onChange={(event) => setSort(event.target.value as SkillSortKey)}>
                <option value="name">Sort name</option>
                <option value="risk">Sort risk</option>
                <option value="updated">Sort updated</option>
                <option value="status">Sort status</option>
              </select>
              <button type="button" onClick={() => onAction?.("import")}>Import</button>
              <button type="button" onClick={() => onAction?.("new")}>New Skill</button>
            </div>
          </header>

          <div className="skill-manager-tabs">
            <button type="button" className="is-active">Skills {managedSkills.length}</button>
            <button type="button" onClick={() => setStatus("review")}>Review {summary.review}</button>
            <button type="button" onClick={() => setStatus("block")}>Blocked {summary.block}</button>
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
                <button type="button" onClick={() => onAction?.("scan", selected)}>Run Scan</button>
                <button type="button" onClick={() => onAction?.("approve", selected)}>Approve</button>
                <button type="button" onClick={() => onAction?.("export", selected)}>Export SKILL.md</button>
                <button type="button" onClick={() => {
                  void navigator.clipboard?.writeText(exportSkillMarkdown(selected));
                  onAction?.("export", selected);
                }}>Copy Markdown</button>
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
