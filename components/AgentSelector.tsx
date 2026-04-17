import type { AgentDefinition } from "../lib/types";

type AgentSelectorProps = {
  agents: AgentDefinition[];
  selectedAgentId: string;
  onSelect: (agentId: AgentDefinition["id"]) => void;
};

export function AgentSelector({
  agents,
  selectedAgentId,
  onSelect,
}: AgentSelectorProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        maxHeight: 520,
        overflow: "auto",
        paddingRight: 4,
      }}
    >
      {agents.map((agent) => {
        const selected = agent.id === selectedAgentId;
        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            style={{
              textAlign: "left",
              padding: 14,
              borderRadius: 16,
              border: selected
                ? "1px solid rgba(31,75,63,0.28)"
                : "1px solid rgba(31,40,55,0.08)",
              background: selected ? "#eef5f0" : "#fff",
              cursor: "pointer",
              boxShadow: selected ? "0 8px 20px rgba(31,75,63,0.08)" : "none",
            }}
          >
            <strong style={{ fontSize: 16 }}>{agent.label}</strong>
            <p style={{ margin: "8px 0 0", color: "#566072", lineHeight: 1.45 }}>
              {agent.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
