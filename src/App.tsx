import SkillManager from "./components/SkillManager";
import {
  demoManagedSkills,
  demoManifest,
  demoReport,
  demoSuppressionAudit,
} from "./lib/demoData";

export default function App() {
  return (
    <SkillManager
      skills={demoManagedSkills}
      manifest={demoManifest}
      report={demoReport}
      suppressionAudit={demoSuppressionAudit}
      policyPreset="marketplace"
    />
  );
}
