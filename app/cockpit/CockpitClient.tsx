"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentSelector } from "../../components/AgentSelector";
import { ContextEditor } from "../../components/ContextEditor";
import { MeetingPanel } from "../../components/MeetingPanel";
import { MeetingSelector } from "../../components/MeetingSelector";
import { MeetingSettings } from "../../components/MeetingSettings";
import { PromptConsole } from "../../components/PromptConsole";
import { ResponsePanel } from "../../components/ResponsePanel";
import { WebAccessPanel } from "../../components/WebAccessPanel";
import { WorkingMemoryPanel } from "../../components/WorkingMemoryPanel";
import { agents } from "../../lib/agents";
import type { AgentId } from "../../lib/types";
import type { WorkingMemory } from "../../lib/memory";
import type { AgentMeetingResponse } from "../../lib/types";
import type { EktEvaluation } from "../../lib/types";
import { parseModelResponse } from "../../lib/response-parser";
import { canAgentUseWeb, getWebAccessRule } from "../../lib/web-access";

type ApiResponse = {
  agentId: AgentId;
  message: string;
  promptPreview: string;
  evaluation?: EktEvaluation | null;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
};

function compactText(raw: string, maxLength = 7000) {
  if (raw.length <= maxLength) {
    return raw;
  }

  return `${raw.slice(0, maxLength)}\n\n[contenu tronque pour transmission inter-agents]`;
}

function buildStructuredRelaySource(sourceAgentId: AgentId, sourceMessage: string) {
  const parsed = parseModelResponse(sourceMessage);
  const selectedSections = parsed.sections.slice(0, 6).map((section) => {
    const compactBody = section.body
      .filter(Boolean)
      .slice(0, 6)
      .join("\n");

    return [`## ${section.title}`, compactBody].filter(Boolean).join("\n");
  });

  const fallbackText = compactText(sourceMessage, 3500);

  return [
    `Agent source : ${sourceAgentId.toUpperCase()}`,
    "",
    "DOSSIER TRANSMIS",
    ...(selectedSections.length > 0 ? selectedSections : [fallbackText]),
  ].join("\n\n");
}

export function CockpitClient() {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>("ekt");
  const [context, setContext] = useState(
    "Contexte initial du prototype : Villa Aldebaran, phase de cadrage systeme."
  );
  const [userPrompt, setUserPrompt] = useState(
    "Exemple : Donne-moi une lecture de la semaine sur les risques de circulation PMR et les tensions chantier."
  );
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [sourceResponse, setSourceResponse] = useState<ApiResponse | null>(null);
  const [useWeb, setUseWeb] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<WorkingMemory | null>(null);
  const [activeContextDraft, setActiveContextDraft] = useState(context);
  const [meetingAgentIds, setMeetingAgentIds] = useState<AgentId[]>([
    "vie",
    "juridique",
    "chantier",
  ]);
  const [meetingModeratorId, setMeetingModeratorId] = useState<AgentId>("ekt");
  const [meetingAgenda, setMeetingAgenda] = useState(
    "1. Etat de la situation\n2. Points critiques\n3. Arbitrages\n4. Actions de la semaine"
  );
  const [meetingResponse, setMeetingResponse] = useState<AgentMeetingResponse | null>(null);
  const [relayTargetAgentId, setRelayTargetAgentId] = useState<AgentId>("vie");
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0];
  const selectedWebRule = getWebAccessRule(selectedAgentId);
  const relayOptions = agents.filter(
    (agent) => agent.id !== (response?.agentId ?? selectedAgentId) && agent.id !== "ekt"
  );

  const placeholders: Record<AgentId, string> = {
    ekt: "Exemple : Donne-moi une lecture de la semaine sur les risques de circulation PMR et les tensions chantier.",
    vie: "Exemple : Simule les points de friction d'usage entre terrasse nord, acces PMR et flux evenementiel cette semaine.",
    juridique:
      "Exemple : Qualifie juridiquement l'ouverture evenementielle a 300 personnes et dis-moi ce qui est autorise, conditionnel ou interdit en l'etat.",
    chantier:
      "Exemple : Identifie les blocages de sequence entre souterrains, niveaux finis et validations PMR cette semaine.",
    exploitation:
      "Exemple : Dis-moi si l'espace evenementiel est exploitable en l'etat et quelles sont les conditions critiques a lever.",
    finances:
      "Exemple : Compare le cout probable d'une correction PMR maintenant versus une reprise apres second oeuvre.",
    ecologie:
      "Exemple : Lis les tensions eau-chaleur-vegetation de la semaine et le point de bascule a surveiller.",
    enosirai:
      "Exemple : Qualifie si les missions de surveillance exterieure et d'assistance PMR sont executables cette semaine.",
    administratif:
      "Exemple : Redige un compte rendu de reunion chantier avec decisions, actions, responsables et delais.",
    conseil3ia:
      "Exemple : Interroge ChatGPT, Gemini et Claude sur la strategie PMR et compare leurs convergences, divergences et angles morts.",
  };

  async function refreshMemory() {
    const result = await fetch("/api/memory");
    const data = (await result.json()) as { memory: WorkingMemory };
    setMemory(data.memory);
    setActiveContextDraft(data.memory.activeContext);
  }

  async function saveActiveContext() {
    await fetch("/api/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "setContext",
        activeContext: activeContextDraft,
      }),
    });

    setContext(activeContextDraft);
    await refreshMemory();
  }

  useEffect(() => {
    void refreshMemory();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 980px)");
    const sync = () => setIsMobile(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!canAgentUseWeb(selectedAgentId)) {
      setUseWeb(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (relayOptions.length === 0) {
      return;
    }

    if (!relayOptions.some((agent) => agent.id === relayTargetAgentId)) {
      setRelayTargetAgentId(relayOptions[0].id);
    }
  }, [relayOptions, relayTargetAgentId]);

  function toggleMeetingAgent(agentId: AgentId) {
    setMeetingAgentIds((current) =>
      current.includes(agentId)
        ? current.filter((item) => item !== agentId)
        : [...current, agentId]
    );
  }

  async function handleSubmit(targetAgentId = selectedAgentId) {
    setIsLoading(true);
    setError(null);
    setMeetingResponse(null);

    try {
      const result = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: targetAgentId,
          context,
          userPrompt,
          useWeb,
          evaluateEktSolo: targetAgentId === "ekt" && !fastMode,
          speedMode: fastMode ? "fast" : "normal",
        }),
      });

      if (!result.ok) {
        throw new Error("La requete agent a echoue.");
      }

      const data = (await result.json()) as ApiResponse;
      setResponse(data);
      setSourceResponse(null);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Erreur inconnue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendToEktFromLastResponse() {
    if (response && response.agentId !== "ekt") {
      setSourceResponse(response);
    }

    const forwardedContext = response
      ? [
          "Contexte d'arbitrage inter-agents.",
          `Agent source : ${response.agentId.toUpperCase()}`,
          "",
          "DERNIERE REPONSE AGENT",
          response.message,
          "",
          "CONTEXTE INITIAL",
          context,
        ].join("\n")
      : context;

    const ektDecisionPrompt =
      response?.agentId === "conseil3ia"
        ? "Lis cette confrontation entre ChatGPT, Gemini et Claude. Produis une lecture EKT orientee decision Emmanuel : convergences robustes, divergences reelles, points fragiles, goulot, irreversibilites, options de decision, recommandation immediate, point de bascule et verifications a exiger."
        : response && response.agentId !== "ekt"
          ? `Lis la reponse de ${response.agentId.toUpperCase()} et produis une lecture EKT avec arbitrage si necessaire.`
          : userPrompt;

    setSelectedAgentId("ekt");
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: "ekt",
          context: forwardedContext,
          userPrompt: ektDecisionPrompt,
          evaluateEktSolo: false,
          speedMode: fastMode ? "fast" : "normal",
        }),
      });

      if (!result.ok) {
        throw new Error("La requete EKT a echoue.");
      }

      const data = (await result.json()) as ApiResponse;
      setResponse(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Erreur inconnue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRunMeeting() {
    setIsLoading(true);
    setError(null);
    setMeetingResponse(null);

    try {
      const result = await fetch("/api/agents/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantIds: meetingAgentIds,
          context,
          userPrompt,
          moderatorId: meetingModeratorId,
          agenda: meetingAgenda,
          includeEktSynthesis: true,
          includeAdministrativeMinutes: true,
        }),
      });

      if (!result.ok) {
        throw new Error("La reunion multi-agents a echoue.");
      }

      const data = (await result.json()) as AgentMeetingResponse;
      setMeetingResponse(data);

      if (data.synthesis) {
        setSelectedAgentId(data.synthesis.agentId);
        setResponse({
          agentId: data.synthesis.agentId,
          message: data.synthesis.message,
          promptPreview: data.synthesis.promptPreview,
        });
      }
    } catch (meetingError) {
      setError(
        meetingError instanceof Error ? meetingError.message : "Erreur inconnue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRelayToAgent() {
    if (!response) {
      return;
    }

    const relayTarget = relayOptions.find((agent) => agent.id === relayTargetAgentId);

    if (!relayTarget) {
      return;
    }

    setSourceResponse(response);
    setSelectedAgentId(relayTarget.id);
    setIsLoading(true);
    setError(null);

    const relaySource = buildStructuredRelaySource(response.agentId, response.message);
    const forwardedContext = [
      "Contexte de travail inter-agents.",
      `Agent source : ${response.agentId.toUpperCase()}`,
      `Agent destinataire : ${relayTarget.label}`,
      "",
      "SITUATION ACTIVE",
      context,
      "",
      "DOSSIER SOURCE STRUCTURE",
      relaySource,
    ].join("\n");

    const relayPrompt = `Lis le dossier transmis par ${response.agentId.toUpperCase()} et reponds dans ton propre langage metier. N'imite pas le style de l'agent source. Dis : 1. ce que cela change pour ton domaine 2. ton risque specifique 3. la donnee minimale manquante 4. l'effet sur decision 5. la prochaine action utile.`;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    try {
      const result = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          agentId: relayTarget.id,
          context: forwardedContext,
          userPrompt: relayPrompt,
          evaluateEktSolo: false,
          speedMode: fastMode ? "fast" : "normal",
        }),
      });

      if (!result.ok) {
        throw new Error("La transmission inter-agents a echoue.");
      }

      const data = (await result.json()) as ApiResponse;
      setResponse(data);
    } catch (relayError) {
      setError(
        relayError instanceof Error && relayError.name === "AbortError"
          ? "La transmission vers cet agent a pris trop de temps. Reessayez avec un contexte plus court."
          : relayError instanceof Error
            ? relayError.message
            : "Erreur inconnue."
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }

  async function handleCallRequestedAgent(agentId: string, reason: string) {
    if (!meetingResponse) {
      return;
    }

    const targetAgent = agents.find((agent) => agent.id === agentId);

    if (!targetAgent) {
      return;
    }

    setSelectedAgentId(targetAgent.id);
    setIsLoading(true);
    setError(null);

    const meetingSource = meetingResponse.synthesis?.message
      || meetingResponse.minutes?.message
      || meetingResponse.transcript.map((entry) => `${entry.label}\n${entry.message}`).join("\n\n");

    setSourceResponse({
      agentId: "administratif",
      message: meetingSource,
      promptPreview: "",
      evaluation: null,
      sources: [],
    });

    const forwardedContext = [
      "Demande d'appel agent issue d'une reunion IA.",
      `Agent demande : ${targetAgent.label}`,
      `Raison de l'appel : ${reason}`,
      "",
      "CONTEXTE INITIAL",
      context,
      "",
      "ORDRE DU JOUR DE LA REUNION",
      meetingResponse.agenda,
      "",
      "SOURCE REUNION",
      meetingSource,
    ].join("\n");

    const forwardedPrompt = `Le collectif estime qu'il faut te saisir maintenant. Travaille dans ton propre langage metier. Dis ce que tu prends en charge, ton risque specifique, ce que tu dois verifier tout de suite, et la prochaine action utile. Motif de saisine : ${reason}`;

    try {
      const result = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: targetAgent.id,
          context: forwardedContext,
          userPrompt: forwardedPrompt,
          evaluateEktSolo: false,
          speedMode: fastMode ? "fast" : "normal",
        }),
      });

      if (!result.ok) {
        throw new Error("L'appel a cet agent a echoue.");
      }

      const data = (await result.json()) as ApiResponse;
      setResponse(data);
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={styles.page(isMobile)}>
      <header style={styles.workspaceHeader(isMobile)}>
        <div style={styles.workspaceIdentity}>
          <p style={styles.workspaceKicker}>Villa Aldebaran</p>
          <h1 style={styles.workspaceTitle}>Poste de pilotage multi-agents</h1>
          <p style={styles.workspaceSubtitle}>
            Decision, arbitrage, reunion, documents et memoire dans un seul espace de travail.
          </p>
        </div>
        <div style={styles.workspaceActions}>
          <Link href="/history" style={styles.workspaceActionPrimary}>
            Historique
          </Link>
          <Link href="/documents" style={styles.workspaceActionSecondary}>
            Centre documentaire
          </Link>
        </div>
      </header>

      <aside style={styles.sidebar(isMobile)}>
        <div style={styles.navRow}>
          <Link href="/" style={styles.navLink}>
            Accueil
          </Link>
          <Link href="/history" style={styles.navLink}>
            Historique
          </Link>
          <Link href="/documents" style={styles.navLink}>
            Documents
          </Link>
        </div>
        <div style={styles.panelSection}>
          <p style={styles.sectionEyebrow}>Equipe</p>
          <h2 style={styles.sectionTitle}>Agents</h2>
        </div>
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
        <div style={styles.panelGroup}>
          <div style={styles.panelSection}>
            <p style={styles.sectionEyebrow}>Orchestration</p>
            <h3 style={styles.subsectionTitle}>Reunion IA</h3>
          </div>
          <MeetingSelector
            agents={agents}
            selectedAgentIds={meetingAgentIds}
            onToggle={toggleMeetingAgent}
          />
        </div>
        <div style={styles.panelGroup}>
          <MeetingSettings
            moderatorId={meetingModeratorId}
            agenda={meetingAgenda}
            agents={agents}
            onModeratorChange={setMeetingModeratorId}
            onAgendaChange={setMeetingAgenda}
            onRunMeeting={handleRunMeeting}
            isLoading={isLoading}
            canRunMeeting={meetingAgentIds.length > 0}
          />
        </div>
        <div style={styles.panelGroup}>
          <div style={styles.panelSection}>
            <p style={styles.sectionEyebrow}>Capacites</p>
            <h3 style={styles.subsectionTitle}>Acces Internet</h3>
          </div>
          <WebAccessPanel />
        </div>
        <div style={styles.helpCard}>
          <p style={styles.helpTitle}>Prototype V1</p>
          <p style={styles.helpText}>
            Le cockpit branche maintenant toute l&apos;equipe d&apos;agents de Villa Aldebaran.
          </p>
          <Link href="/documents" style={styles.docLink}>
            Ouvrir le centre documentaire
          </Link>
        </div>
      </aside>

      <section style={styles.center}>
        <div style={styles.workspaceStrip}>
          <div style={styles.workspaceChip}>
            Agent actif : <strong>{selectedAgent.label}</strong>
          </div>
          <div style={styles.workspaceChip}>
            Reunion : <strong>{meetingAgentIds.length} participant(s)</strong>
          </div>
          <div style={styles.workspaceChip}>
            Web : <strong>{canAgentUseWeb(selectedAgentId) ? "autorise" : "ferme"}</strong>
          </div>
        </div>
        <ContextEditor value={context} onChange={setContext} />
        <PromptConsole
          value={userPrompt}
          onChange={setUserPrompt}
          onSubmit={() => handleSubmit(selectedAgentId)}
          onSendToEkt={handleSendToEktFromLastResponse}
          onRunMeeting={handleRunMeeting}
          isLoading={isLoading}
          selectedAgentLabel={selectedAgent.label}
          placeholder={placeholders[selectedAgentId]}
          canForwardToEkt={!!response && response.agentId !== "ekt"}
          canRelayToAgent={!!response && relayOptions.length > 0}
          meetingCount={meetingAgentIds.length}
          canUseWeb={canAgentUseWeb(selectedAgentId)}
          useWeb={useWeb}
          onUseWebChange={setUseWeb}
          fastMode={fastMode}
          onFastModeChange={setFastMode}
          webNote={selectedWebRule.note}
          ektActionLabel={
            response?.agentId === "conseil3ia"
              ? "Arbitrage EKT"
              : "Envoyer a EKT"
          }
          relayTargetAgentId={relayTargetAgentId}
          relayOptions={relayOptions.map((agent) => ({ id: agent.id, label: agent.label }))}
          onRelayTargetChange={(agentId) => setRelayTargetAgentId(agentId as AgentId)}
          onRelayToAgent={handleRelayToAgent}
        />
        <MeetingPanel
          meeting={meetingResponse}
          isLoading={isLoading && !response}
          onCallRequestedAgent={handleCallRequestedAgent}
        />
        <WorkingMemoryPanel
          memory={memory}
          selectedAgentId={selectedAgentId}
          responseText={response?.message ?? null}
          onRefresh={refreshMemory}
          onSaveContext={saveActiveContext}
          activeContextDraft={activeContextDraft}
          onActiveContextDraftChange={setActiveContextDraft}
        />
      </section>

      <aside style={styles.rightbar(isMobile)}>
        <ResponsePanel
          selectedAgentId={selectedAgentId}
          sourceResponse={sourceResponse}
          response={response}
          error={error}
          isLoading={isLoading}
        />
      </aside>
    </main>
  );
}

const styles = {
  page: (isMobile: boolean): React.CSSProperties => ({
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "290px minmax(0,1fr) 390px",
    gridTemplateRows: isMobile ? "auto auto auto auto" : "auto 1fr",
    gap: 18,
    padding: 18,
    background:
      "linear-gradient(180deg, #edf2ec 0%, #f4f1ea 36%, #f2eee6 100%)",
  }),
  workspaceHeader: (isMobile: boolean): React.CSSProperties => ({
    gridColumn: isMobile ? "1 / -1" : "1 / -1",
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: 16,
    flexDirection: isMobile ? "column" : "row",
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(31,40,55,0.08)",
    boxShadow: "0 10px 24px rgba(31,40,55,0.06)",
  }),
  workspaceIdentity: {
    display: "grid",
    gap: 2,
  },
  workspaceKicker: {
    margin: 0,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#5f6a62",
  },
  workspaceTitle: {
    margin: "6px 0 0",
    fontSize: 24,
    lineHeight: 1.15,
    color: "#1d2433",
    fontWeight: 700,
  },
  workspaceSubtitle: {
    margin: "6px 0 0",
    color: "#5f6a62",
    fontSize: 14,
    lineHeight: 1.5,
  },
  workspaceActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  workspaceActionPrimary: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 999,
    background: "#1f4b3f",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  },
  workspaceActionSecondary: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 999,
    background: "#fff",
    color: "#1d2433",
    textDecoration: "none",
    border: "1px solid rgba(31,40,55,0.12)",
    fontWeight: 700,
    fontSize: 14,
  },
  sidebar: (isMobile: boolean): React.CSSProperties => ({
    background: "rgba(255,253,248,0.94)",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    boxShadow: isMobile ? "none" : "0 10px 24px rgba(31,40,55,0.05)",
    position: isMobile ? "static" : "sticky",
    top: 18,
    alignSelf: isMobile ? "auto" : "start",
    maxHeight: isMobile ? "none" : "calc(100vh - 36px)",
    overflow: "auto",
    order: isMobile ? 1 : 0,
  }),
  center: {
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  rightbar: (isMobile: boolean): React.CSSProperties => ({
    background: "rgba(253,253,252,0.94)",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    boxShadow: isMobile ? "none" : "0 10px 24px rgba(31,40,55,0.05)",
    position: isMobile ? "static" : "sticky",
    top: 18,
    alignSelf: isMobile ? "auto" : "start",
    maxHeight: isMobile ? "none" : "calc(100vh - 36px)",
    overflow: "auto",
    order: isMobile ? 2 : 0,
  }),
  workspaceStrip: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  workspaceChip: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(31,40,55,0.08)",
    color: "#324052",
    fontSize: 13,
  },
  panelSection: {
    display: "grid",
    gap: 2,
    marginBottom: 10,
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#6e766f",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 18,
    color: "#1d2433",
  },
  subsectionTitle: {
    margin: 0,
    color: "#1d2433",
    fontSize: 16,
  },
  panelGroup: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid rgba(31,40,55,0.08)",
  },
  navRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    marginBottom: 14,
  },
  navLink: {
    display: "inline-block",
    padding: "7px 11px",
    borderRadius: 999,
    textDecoration: "none",
    background: "#eef5f0",
    color: "#1f4b3f",
    border: "1px solid rgba(31,75,63,0.12)",
    fontWeight: 700,
    fontSize: 13,
  },
  helpCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    background: "#e7efe8",
  },
  helpTitle: {
    margin: "0 0 8px",
    fontWeight: 700,
    color: "#1f4b3f",
  },
  helpText: {
    margin: 0,
    color: "#324239",
    lineHeight: 1.5,
  },
  docLink: {
    display: "inline-block",
    marginTop: 12,
    color: "#234b63",
    textDecoration: "none",
    fontWeight: 700,
  },
};
