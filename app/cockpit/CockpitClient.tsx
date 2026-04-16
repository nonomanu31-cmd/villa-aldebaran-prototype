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
import { canAgentUseWeb, getWebAccessRule } from "../../lib/web-access";

type ApiResponse = {
  agentId: AgentId;
  message: string;
  promptPreview: string;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
};

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
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0];
  const selectedWebRule = getWebAccessRule(selectedAgentId);

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

  return (
    <main style={styles.page(isMobile)}>
      <aside style={styles.sidebar(isMobile)}>
        <h2 style={styles.sectionTitle}>Agents</h2>
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
        <div style={{ marginTop: 16 }}>
          <MeetingSelector
            agents={agents}
            selectedAgentIds={meetingAgentIds}
            onToggle={toggleMeetingAgent}
          />
        </div>
        <div style={{ marginTop: 16 }}>
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
        <div style={{ marginTop: 16 }}>
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
          meetingCount={meetingAgentIds.length}
          canUseWeb={canAgentUseWeb(selectedAgentId)}
          useWeb={useWeb}
          onUseWebChange={setUseWeb}
          webNote={selectedWebRule.note}
          ektActionLabel={
            response?.agentId === "conseil3ia"
              ? "Arbitrage EKT"
              : "Envoyer a EKT"
          }
        />
        <MeetingPanel meeting={meetingResponse} isLoading={isLoading && !response} />
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
    gridTemplateColumns: isMobile ? "1fr" : "280px minmax(0,1fr) 360px",
    gap: 16,
    padding: 16,
    background: "#f4f1ea",
  }),
  sidebar: (isMobile: boolean): React.CSSProperties => ({
    background: "#fffdf8",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    order: isMobile ? 1 : 0,
  }),
  center: {
    display: "grid",
    gap: 16,
  },
  rightbar: (isMobile: boolean): React.CSSProperties => ({
    background: "#fdfdfc",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    order: isMobile ? 2 : 0,
  }),
  sectionTitle: {
    marginTop: 0,
    color: "#1d2433",
  },
  helpCard: {
    marginTop: 20,
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
