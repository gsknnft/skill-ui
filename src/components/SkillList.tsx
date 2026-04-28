import type { SkillListProps, SkillUiRow } from "../types";

const statusLabel: Record<SkillUiRow["status"], string> = {
  allow: "Allow",
  review: "Review",
  block: "Block",
};

export function SkillList({ skills, selectedId, onSelectSkill }: SkillListProps) {
  return (
    <div className="skill-ui-table-wrap">
      <table className="skill-ui-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Scope</th>
            <th>Action</th>
            <th>Risk</th>
            <th>Findings</th>
            <th>Scanner</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr
              key={skill.id}
              className={selectedId === skill.id ? "is-selected" : undefined}
              onClick={() => onSelectSkill?.(skill)}
            >
              <td>
                <strong>{skill.name}</strong>
                <span>{skill.source}</span>
              </td>
              <td>{skill.scope}</td>
              <td>
                <span className={`skill-ui-pill ${skill.status}`}>
                  {statusLabel[skill.status]}
                </span>
              </td>
              <td>{skill.riskScore}</td>
              <td>{skill.findings}</td>
              <td>{skill.scanner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SkillList;
