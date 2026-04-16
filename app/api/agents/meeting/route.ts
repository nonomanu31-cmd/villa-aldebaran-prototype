import { NextResponse } from "next/server";
import { appendHistory } from "../../../../lib/storage";
import { findAgentById } from "../../../../lib/agents";
import { runAgentModel } from "../../../../lib/openai";
import type { AgentId } from "../../../../lib/types";

type MeetingRequest = {
  participantIds: AgentId[];
  context: string;
  userPrompt: string;
  agenda?: string;
  moderatorId?: AgentId;
  includeEktSynthesis?: boolean;
  includeAdministrativeMinutes?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MeetingRequest;
  const participantIds = Array.from(new Set(body.participantIds || []));
  const agenda = body.agenda?.trim() || "Ordre du jour non precise.";
  const moderatorId = body.moderatorId || "ekt";

  if (participantIds.length === 0) {
    return NextResponse.json({ error: "Aucun agent de reunion selectionne." }, { status: 400 });
  }

  try {
    const transcript: Array<{
      agentId: AgentId;
      label: string;
      message: string;
      promptPreview: string;
    }> = [];

    for (const agentId of participantIds) {
      const agent = findAgentById(agentId);

      if (!agent) {
        continue;
      }

      const result = await runAgentModel({
        agentId,
        context: body.context,
        userPrompt: [
          "MODE REUNION IA",
          "Tu participes a une reunion multi-agents.",
          "Parle uniquement dans la langue de ton metier, pas en EKT.",
          "Donne une position claire, les points critiques, les conditions, les points ouverts et un signal vers EKT si utile.",
          `Moderateur : ${moderatorId.toUpperCase()}`,
          "",
          "ORDRE DU JOUR",
          agenda,
          "",
          body.userPrompt,
        ].join("\n"),
      });

      transcript.push({
        agentId,
        label: agent.label,
        message: result.message,
        promptPreview: result.promptPreview,
      });

      await appendHistory({
        id: crypto.randomUUID(),
        agentId,
        context: body.context,
        userPrompt: `[Reunion IA] ${body.userPrompt}`,
        response: result.message,
        createdAt: new Date().toISOString(),
      });

      if (result.missingApiKey) {
        return NextResponse.json({
          participantIds,
          moderatorId,
          agenda,
          transcript,
          synthesis: null,
          minutes: null,
        });
      }
    }

    let synthesis: {
      agentId: AgentId;
      label: string;
      message: string;
      promptPreview: string;
    } | null = null;

    if (body.includeEktSynthesis !== false) {
      const meetingContext = [
        "REUNION MULTI-AGENTS - VILLA ALDEBARAN",
        `MODERATEUR : ${moderatorId.toUpperCase()}`,
        "",
        "CONTEXTE INITIAL",
        body.context,
        "",
        "ORDRE DU JOUR",
        agenda,
        "",
        "DEMANDE DE REUNION",
        body.userPrompt,
        "",
        "TOUR DE TABLE",
        ...transcript.flatMap((entry) => [
          `AGENT ${entry.label.toUpperCase()}`,
          entry.message,
          "",
        ]),
      ].join("\n");

      const moderatorResult = await runAgentModel({
        agentId: moderatorId,
        context: meetingContext,
        userPrompt:
          moderatorId === "ekt"
            ? "Fais la synthese de cette reunion d'agents, identifie accords, tensions, decisions a prendre et arbitrages a soumettre a Emmanuel."
            : "Tu moderes cette reunion. Fais une synthese claire, fais ressortir accords, tensions, decisions, dependances et points a arbitrer par Emmanuel. Reste dans la langue de ton metier.",
      });

      synthesis = {
        agentId: moderatorId,
        label: findAgentById(moderatorId)?.label || moderatorId.toUpperCase(),
        message: moderatorResult.message,
        promptPreview: moderatorResult.promptPreview,
      };

      await appendHistory({
        id: crypto.randomUUID(),
        agentId: moderatorId,
        context: meetingContext,
        userPrompt: `[Reunion IA] Synthese moderateur ${moderatorId.toUpperCase()}`,
        response: moderatorResult.message,
        createdAt: new Date().toISOString(),
      });
    }

    let minutes: {
      agentId: AgentId;
      label: string;
      message: string;
      promptPreview: string;
    } | null = null;

    if (body.includeAdministrativeMinutes !== false) {
      const minutesContext = [
        "REUNION MULTI-AGENTS - COMPTE RENDU",
        `MODERATEUR : ${moderatorId.toUpperCase()}`,
        "",
        "CONTEXTE INITIAL",
        body.context,
        "",
        "ORDRE DU JOUR",
        agenda,
        "",
        "DEMANDE DE REUNION",
        body.userPrompt,
        "",
        "TOUR DE TABLE",
        ...transcript.flatMap((entry) => [
          `AGENT ${entry.label.toUpperCase()}`,
          entry.message,
          "",
        ]),
        ...(synthesis ? ["SYNTHESE MODERATEUR", synthesis.message, ""] : []),
      ].join("\n");

      const adminResult = await runAgentModel({
        agentId: "administratif",
        context: minutesContext,
        userPrompt:
          "Redige le compte rendu de reunion final, avec points abordes, decisions, points ouverts, actions, responsables, delais et archivage.",
      });

      minutes = {
        agentId: "administratif",
        label: "Administratif",
        message: adminResult.message,
        promptPreview: adminResult.promptPreview,
      };

      await appendHistory({
        id: crypto.randomUUID(),
        agentId: "administratif",
        context: minutesContext,
        userPrompt: "[Reunion IA] Compte rendu administratif",
        response: adminResult.message,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      participantIds,
      moderatorId,
      agenda,
      transcript,
      synthesis,
      minutes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Erreur reunion multi-agents : ${error.message}`
            : "Erreur reunion multi-agents inconnue.",
      },
      { status: 500 }
    );
  }
}
