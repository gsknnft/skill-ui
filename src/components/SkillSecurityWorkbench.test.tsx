import { describe, expect, it } from "vitest";
import { demoManagedSkills, demoManifest, demoReport, demoSuppressionAudit } from "../lib/demoData";

describe("skill-ui demo contracts", () => {
  it("ships demo data aligned to ledger and safe report shapes", () => {
    expect(demoManifest.version).toBe("skill-ledger.manifest.v1");
    expect(demoManifest.skills).toHaveLength(2);
    expect(demoReport.version).toBe("skill-safe.full-report.v1");
    expect(demoSuppressionAudit.version).toBe("skill-safe.suppression-audit.v1");
    expect(demoManagedSkills.length).toBeGreaterThan(3);
  });
});
