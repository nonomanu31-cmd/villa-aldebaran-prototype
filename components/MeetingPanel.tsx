import { parseModelResponse } from "../lib/response-parser";
import type { AgentMeetingResponse } from "../lib/types";
import Link from "next/link";

type MeetingPanelProps = {
  meeting: AgentMeetingResponse | null;
  isLoading: boolean;
};

export function MeetingPanel({ meeting, isLoading }: MeetingPanelProps) {
  if (!meeting && !isLoading) {
    return null;
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Reunion d&apos;agents</h2>
      {meeting ? (
        <div style={styles.summaryCard}>
          <p style={styles.metaLine}>
            <strong>Moderateur :</strong> {meeting.moderatorId.toUpperCase()}
          </p>
          <p style={styles.metaLine}>
            <strong>Ordre du jour :</strong> {meeting.agenda}
          </p>
          <div style={styles.actions}>
            <Link href="/history" style={styles.linkButton}>
              Voir l&apos;historique
            </Link>
            <Link href="/documents" style={styles.linkButton}>
              Voir le centre documentaire
            </Link>
          </div>
        </div>
      ) : null}
      {isLoading && !meeting ? <p style={styles.meta}>Tour de table en cours...</p> : null}
      {meeting ? (
        <div style={styles.stack}>
          {meeting.transcript.map((entry) => {
            const parsed = parseModelResponse(entry.message);
            return (
              <article key={entry.agentId} style={styles.block}>
                <h3 style={styles.agentTitle}>{entry.label}</h3>
                <div style={styles.sectionStack}>
                  {parsed.sections.map((section, index) => (
                    <section key={`${entry.agentId}-${section.title}-${index}`} style={styles.section}>
                      <h4 style={styles.sectionTitle}>{section.title}</h4>
                      {section.body.map((line, lineIndex) =>
                        line ? (
                          <p key={lineIndex} style={styles.line}>
                            {line}
                          </p>
                        ) : (
                          <div key={lineIndex} style={{ height: 6 }} />
                        )
                      )}
                    </section>
                  ))}
                </div>
              </article>
            );
          })}

          {meeting.contradictions?.length ? (
            <article style={styles.contradictionBlock}>
              <h3 style={styles.agentTitle}>Tour contradictoire</h3>
              <div style={styles.sectionStack}>
                {meeting.contradictions.map((entry) => {
                  const parsed = parseModelResponse(entry.message);
                  return (
                    <section key={`contradiction-${entry.agentId}`} style={styles.section}>
                      <h4 style={styles.sectionTitle}>{entry.label}</h4>
                      {parsed.sections.flatMap((section, sectionIndex) => [
                        <p key={`${entry.agentId}-${sectionIndex}-title`} style={styles.sectionLead}>
                          {section.title}
                        </p>,
                        ...section.body.map((line, lineIndex) =>
                          line ? (
                            <p key={`${entry.agentId}-${sectionIndex}-${lineIndex}`} style={styles.line}>
                              {line}
                            </p>
                          ) : (
                            <div key={`${entry.agentId}-${sectionIndex}-${lineIndex}`} style={{ height: 6 }} />
                          )
                        ),
                      ])}
                    </section>
                  );
                })}
              </div>
            </article>
          ) : null}

          {meeting.synthesis ? (
            <article style={styles.synthesisBlock}>
              <h3 style={styles.agentTitle}>Synthese moderateur - {meeting.synthesis.label}</h3>
              {parseModelResponse(meeting.synthesis.message).sections.map((section, index) => (
                <section key={`ekt-${section.title}-${index}`} style={styles.section}>
                  <h4 style={styles.sectionTitle}>{section.title}</h4>
                  {section.body.map((line, lineIndex) =>
                    line ? (
                      <p key={lineIndex} style={styles.line}>
                        {line}
                      </p>
                    ) : (
                      <div key={lineIndex} style={{ height: 6 }} />
                    )
                  )}
                </section>
              ))}
            </article>
          ) : null}
          {meeting.minutes ? (
            <article style={styles.minutesBlock}>
              <h3 style={styles.agentTitle}>Compte rendu administratif</h3>
              {parseModelResponse(meeting.minutes.message).sections.map((section, index) => (
                <section key={`minutes-${section.title}-${index}`} style={styles.section}>
                  <h4 style={styles.sectionTitle}>{section.title}</h4>
                  {section.body.map((line, lineIndex) =>
                    line ? (
                      <p key={lineIndex} style={styles.line}>
                        {line}
                      </p>
                    ) : (
                      <div key={lineIndex} style={{ height: 6 }} />
                    )
                  )}
                </section>
              ))}
            </article>
          ) : null}
        </div>
      ) : null}
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
    margin: "0 0 10px",
    color: "#1d2433",
  },
  meta: {
    margin: 0,
    color: "#6a6f79",
  },
  summaryCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    background: "#f8f7f4",
    border: "1px solid rgba(31,40,55,0.08)",
  },
  metaLine: {
    margin: "0 0 6px",
    color: "#324052",
    lineHeight: 1.5,
    fontSize: 14,
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  linkButton: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    textDecoration: "none",
    background: "#fff",
    color: "#1d2433",
    border: "1px solid rgba(31,40,55,0.12)",
    fontWeight: 700,
  },
  stack: {
    display: "grid",
    gap: 14,
  },
  block: {
    borderRadius: 16,
    padding: 14,
    background: "#fcfbf8",
    border: "1px solid rgba(31,40,55,0.08)",
  },
  synthesisBlock: {
    borderRadius: 16,
    padding: 14,
    background: "#eef5f0",
    border: "1px solid rgba(31,75,63,0.18)",
  },
  contradictionBlock: {
    borderRadius: 16,
    padding: 14,
    background: "#f4eef8",
    border: "1px solid rgba(99,82,148,0.18)",
  },
  minutesBlock: {
    borderRadius: 16,
    padding: 14,
    background: "#f7f1e8",
    border: "1px solid rgba(112,84,45,0.18)",
  },
  agentTitle: {
    margin: "0 0 10px",
    color: "#18314a",
  },
  sectionStack: {
    display: "grid",
    gap: 10,
  },
  section: {
    display: "grid",
    gap: 6,
  },
  sectionTitle: {
    margin: 0,
    color: "#234b63",
    fontSize: 14,
  },
  sectionLead: {
    margin: "2px 0 0",
    color: "#5d4b7d",
    fontSize: 13,
    fontWeight: 700,
  },
  line: {
    margin: 0,
    color: "#243042",
    lineHeight: 1.6,
    fontSize: 14,
  },
};
