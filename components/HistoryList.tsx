"use client";

import { useState } from "react";
import type { AgentRunRecord } from "../lib/types";

type HistoryListProps = {
  history: AgentRunRecord[];
};

export function HistoryList({ history }: HistoryListProps) {
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  const toggleEntry = (entryId: string) => {
    setExpandedEntries((current) => ({
      ...current,
      [entryId]: !current[entryId],
    }));
  };

  if (history.length === 0) {
    return (
      <div style={styles.list}>
        <div style={styles.item}>
          <strong>Aucun echange sauvegarde pour l&apos;instant.</strong>
          <p style={styles.text}>
            Les executions d&apos;agents et les reunions archivees apparaitront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {history.map((entry) => {
        const isExpanded = expandedEntries[entry.id] ?? false;
        const isLongResponse = entry.response.length > 900;
        const displayedResponse =
          isExpanded || !isLongResponse ? entry.response : `${entry.response.slice(0, 900)}...`;

        return (
          <article key={entry.id} style={styles.item}>
            <strong style={styles.title}>{entry.agentId.toUpperCase()}</strong>
            <p style={styles.meta}>{new Date(entry.createdAt).toLocaleString("fr-FR")}</p>
            {entry.userPrompt.startsWith("[Reunion IA]") ? (
              <p style={styles.meetingBadge}>Archive de reunion</p>
            ) : null}
            <p style={styles.label}>Demande</p>
            <p style={styles.text}>{entry.userPrompt}</p>
            <p style={styles.label}>Reponse</p>
            <p style={styles.text}>{displayedResponse}</p>
            {isLongResponse ? (
              <button
                type="button"
                onClick={() => toggleEntry(entry.id)}
                style={styles.toggleButton}
              >
                {isExpanded ? "Voir moins" : "Voir la reponse complete"}
              </button>
            ) : null}
          </article>
        );
      })}
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
  meetingBadge: {
    margin: "0 0 10px",
    display: "inline-block",
    borderRadius: 999,
    padding: "6px 10px",
    background: "#eef5f0",
    color: "#1f4b3f",
    fontSize: 12,
    fontWeight: 700,
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
  toggleButton: {
    marginTop: 12,
    border: "none",
    background: "#eef3fb",
    color: "#214263",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
