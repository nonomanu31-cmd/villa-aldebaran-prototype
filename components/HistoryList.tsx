export function HistoryList() {
  return (
    <div style={styles.list}>
      <div style={styles.item}>
        <strong>Aucun échange sauvegardé pour l&apos;instant.</strong>
        <p style={styles.text}>
          La V1 stockera localement les exécutions d&apos;agents dans `data/history.json`.
        </p>
      </div>
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
  text: {
    marginBottom: 0,
    color: "#566072",
  },
};

