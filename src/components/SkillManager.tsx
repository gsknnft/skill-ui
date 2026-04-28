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
import { getUiRiskLevel, RISK_LEVEL_LABEL } from "../types";

function statusText(status: SkillUiManagedSkill["status"]): string {
  if (status === "allow") return "Verified";
  if (status === "review") return "Needs Review";
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
  const [statusFilter, setStatusFilter] = useState<SkillUiStatus | "all">("all");
  const [agent, setAgent] = useState("all");
  const [sort, setSort] = useState<SkillSortKey>("name");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(managedSkills[0]?.id);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());

  const agentOptions = agents.length
    ? agents
    : [...new Set(managedSkills.flatMap((skill) => skill.assignedAgents))].sort();

  const filtered = sortManagedSkills(
    filterManagedSkills(managedSkills, {
      category,
      query,
      status: statusFilter,
      agent: agent === "all" ? undefined : agent,
    }),
    sort,
  );

  const selected = managedSkills.find((skill) => skill.id === selectedId) ?? filtered[0] ?? managedSkills[0];
  const summary = summarizeSkillLibrary(managedSkills);

  function switchTab(next: SkillUiStatus | "all") {
    setStatusFilter(next);
    // If selected skill won't appear in the new tab, clear selection
    // so the detail panel stays coherent (first visible skill becomes selected)
    if (next !== "all" && selected && selected.status !== next) {
      setSelectedId(undefined);
    }
  }

  function handleScan(skill: SkillUiManagedSkill) {
    setScanningIds((prev) => new Set(prev).add(skill.id));
    onAction?.("scan", skill);
    // Parent will re-render with updated scan data. Show feedback for 2s.
    setTimeout(() => {
      setScanningIds((prev) => {
        const next = new Set(prev);
        next.delete(skill.id);
        return next;
      });
    }, 2000);
  }

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

  const riskLevel = selected ? getUiRiskLevel(selected.riskScore) : "safe";
  const isScanning = selected ? scanningIds.has(selected.id) : false;
  const needsReview = selected?.status === "review" || selected?.status === "block";

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
              <h1>{filtered.length} skill{filtered.length === 1 ? "" : "s"}</h1>
            </div>
            <div className="skill-manager-actions">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills..."
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SkillUiStatus | "all")}>
                <option value="all">All status</option>
                <option value="allow">Verified</option>
                <option value="review">Needs Review</option>
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
            <button
              type="button"
              className={statusFilter === "all" ? "is-active" : undefined}
              onClick={() => switchTab("all")}
            >
              All <span className="tab-count">{managedSkills.length}</span>
            </button>
            <button
              type="button"
              className={statusFilter === "review" ? "is-active" : undefined}
              onClick={() => switchTab("review")}
            >
              Review <span className="tab-count">{summary.review}</span>
            </button>
            <button
              type="button"
              className={statusFilter === "block" ? "is-active" : undefined}
              onClick={() => switchTab("block")}
            >
              Blocked <span className="tab-count">{summary.block}</span>
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="skill-ui-empty" style={{ padding: "24px" }}>
              No skills match the current filter.
            </p>
          ) : (
            <div className="skill-card-grid">
              {filtered.map((skill) => {
                const cardRisk = getUiRiskLevel(skill.riskScore);
                return (
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
                      <span className={`skill-ui-risk skill-ui-risk-${cardRisk}`} style={{ marginLeft: "auto" }}>
                        {RISK_LEVEL_LABEL[cardRisk]}
                      </span>
                    </div>
                    <div className="skill-card-divider" />
                    <span className="skill-card-label">Instructions</span>
                    <p>{skill.instructions}</p>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        <aside className="skill-manager-detail">
          <div className="skill-manager-section-title">Selected Skill</div>
          {selected ? (
            <>
              {/* ── Review / blocked banner ─────────────────────────────── */}
              {needsReview && (
                <div className={`skill-review-banner ${selected.status}`}>
                  <div className="skill-review-banner-head">
                    <strong>{selected.status === "block" ? "Blocked" : "Needs Review"}</strong>
                    <span className={`skill-ui-risk skill-ui-risk-${riskLevel}`}>
                      {RISK_LEVEL_LABEL[riskLevel]} · {selected.riskScore}/100
                    </span>
                  </div>
                  <p>
                    {selected.status === "block"
                      ? "Scan found danger-level findings. Do not install without expert review."
                      : "Scan found caution-level findings. Review the flags below before approving."}
                  </p>
                  {selected.ledger && Object.keys(selected.ledger.scan.categories).length > 0 && (
                    <div className="skill-review-categories">
                      <span className="skill-card-label">Flagged categories</span>
                      <div className="skill-review-cat-list">
                        {Object.entries(selected.ledger.scan.categories).map(([cat, count]) => (
                          <span key={cat} className="skill-review-cat">
                            {cat} <strong>{count as number}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="skill-review-actions">
                    <button type="button" className="primary" onClick={() => onAction?.("approve", selected)}>
                      Approve anyway
                    </button>
                    <button type="button" className="danger" onClick={() => onAction?.("block", selected)}>
                      Block this skill
                    </button>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => handleScan(selected)}
                    >
                      {isScanning ? "Scanning…" : "Re-scan"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Meta details ──────────────────────────────────────────── */}
              <dl className="skill-detail-list">
                <div><dt>Name</dt><dd>{selected.name}</dd></div>
                <div><dt>Category</dt><dd>{selected.category}</dd></div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={`skill-ui-pill ${selected.status}`}>
                      {statusText(selected.status)}
                    </span>
                  </dd>
                </div>
                {!needsReview && (
                  <div>
                    <dt>Risk</dt>
                    <dd>
                      <span className="skill-ui-risk-cell">
                        <span className={`skill-ui-risk skill-ui-risk-${riskLevel}`}>
                          {RISK_LEVEL_LABEL[riskLevel]}
                        </span>
                        <span className="skill-ui-risk-score">{selected.riskScore}/100</span>
                      </span>
                    </dd>
                  </div>
                )}
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

              {/* ── Actions ───────────────────────────────────────────────── */}
              <div className="skill-detail-actions">
                <button type="button" onClick={() => onAction?.("assign", selected)}>Assign</button>
                {!needsReview && (
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleScan(selected)}
                  >
                    {isScanning ? "Scanning…" : "Re-scan"}
                  </button>
                )}
                {!needsReview && (
                  <button type="button" onClick={() => onAction?.("approve", selected)}>Approve</button>
                )}
                <button type="button" onClick={() => {
                  void navigator.clipboard?.writeText(exportSkillMarkdown(selected));
                  onAction?.("export", selected);
                }}>Copy Markdown</button>
                <button type="button" onClick={() => onAction?.("export", selected)}>Export</button>
                <button type="button" className="danger" onClick={() => onAction?.("delete", selected)}>Delete</button>
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
