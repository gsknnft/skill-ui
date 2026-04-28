import type {
  SkillUiLedgerEntry,
  SkillUiLedgerManifest,
  SkillUiManagedSkill,
  SkillUiStatus,
} from "../types";

export type SkillLibrarySummary = {
  total: number;
  allow: number;
  review: number;
  block: number;
  categories: Array<{ name: string; count: number }>;
  assignedAgents: Array<{ name: string; count: number }>;
};

export type SkillFilterOptions = {
  query?: string;
  category?: string;
  status?: SkillUiStatus | "all";
  agent?: string;
};

export type SkillSortKey = "name" | "risk" | "updated" | "status";

export function managedSkillFromLedger(entry: SkillUiLedgerEntry): SkillUiManagedSkill {
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

export function managedSkillsFromManifest(
  manifest?: SkillUiLedgerManifest,
): SkillUiManagedSkill[] {
  return manifest?.skills.map(managedSkillFromLedger) ?? [];
}

export function getSkillCategories(skills: SkillUiManagedSkill[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const skill of skills) counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
  return [["all", skills.length], ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))];
}

export function filterManagedSkills(
  skills: SkillUiManagedSkill[],
  options: SkillFilterOptions = {},
): SkillUiManagedSkill[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  return skills.filter((skill) => {
    const matchesCategory = !options.category || options.category === "all" || skill.category === options.category;
    const matchesStatus = !options.status || options.status === "all" || skill.status === options.status;
    const matchesAgent = !options.agent || skill.assignedAgents.includes(options.agent);
    const haystack = [
      skill.name,
      skill.source,
      skill.category,
      skill.description,
      skill.instructions,
      skill.tools.join(" "),
      skill.assignedAgents.join(" "),
    ].join(" ").toLowerCase();
    return matchesCategory && matchesStatus && matchesAgent && (!query || haystack.includes(query));
  });
}

export function sortManagedSkills(
  skills: SkillUiManagedSkill[],
  key: SkillSortKey = "name",
): SkillUiManagedSkill[] {
  return [...skills].sort((a, b) => {
    if (key === "risk") return b.riskScore - a.riskScore || a.name.localeCompare(b.name);
    if (key === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
    if (key === "updated") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}

export function summarizeSkillLibrary(skills: SkillUiManagedSkill[]): SkillLibrarySummary {
  const agents = new Map<string, number>();
  for (const skill of skills) {
    for (const agent of skill.assignedAgents) agents.set(agent, (agents.get(agent) ?? 0) + 1);
  }
  return {
    total: skills.length,
    allow: skills.filter((skill) => skill.status === "allow").length,
    review: skills.filter((skill) => skill.status === "review").length,
    block: skills.filter((skill) => skill.status === "block").length,
    categories: getSkillCategories(skills)
      .filter(([name]) => name !== "all")
      .map(([name, count]) => ({ name, count })),
    assignedAgents: [...agents.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count })),
  };
}

export function exportSkillMarkdown(skill: SkillUiManagedSkill): string {
  const metadata = [
    "---",
    `name: ${skill.name}`,
    `category: ${skill.category}`,
    `source: ${skill.source}`,
    `status: ${skill.status}`,
    skill.tools.length ? `tools: ${skill.tools.join(", ")}` : "tools: none",
    skill.assignedAgents.length ? `agents: ${skill.assignedAgents.join(", ")}` : "agents: none",
    "---",
    "",
  ].join("\n");
  return `${metadata}${skill.instructions.trim()}\n`;
}
