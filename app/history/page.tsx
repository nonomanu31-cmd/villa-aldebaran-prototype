import { HistoryList } from "../../components/HistoryList";
import { readHistory } from "../../lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HistoryPage() {
  const history = await readHistory();

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Historique</h1>
        <p style={styles.text}>
          Cette page affiche les echanges enregistres du prototype.
        </p>
        <HistoryList history={history} />
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f1ea",
    padding: 24,
  },
  card: {
    maxWidth: 900,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 24,
    padding: 24,
    border: "1px solid rgba(31,40,55,0.08)",
  },
  title: {
    marginTop: 0,
    color: "#1d2433",
  },
  text: {
    color: "#4a5568",
  },
};
