type ContextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ContextEditor({ value, onChange }: ContextEditorProps) {
  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Contexte</h2>
        <p style={styles.hint}>Cadre vivant du dossier pour tous les agents</p>
      </div>
      <textarea
        style={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#1d2433",
  },
  hint: {
    margin: 0,
    color: "#6a6f79",
    fontSize: 13,
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    resize: "vertical",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 14,
    font: "inherit",
    background: "#fcfbf8",
  },
};
