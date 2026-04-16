import type { AgentRunRecord } from "../lib/types";

type HistoryListProps = {
  history: AgentRunRecord[];
};

export function HistoryList({ history }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div style={styles.list}>
        <div style={styles.item}>
          <strong>Aucun echange sauvegarde pour l&apos;instant.</strong>
          <p style={styles.text}>
            La V1 stocke localement les executions d&apos;agents dans `data/history.json`.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {history.map((entry) => (
        <article key={entry.id} style={styles.item}>
          <strong style={styles.title}>{entry.agentId.toUpperCase()}</strong>
          <p style={styles.meta}>{new Date(entry.createdAt).toLocaleString("fr-FR")}</p>
          <p style={styles.label}>Demande</p>
          <p style={styles.text}>{entry.userPrompt}</p>
          <p style={styles.label}>Reponse</p>
          <p style={styles.text}>{entry.response.slice(0, 900)}</p>
        </article>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: "grid",
    gap: 12,
  },
  item: {
    borderRadius: 16,
    padding: 16,
    background: "#f8f7f3",
    border: "1px solid rgba(31,40,55,0.08)",
  },
  title: {
    color: "#1d2433",
  },
  meta: {
    margin: "6px 0 10px",
    color: "#6a6f79",
    fontSize: 13,
  },
  label: {
    margin: "10px 0 4px",
    color: "#18314a",
    fontWeight: 700,
  },
  text: {
    margin: 0,
    color: "#566072",
    lineHeight: 1.55,
  },
};
