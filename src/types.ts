export type SkillUiStatus = "allow" | "review" | "block";

export type SkillUiPolicyPreset = "strict" | "marketplace" | "workspace";

/** Maps a 0–100 risk score to a named tier. Mirrors SkillRiskLevel from skill-safe. */
export type SkillUiRiskLevel = "safe" | "low" | "moderate" | "elevated" | "high" | "critical";

/** Map a 0–100 score to a risk level tier. */
export function getUiRiskLevel(score: number): SkillUiRiskLevel {
  if (score === 0) return "safe";
  if (score <= 20) return "low";
  if (score <= 40) return "moderate";
  if (score <= 60) return "elevated";
  if (score <= 80) return "high";
  return "critical";
}

/** Human-readable label for a risk level. */
export const RISK_LEVEL_LABEL: Record<SkillUiRiskLevel, string> = {
  safe: "Safe",
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};

export type SkillUiLedgerEntry = {
  id: string;
  name?: string;
  source: string;
  resolvedUrl?: string | null;
  scope: "global" | "repo" | "workspace" | string;
  installedAt: string;
  updatedAt?: string;
  integrity: string;
  scanner: { name: string; version: string; reportVersion: string };
  scan: {
    safeToInstall: boolean;
    recommendedAction: SkillUiStatus;
    severity: "safe" | "caution" | "danger";
    riskScore: number;
    flagCount: number;
    categories: Record<string, number>;
    mappings: { owasp: string[]; mitreAtlas: string[]; nistAiRmf: string[] };
  };
};

export type SkillUiLedgerManifest = {
  version: string;
  generatedAt?: string;
  sourceId?: string;
  skills: SkillUiLedgerEntry[];
};

export type SkillUiFullReport = {
  version: string;
  generatedAt: string;
  mode: string;
  ok: boolean;
  summary: {
    safeToInstall: boolean;
    recommendedAction: SkillUiStatus;
    severity: "safe" | "caution" | "danger";
    riskScore: number;
    documents: number;
    passed: number;
    review: number;
    blocked: number;
    findings: number;
    danger: number;
    caution: number;
    hiddenContent: number;
    normalizedMatches: number;
    suppressions?: number;
  };
  categories: Record<string, number>;
  mappings: { owasp: string[]; mitreAtlas: string[]; nistAiRmf: string[] };
  documents: Array<{
    id: string;
    source: string;
    trust: string;
    scan: {
      severity: "safe" | "caution" | "danger";
      flags: unknown[];
      report: { recommendedAction: SkillUiStatus; riskScore: number };
    };
  }>;
};

export type SkillUiDoctorSummary = {
  total: number;
  byScope: Record<string, number>;
  duplicates: number;
  duplicateGroups: { key: string; ids: string[] }[];
  changedSinceInstall: number | "unknown";
  missingSkillMd: number | "unknown";
  needsReview: number;
  blocked: number;
};

export type SkillUiManifestValidationResult = {
  valid: boolean;
  issues: Array<{ severity: "error" | "warning"; path: string; message: string }>;
};

export type SkillUiSuppressionAuditReport = {
  version: string;
  ok: boolean;
  invalid: number;
  unused: number;
  findings: Array<{
    documentId: string;
    ruleId: string;
    line: number;
    reason: string;
    issue: "invalid-rule" | "unused-suppression";
  }>;
};

export type SkillUiRow = {
  id: string;
  name: string;
  source: string;
  scope: string;
  status: SkillUiStatus;
  severity: "safe" | "caution" | "danger";
  riskScore: number;
  findings: number;
  scanner: string;
  ledger?: SkillUiLedgerEntry;
};

export type SkillUiManagedSkill = SkillUiRow & {
  category: string;
  description: string;
  instructions: string;
  tools: string[];
  assignedAgents: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type SkillManagerAction =
  | "import"
  | "new"
  | "export"
  | "delete"
  | "assign"
  | "edit"
  | "scan"
  | "approve"
  | "block";

export type SkillManagerProps = SkillSecurityWorkbenchProps & {
  skills?: SkillUiManagedSkill[];
  defaultView?: "manager" | "workbench";
  onAction?: (action: SkillManagerAction, skill?: SkillUiManagedSkill) => void;
  agents?: string[];
};

export type SkillSecurityWorkbenchProps = {
  title?: string;
  subtitle?: string;
  manifest?: SkillUiLedgerManifest;
  report?: SkillUiFullReport;
  doctor?: SkillUiDoctorSummary;
  validation?: SkillUiManifestValidationResult;
  suppressionAudit?: SkillUiSuppressionAuditReport;
  policyPreset?: SkillUiPolicyPreset;
  onSelectSkill?: (row: SkillUiRow) => void;
};

export type SkillListProps = {
  skills: SkillUiRow[];
  selectedId?: string;
  onSelectSkill?: (row: SkillUiRow) => void;
};
