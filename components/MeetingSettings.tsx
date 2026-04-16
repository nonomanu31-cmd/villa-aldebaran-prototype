import type { AgentDefinition, AgentId } from "../lib/types";

type MeetingSettingsProps = {
  moderatorId: AgentId;
  agenda: string;
  agents: AgentDefinition[];
  onModeratorChange: (agentId: AgentId) => void;
  onAgendaChange: (value: string) => void;
  onRunMeeting: () => void;
  isLoading: boolean;
  canRunMeeting: boolean;
};

export function MeetingSettings({
  moderatorId,
  agenda,
  agents,
  onModeratorChange,
  onAgendaChange,
  onRunMeeting,
  isLoading,
  canRunMeeting,
}: MeetingSettingsProps) {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>Cadre de reunion</h3>
      <label style={styles.label}>
        Moderateur
        <select
          value={moderatorId}
          onChange={(event) => onModeratorChange(event.target.value as AgentId)}
          style={styles.select}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.label}
            </option>
          ))}
        </select>
      </label>
      <label style={styles.label}>
        Ordre du jour
        <textarea
          value={agenda}
          onChange={(event) => onAgendaChange(event.target.value)}
          placeholder="Exemple : 1. PMR 2. Sequence chantier 3. Arbitrage budget 4. Actions de la semaine"
          style={styles.textarea}
        />
      </label>
      <button
        type="button"
        onClick={onRunMeeting}
        disabled={isLoading || !canRunMeeting}
        style={styles.launchButton}
      >
        {isLoading ? "Lancement..." : "Lancer la reunion IA"}
      </button>
      <p style={styles.helper}>
        {canRunMeeting
          ? "Le tour de table, la synthese du moderateur et le compte rendu administratif seront generes."
          : "Choisissez au moins un agent participant pour pouvoir lancer la reunion."}
      </p>
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
    margin: "0 0 10px",
    color: "#1d2433",
  },
  label: {
    display: "grid",
    gap: 8,
    color: "#324052",
    fontWeight: 600,
    marginTop: 10,
  },
  select: {
    borderRadius: 12,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 10,
    font: "inherit",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    resize: "vertical",
    borderRadius: 14,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 12,
    font: "inherit",
  },
  launchButton: {
    marginTop: 14,
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    background: "#1f4b3f",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  helper: {
    margin: "10px 0 0",
    color: "#6a6f79",
    fontSize: 13,
    lineHeight: 1.5,
  },
};
