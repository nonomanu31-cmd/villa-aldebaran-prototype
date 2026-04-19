import { NextResponse } from "next/server";
import { evaluateEktSoloResponse, runAgentModel } from "../../../../lib/openai";
import { runProviderCouncil } from "../../../../lib/provider-council";
import { appendHistory } from "../../../../lib/storage";
import type { AgentRunRequest } from "../../../../lib/types";
import { buildEktContext } from "../../../../lib/ekt-context";

export async function POST(request: Request) {
  const body = (await request.json()) as AgentRunRequest;

  try {
    if (body.agentId === "conseil3ia") {
      const councilResult = await runProviderCouncil({
        context: body.context,
        userPrompt: body.userPrompt,
      });

      await appendHistory({
        id: crypto.randomUUID(),
        agentId: "conseil3ia",
        context: body.context,
        userPrompt: body.userPrompt,
        response: councilResult.message,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        agentId: "conseil3ia",
        promptPreview: councilResult.promptPreview,
        message: councilResult.message,
        sources: [],
        evaluation: null,
      });
    }

    const enrichedContext =
      body.agentId === "ekt" ? await buildEktContext(body.context) : body.context;

    const result = await runAgentModel({
      agentId: body.agentId,
      context: enrichedContext,
      userPrompt: body.userPrompt,
      useWeb: body.useWeb,
      speedMode: body.speedMode,
    });

    let evaluation = null;

    if (body.agentId === "ekt" && body.evaluateEktSolo && body.speedMode !== "fast") {
      try {
        evaluation = await evaluateEktSoloResponse({
          context: enrichedContext,
          userPrompt: body.userPrompt,
          response: result.message,
        });
      } catch {
        evaluation = null;
      }
    }

    if (result.missingApiKey) {
      return NextResponse.json({
        agentId: result.agent.id,
        promptPreview: result.promptPreview,
        message: result.message,
        sources: result.sources,
        evaluation,
      });
    }

      await appendHistory({
        id: crypto.randomUUID(),
        agentId: result.agent.id,
        context: enrichedContext,
        userPrompt: body.userPrompt,
        response: result.message,
        createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      agentId: result.agent.id,
      promptPreview: result.promptPreview,
      message: result.message,
      sources: result.sources,
      evaluation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        agentId: body.agentId,
        promptPreview: "",
        message:
          error instanceof Error
            ? `Erreur reseau ou serveur : ${error.message}`
            : "Erreur reseau ou serveur inconnue.",
        evaluation: null,
      },
      { status: 500 }
    );
  }
}
