import type { WorkingMemory } from "../lib/memory";

type WorkingMemoryPanelProps = {
  memory: WorkingMemory | null;
  selectedAgentId: string;
  responseText: string | null;
  onRefresh: () => Promise<void>;
  onSaveContext: () => Promise<void>;
  activeContextDraft: string;
  onActiveContextDraftChange: (value: string) => void;
};

export function WorkingMemoryPanel({
  memory,
  selectedAgentId,
  responseText,
  onRefresh,
  onSaveContext,
  activeContextDraft,
  onActiveContextDraftChange,
}: WorkingMemoryPanelProps) {
  async function capture(type: "decision" | "alert" | "openQuestion") {
    if (!responseText) return;

    const titleMap = {
      decision: "Decision a suivre",
      alert: "Alerte a surveiller",
      openQuestion: "Question ouverte",
    };

    await fetch("/api/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "capture",
        type,
        title: titleMap[type],
        content: responseText.slice(0, 2500),
        sourceAgentId: selectedAgentId,
      }),
    });

    await onRefresh();
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Memoire de travail</h2>
        <button style={styles.refreshButton} type="button" onClick={onRefresh}>
          Actualiser
        </button>
      </div>

      <label style={styles.label}>Contexte actif</label>
      <textarea
        style={styles.textarea}
        value={activeContextDraft}
        onChange={(event) => onActiveContextDraftChange(event.target.value)}
      />
      <button style={styles.primaryButton} type="button" onClick={onSaveContext}>
        Enregistrer le contexte
      </button>

      <div style={styles.captureRow}>
        <button
          style={styles.secondaryButton}
          type="button"
          onClick={() => capture("decision")}
          disabled={!responseText}
        >
          Capturer en decision
        </button>
        <button
          style={styles.secondaryButton}
          type="button"
          onClick={() => capture("alert")}
          disabled={!responseText}
        >
          Capturer en alerte
        </button>
        <button
          style={styles.secondaryButton}
          type="button"
          onClick={() => capture("openQuestion")}
          disabled={!responseText}
        >
          Capturer en question
        </button>
      </div>

      <MemorySection title="Decisions" items={memory?.decisions ?? []} />
      <MemorySection title="Alertes" items={memory?.alerts ?? []} />
      <MemorySection title="Questions ouvertes" items={memory?.openQuestions ?? []} />
    </section>
  );
}

function MemorySection({
  title,
  items,
}: {
  title: string;
  items: WorkingMemory["decisions"];
}) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {items.length === 0 ? (
        <p style={styles.empty}>Aucun element pour l&apos;instant.</p>
      ) : (
        <div style={styles.list}>
          {items.slice(0, 5).map((item) => (
            <div key={item.id} style={styles.item}>
              <strong style={styles.itemTitle}>{item.title}</strong>
              <p style={styles.itemMeta}>
                {item.sourceAgentId.toUpperCase()} • {new Date(item.createdAt).toLocaleString("fr-FR")}
              </p>
              <p style={styles.itemText}>{item.content.slice(0, 320)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    margin: 0,
    color: "#1d2433",
  },
  refreshButton: {
    border: "1px solid rgba(31,40,55,0.12)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "#fff",
    cursor: "pointer",
  },
  label: {
    display: "block",
    marginTop: 14,
    marginBottom: 8,
    fontWeight: 700,
    color: "#314152",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    resize: "vertical",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 12,
    font: "inherit",
  },
  primaryButton: {
    marginTop: 10,
    border: 0,
    borderRadius: 999,
    padding: "10px 14px",
    background: "#1f4b3f",
    color: "#fff",
    cursor: "pointer",
  },
  captureRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
  secondaryButton: {
    border: "1px solid rgba(31,40,55,0.12)",
    borderRadius: 999,
    padding: "10px 14px",
    background: "#fff",
    color: "#1d2433",
    cursor: "pointer",
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    margin: "0 0 10px",
    color: "#18314a",
  },
  empty: {
    margin: 0,
    color: "#6a6f79",
  },
  list: {
    display: "grid",
    gap: 10,
  },
  item: {
    borderRadius: 14,
    background: "#f8f7f4",
    border: "1px solid rgba(31,40,55,0.06)",
    padding: 12,
  },
  itemTitle: {
    color: "#1d2433",
  },
  itemMeta: {
    margin: "6px 0",
    color: "#6a6f79",
    fontSize: 13,
  },
  itemText: {
    margin: 0,
    color: "#314152",
    lineHeight: 1.5,
  },
};
