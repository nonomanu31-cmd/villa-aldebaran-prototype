type PromptConsoleProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSendToEkt: () => void;
  onRunMeeting: () => void;
  isLoading: boolean;
  selectedAgentLabel: string;
  placeholder: string;
  canForwardToEkt: boolean;
  meetingCount: number;
  canUseWeb: boolean;
  useWeb: boolean;
  onUseWebChange: (value: boolean) => void;
  webNote: string;
  ektActionLabel?: string;
};

export function PromptConsole({
  value,
  onChange,
  onSubmit,
  onSendToEkt,
  onRunMeeting,
  isLoading,
  selectedAgentLabel,
  placeholder,
  canForwardToEkt,
  meetingCount,
  canUseWeb,
  useWeb,
  onUseWebChange,
  webNote,
  ektActionLabel,
}: PromptConsoleProps) {
  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Demande</h2>
          <p style={styles.meta}>Agent selectionne : {selectedAgentLabel}</p>
        </div>
        <span style={styles.keyboardHint}>Ctrl + Entree pour envoyer</span>
      </div>
      <textarea
        style={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <label style={styles.webToggle}>
        <input
          type="checkbox"
          checked={useWeb}
          onChange={(event) => onUseWebChange(event.target.checked)}
          disabled={!canUseWeb || isLoading}
        />
        <span>
          Activer la recherche Internet pour cet agent
          <small style={styles.webHint}>
            {canUseWeb ? webNote : "Cet agent n'a pas d'acces web autonome."}
          </small>
        </span>
      </label>
      <div style={styles.actions}>
        <button style={styles.primaryButton} type="button" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Envoi..." : "Envoyer"}
        </button>
        <button
          style={styles.secondaryButton}
          type="button"
          onClick={onSendToEkt}
          disabled={isLoading}
        >
          {ektActionLabel || "Envoyer a EKT"}
        </button>
        <button
          style={styles.secondaryButton}
          type="button"
          onClick={onRunMeeting}
          disabled={isLoading || meetingCount === 0}
        >
          Lancer la reunion IA
        </button>
        <span style={styles.hint}>
          {canForwardToEkt
            ? "La derniere reponse agent sera transmise a EKT pour lecture transverse."
            : meetingCount > 0
              ? `Reunion prete avec ${meetingCount} agent(s).`
              : "Envoyez d'abord Vie ou Juridique, puis transmettez a EKT."}
        </span>
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
  meta: {
    margin: "6px 0 0",
    color: "#6a6f79",
    fontSize: 14,
  },
  keyboardHint: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f2f4ef",
    border: "1px solid rgba(31,40,55,0.08)",
    color: "#5f6a62",
    fontSize: 12,
    whiteSpace: "nowrap" as const,
  },
  textarea: {
    width: "100%",
    minHeight: 240,
    resize: "vertical",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 14,
    font: "inherit",
    background: "#fcfbf8",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 14,
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  webToggle: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 10,
    alignItems: "start",
    marginTop: 14,
    color: "#324052",
  },
  webHint: {
    display: "block",
    marginTop: 4,
    color: "#6a6f79",
    fontSize: 12,
    fontWeight: 400,
  },
  primaryButton: {
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    background: "#1f4b3f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    border: "1px solid rgba(31,40,55,0.12)",
    borderRadius: 999,
    padding: "12px 18px",
    background: "#fff",
    color: "#1d2433",
    cursor: "pointer",
    fontWeight: 700,
  },
  hint: {
    color: "#6a6f79",
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: 420,
  },
};
