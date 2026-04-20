import { parseModelResponse } from "../lib/response-parser";
import type { EktEvaluation } from "../lib/types";

type ResponsePanelProps = {
  selectedAgentId: string;
  sourceResponse: {
    agentId: string;
    message: string;
    promptPreview: string;
    evaluation?: EktEvaluation | null;
    sources?: Array<{
      url: string;
      title?: string;
    }>;
  } | null;
  response: {
    agentId: string;
    message: string;
    promptPreview: string;
    evaluation?: EktEvaluation | null;
    sources?: Array<{
      url: string;
      title?: string;
    }>;
  } | null;
  error: string | null;
  isLoading: boolean;
};

export function ResponsePanel({
  selectedAgentId,
  sourceResponse,
  response,
  error,
  isLoading,
}: ResponsePanelProps) {
  const showDebug = !!response?.promptPreview;
  const parsed = response ? parseModelResponse(response.message) : null;
  const evaluation = response?.evaluation ?? null;
  const parsedSource =
    sourceResponse && sourceResponse.agentId !== response?.agentId
      ? parseModelResponse(sourceResponse.message)
      : null;

  return (
    <section>
      <div style={styles.header}>
        <h2 style={styles.title}>Lecture agent</h2>
        <span style={styles.statusPill}>{selectedAgentId.toUpperCase()}</span>
      </div>
      <div style={styles.card}>
        {response || isLoading || error ? <p style={styles.meta}>Reponse</p> : null}
        <div style={styles.outputShell}>
          {isLoading ? (
            <pre style={styles.pre}>Generation en cours...</pre>
          ) : error ? (
            <pre style={styles.pre}>{`Erreur : ${error}`}</pre>
          ) : parsed ? (
            <div style={styles.sections}>
              {parsed.sections.map((section, index) => (
                <section key={`${section.title}-${index}`} style={styles.sectionCard}>
                  <h3 style={styles.sectionTitle}>{section.title}</h3>
                  <div style={styles.sectionBody}>
                    {section.body.map((line, lineIndex) => {
                      if (!line) {
                        return <div key={lineIndex} style={{ height: 8 }} />;
                      }

                      const isBullet =
                        line.startsWith("- ") ||
                        line.startsWith("* ") ||
                        /^\d+\./.test(line);

                      return isBullet ? (
                        <div key={lineIndex} style={styles.bulletLine}>
                          <span style={styles.bulletMark}>•</span>
                          <span>{line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")}</span>
                        </div>
                      ) : (
                        <p key={lineIndex} style={styles.paragraph}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState} />
          )}
        </div>
        {showDebug ? (
          <details style={styles.details}>
            <summary style={styles.summary}>Voir le prompt debug</summary>
            <pre style={styles.debugPre}>{response?.promptPreview}</pre>
          </details>
        ) : null}
        {response?.sources?.length ? (
          <section style={styles.sourcesSection}>
            <h3 style={styles.sourcesTitle}>Sources web</h3>
            <ul style={styles.sourcesList}>
              {response.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" style={styles.sourceLink}>
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {evaluation ? (
          <section style={styles.evaluationSection}>
            <div style={styles.evaluationHeader}>
              <h3 style={styles.evaluationTitle}>Evaluation EKT solo</h3>
              <span style={styles.scorePill}>{evaluation.totalScore}/40</span>
            </div>
            <p style={styles.evaluationSummary}>{evaluation.summary}</p>
            <div style={styles.evaluationGrid}>
              {evaluation.criteria.map((criterion) => (
                <article key={criterion.label} style={styles.evaluationCard}>
                  <div style={styles.evaluationRow}>
                    <strong style={styles.evaluationLabel}>{criterion.label}</strong>
                    <span style={styles.criterionScore}>{criterion.score}/4</span>
                  </div>
                  <p style={styles.evaluationObservation}>{criterion.observation}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {parsedSource ? (
          <section style={styles.archivedSection}>
            <h3 style={styles.archivedTitle}>
              Rapport source conserve - {sourceResponse?.agentId.toUpperCase()}
            </h3>
            <div style={styles.outputShell}>
              <div style={styles.sections}>
                {parsedSource.sections.map((section, index) => (
                  <section key={`${section.title}-${index}`} style={styles.sectionCard}>
                    <h3 style={styles.sectionTitle}>{section.title}</h3>
                    <div style={styles.sectionBody}>
                      {section.body.map((line, lineIndex) => {
                        if (!line) {
                          return <div key={lineIndex} style={{ height: 8 }} />;
                        }

                        const isBullet =
                          line.startsWith("- ") ||
                          line.startsWith("* ") ||
                          /^\d+\./.test(line);

                        return isBullet ? (
                          <div key={lineIndex} style={styles.bulletLine}>
                            <span style={styles.bulletMark}>•</span>
                            <span>{line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")}</span>
                          </div>
                        ) : (
                          <p key={lineIndex} style={styles.paragraph}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#1d2433",
  },
  statusPill: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#eef5f0",
    border: "1px solid rgba(31,75,63,0.12)",
    color: "#1f4b3f",
    fontSize: 12,
    fontWeight: 700,
  },
  card: {
    background: "#f7f7f5",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
  },
  meta: {
    marginTop: 0,
    color: "#5f5b52",
    fontSize: 14,
  },
  outputShell: {
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid rgba(31,40,55,0.08)",
    padding: 14,
    maxHeight: "56vh",
    overflow: "auto",
  },
  sections: {
    display: "grid",
    gap: 12,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 12,
    background: "#fbfbfa",
    border: "1px solid rgba(31,40,55,0.06)",
  },
  sectionTitle: {
    margin: "0 0 10px",
    color: "#18314a",
    fontSize: 15,
  },
  sectionBody: {
    display: "grid",
    gap: 6,
  },
  paragraph: {
    margin: 0,
    color: "#243042",
    lineHeight: 1.65,
    fontSize: 14,
  },
  bulletLine: {
    display: "grid",
    gridTemplateColumns: "14px 1fr",
    gap: 8,
    alignItems: "start",
    color: "#243042",
    lineHeight: 1.6,
    fontSize: 14,
  },
  bulletMark: {
    color: "#1f4b3f",
  },
  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    font: "14px/1.6 Consolas, monospace",
    color: "#243042",
  },
  emptyState: {
    minHeight: 24,
  },
  details: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(31,40,55,0.08)",
  },
  summary: {
    cursor: "pointer",
    color: "#234b63",
    fontWeight: 700,
  },
  debugPre: {
    margin: "12px 0 0",
    whiteSpace: "pre-wrap",
    font: "13px/1.55 Consolas, monospace",
    color: "#4a5568",
  },
  sourcesSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(31,40,55,0.08)",
  },
  sourcesTitle: {
    margin: "0 0 8px",
    color: "#1d2433",
    fontSize: 15,
  },
  sourcesList: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 6,
  },
  sourceLink: {
    color: "#234b63",
    textDecoration: "none",
  },
  archivedSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(31,40,55,0.08)",
  },
  archivedTitle: {
    margin: "0 0 10px",
    color: "#70542d",
    fontSize: 15,
  },
  evaluationSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(31,40,55,0.08)",
  },
  evaluationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  evaluationTitle: {
    margin: 0,
    color: "#1d2433",
    fontSize: 15,
  },
  scorePill: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#f2efe4",
    border: "1px solid rgba(112,84,45,0.14)",
    color: "#70542d",
    fontSize: 12,
    fontWeight: 700,
  },
  evaluationSummary: {
    margin: "0 0 10px",
    color: "#4a5568",
    lineHeight: 1.55,
    fontSize: 14,
  },
  evaluationGrid: {
    display: "grid",
    gap: 10,
  },
  evaluationCard: {
    borderRadius: 14,
    padding: 12,
    background: "#fbfbfa",
    border: "1px solid rgba(31,40,55,0.06)",
  },
  evaluationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    marginBottom: 6,
  },
  evaluationLabel: {
    color: "#18314a",
    fontSize: 14,
  },
  criterionScore: {
    color: "#1f4b3f",
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },
  evaluationObservation: {
    margin: 0,
    color: "#566072",
    lineHeight: 1.55,
    fontSize: 13,
  },
};
