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
      <h2 style={styles.title}>Demande</h2>
      <p style={styles.meta}>Agent selectionne : {selectedAgentLabel}</p>
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
  title: {
    marginTop: 0,
    color: "#1d2433",
  },
  meta: {
    marginTop: -4,
    color: "#6a6f79",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    resize: "vertical",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: 14,
    font: "inherit",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 14,
    alignItems: "center",
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
    background: "#234b63",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid rgba(31,40,55,0.12)",
    borderRadius: 999,
    padding: "12px 18px",
    background: "#fff",
    color: "#1d2433",
    cursor: "pointer",
  },
  hint: {
    color: "#6a6f79",
    fontSize: 13,
  },
};
