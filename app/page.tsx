import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.hero}>
        <p style={styles.kicker}>Villa Aldebaran</p>
        <h1 style={styles.title}>Prototype prompts multi-agents</h1>
        <p style={styles.text}>
          Cockpit multi-agents Villa Aldebaran, preparé pour un usage web et telephone.
        </p>
        <div style={styles.actions}>
          <Link href="/cockpit" style={styles.primaryLink}>
            Ouvrir le cockpit
          </Link>
          <Link href="/gantt" style={styles.secondaryLink}>
            Vue Gantt
          </Link>
          <Link href="/history" style={styles.secondaryLink}>
            Voir l&apos;historique
          </Link>
          <Link href="/documents" style={styles.secondaryLink}>
            Centre documentaire
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg, #f5eddc 0%, #dce7e1 45%, #d4d8e8 100%)",
    padding: 24,
  },
  hero: {
    maxWidth: 760,
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(34,34,34,0.08)",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 50px rgba(40, 47, 62, 0.12)",
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#5f5b52",
  },
  title: {
    margin: "12px 0",
    fontSize: 42,
    lineHeight: 1.05,
    color: "#1d2433",
  },
  text: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.6,
    color: "#364055",
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 24,
  },
  primaryLink: {
    padding: "12px 18px",
    borderRadius: 999,
    background: "#1f4b3f",
    color: "#fff",
    textDecoration: "none",
  },
  secondaryLink: {
    padding: "12px 18px",
    borderRadius: 999,
    background: "#fff",
    color: "#1d2433",
    textDecoration: "none",
    border: "1px solid rgba(29,36,51,0.12)",
  },
};
