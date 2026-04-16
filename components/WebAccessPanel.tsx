import type { AgentId } from "../lib/types";

type WebAccessLevel = "none" | "limited" | "broad" | "official_only";

type WebAccessRule = {
  level: WebAccessLevel;
  note: string;
};

const rules: Record<AgentId, WebAccessRule> = {
  ekt: {
    level: "none",
    note: "Relit et arbitre ; ne cherche pas le web en premiere ligne.",
  },
  vie: {
    level: "broad",
    note: "Acces large pour usage reel, meteo, comportements, entretien, signaux faibles.",
  },
  juridique: {
    level: "official_only",
    note: "Recherche uniquement sur sources officielles et corpus opposables.",
  },
  chantier: {
    level: "limited",
    note: "Recherche ciblee sur notices, documentations et references techniques.",
  },
  exploitation: {
    level: "limited",
    note: "Recherche ciblee sur hospitalite, flux, evenementiel et experience.",
  },
  finances: {
    level: "limited",
    note: "Recherche ciblee sur donnees economiques, ratios et comparables dates.",
  },
  ecologie: {
    level: "broad",
    note: "Acces large pour meteo, ressources, restrictions, climat et vegetation.",
  },
  enosirai: {
    level: "limited",
    note: "Recherche technique ciblee sur documentations machine et protocoles.",
  },
  administratif: {
    level: "limited",
    note: "Recherche ciblee sur formulaires, procedures, contacts et services.",
  },
  conseil3ia: {
    level: "none",
    note: "Agent de confrontation multi-fournisseurs ; pas de recherche web autonome ici.",
  },
};

const levelLabels: Record<WebAccessLevel, string> = {
  none: "Aucun acces autonome",
  limited: "Acces cible",
  broad: "Acces large encadre",
  official_only: "Sources officielles uniquement",
};

export function WebAccessPanel() {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>Acces Internet prepare</h3>
      <p style={styles.meta}>
        Gouvernance cible avant branchement du web dans le prototype.
      </p>
      <div style={styles.grid}>
        {Object.entries(rules).map(([agentId, rule]) => (
          <article key={agentId} style={styles.item}>
            <div style={styles.topRow}>
              <strong style={styles.agent}>{agentId.toUpperCase()}</strong>
              <span style={styles.badge}>{levelLabels[rule.level]}</span>
            </div>
            <p style={styles.note}>{rule.note}</p>
          </article>
        ))}
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
    margin: "0 0 8px",
    color: "#1d2433",
  },
  meta: {
    margin: "0 0 12px",
    color: "#6a6f79",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gap: 10,
  },
  item: {
    padding: 12,
    borderRadius: 14,
    background: "#fcfbf8",
    border: "1px solid rgba(31,40,55,0.08)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  agent: {
    color: "#18314a",
  },
  badge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    background: "#edf2f7",
    color: "#324055",
  },
  note: {
    margin: "8px 0 0",
    color: "#566072",
    lineHeight: 1.5,
    fontSize: 13,
  },
};
