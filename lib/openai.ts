import { findAgentById } from "./agents";
import { loadPrompt } from "./prompt-loader";
import { canAgentUseWeb, getWebAccessRule } from "./web-access";
import type { AgentId, WebSource } from "./types";

type OpenAIResponsesApiPayload = {
  error?: { message?: string };
  output_text?: string;
  sources?: Array<{
    url?: string;
    title?: string;
  }>;
  output?: Array<{
    type?: string;
    action?: {
      sources?: Array<{
        url?: string;
        title?: string;
      }>;
    };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
      }>;
    }>;
  }>;
};

export function extractOutputText(payload: OpenAIResponsesApiPayload) {
  if (payload.output_text && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const contentTexts =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((contentItem) => contentItem.type === "output_text" || contentItem.type === "text")
      .map((contentItem) => contentItem.text?.trim() ?? "")
      .filter(Boolean) ?? [];

  if (contentTexts.length > 0) {
    return contentTexts.join("\n\n");
  }

  return null;
}

export function extractSources(payload: OpenAIResponsesApiPayload): WebSource[] {
  const directSources =
    payload.sources?.map((source) => ({
      url: source.url || "",
      title: source.title,
    })) ?? [];

  const actionSources =
    payload.output
      ?.flatMap((item) => item.action?.sources ?? [])
      .map((source) => ({
        url: source.url || "",
        title: source.title,
      })) ?? [];

  const annotationSources =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .flatMap((contentItem) => contentItem.annotations ?? [])
      .filter((annotation) => annotation.type === "url_citation" && annotation.url)
      .map((annotation) => ({
        url: annotation.url || "",
        title: annotation.title,
      })) ?? [];

  const unique = new Map<string, WebSource>();

  [...directSources, ...actionSources, ...annotationSources].forEach((source) => {
    if (source.url) {
      unique.set(source.url, source);
    }
  });

  return Array.from(unique.values());
}

export async function runAgentModel(params: {
  agentId: AgentId;
  context: string;
  userPrompt: string;
  useWeb?: boolean;
}) {
  const agent = findAgentById(params.agentId);

  if (!agent) {
    throw new Error("Agent introuvable.");
  }

  const systemPrompt = await loadPrompt(agent.promptFile);
  const assembledPrompt = [
    systemPrompt,
    "",
    "CONTEXTE FOURNI",
    params.context || "[aucun contexte fourni]",
    "",
    "DEMANDE UTILISATEUR",
    params.userPrompt,
  ].join("\n");

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  if (!apiKey) {
    return {
      agent,
      promptPreview: assembledPrompt,
      message: [
        `Agent cible : ${agent.label}`,
        "Aucune cle OPENAI_API_KEY n'est configuree.",
        "Ajoutez votre cle API dans le fichier .env.local du dossier prototype puis redemarrez le serveur.",
      ].join("\n"),
      missingApiKey: true,
      sources: [] as WebSource[],
    };
  }

  const tools =
    params.useWeb && canAgentUseWeb(params.agentId)
      ? [
          {
            type: "web_search",
            ...(getWebAccessRule(params.agentId).allowedDomains
              ? {
                  filters: {
                    allowed_domains: getWebAccessRule(params.agentId).allowedDomains,
                  },
                }
              : {}),
          },
        ]
      : undefined;

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      ...(tools
        ? {
            tools,
            tool_choice: "auto",
            include: ["web_search_call.action.sources"],
          }
        : {}),
      input: assembledPrompt,
    }),
  });

  const payload = (await openAiResponse.json()) as OpenAIResponsesApiPayload;

  if (!openAiResponse.ok) {
    throw new Error(payload.error?.message || "erreur inconnue.");
  }

  return {
    agent,
    promptPreview: assembledPrompt,
    message: extractOutputText(payload) || "Le modele n'a pas renvoye de texte exploitable.",
    missingApiKey: false,
    sources: extractSources(payload),
  };
}
