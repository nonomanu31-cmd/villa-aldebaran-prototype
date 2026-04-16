import type { AgentDefinition } from "../lib/types";

type MeetingSelectorProps = {
  agents: AgentDefinition[];
  selectedAgentIds: AgentDefinition["id"][];
  onToggle: (agentId: AgentDefinition["id"]) => void;
};

export function MeetingSelector({
  agents,
  selectedAgentIds,
  onToggle,
}: MeetingSelectorProps) {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>Reunion IA</h3>
      <p style={styles.meta}>
        Choisissez les agents qui doivent participer au tour de table.
      </p>
      <div style={styles.grid}>
        {agents
          .filter((agent) => agent.id !== "ekt" && agent.id !== "conseil3ia")
          .map((agent) => {
            const checked = selectedAgentIds.includes(agent.id);
            return (
              <label key={agent.id} style={checked ? styles.itemActive : styles.item}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(agent.id)}
                />
                <span style={styles.labelWrap}>
                  <strong>{agent.label}</strong>
                  <span style={styles.description}>{agent.description}</span>
                </span>
              </label>
            );
          })}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
  },
  title: {
    margin: "0 0 8px",
    color: "#1d2433",
  },
  meta: {
    margin: "0 0 12px",
    color: "#6a6f79",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gap: 10,
  },
  item: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 10,
    alignItems: "start",
    padding: 12,
    borderRadius: 14,
    background: "#fcfbf8",
    border: "1px solid rgba(31,40,55,0.08)",
  },
  itemActive: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 10,
    alignItems: "start",
    padding: 12,
    borderRadius: 14,
    background: "#eef5f0",
    border: "1px solid rgba(31,75,63,0.18)",
  },
  labelWrap: {
    display: "grid",
    gap: 4,
  },
  description: {
    color: "#566072",
    fontSize: 13,
    lineHeight: 1.45,
  },
};
