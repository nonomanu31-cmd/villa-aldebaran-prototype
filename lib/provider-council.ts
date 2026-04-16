import { loadPrompt } from "./prompt-loader";

type ProviderReply = {
  provider: "ChatGPT" | "Gemini" | "Claude";
  model: string;
  message: string;
  available: boolean;
  error?: string;
};

function buildPrompt(context: string, userPrompt: string) {
  return [
    "CONTEXTE FOURNI",
    context || "[aucun contexte fourni]",
    "",
    "DEMANDE UTILISATEUR",
    userPrompt,
  ].join("\n");
}

function buildProviderQuestion(context: string, userPrompt: string) {
  return [
    "Tu reponds directement a la question de fond.",
    "Tu ne parles pas de comparaison entre modeles.",
    "Tu ne dis pas que tu ne peux pas interroger d'autres IA.",
    "Tu donnes la meilleure reponse utile possible sur le sujet lui-meme.",
    "Si des donnees manquent, tu les signales sans bloquer toute la reponse.",
    "",
    buildPrompt(context, userPrompt),
  ].join("\n");
}

async function askOpenAI(fullPrompt: string): Promise<ProviderReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  if (!apiKey) {
    return {
      provider: "ChatGPT",
      model,
      available: false,
      message: "",
      error: "OPENAI_API_KEY manquante.",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: fullPrompt,
    }),
  });

  const payload = (await response.json()) as {
    output_text?: string;
    error?: { message?: string };
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (!response.ok) {
    return {
      provider: "ChatGPT",
      model,
      available: false,
      message: "",
      error: payload.error?.message || "Erreur OpenAI inconnue.",
    };
  }

  const content =
    payload.output_text?.trim() ||
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n") ||
    "Aucune reponse exploitable.";

  return {
    provider: "ChatGPT",
    model,
    available: true,
    message: content,
  };
}

async function askGemini(fullPrompt: string): Promise<ProviderReply> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return {
      provider: "Gemini",
      model,
      available: false,
      message: "",
      error: "GEMINI_API_KEY manquante.",
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }],
          },
        ],
      }),
    }
  );

  const payload = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  if (!response.ok) {
    return {
      provider: "Gemini",
      model,
      available: false,
      message: "",
      error: payload.error?.message || "Erreur Gemini inconnue.",
    };
  }

  const content =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n") || "Aucune reponse exploitable.";

  return {
    provider: "Gemini",
    model,
    available: true,
    message: content,
  };
}

async function askClaude(fullPrompt: string): Promise<ProviderReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  if (!apiKey) {
    return {
      provider: "Claude",
      model,
      available: false,
      message: "",
      error: "ANTHROPIC_API_KEY manquante.",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  if (!response.ok) {
    return {
      provider: "Claude",
      model,
      available: false,
      message: "",
      error: payload.error?.message || "Erreur Claude inconnue.",
    };
  }

  const content =
    payload.content
      ?.map((item) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n") || "Aucune reponse exploitable.";

  return {
    provider: "Claude",
    model,
    available: true,
    message: content,
  };
}

async function synthesizeComparison(params: {
  context: string;
  userPrompt: string;
  replies: ProviderReply[];
}) {
  const availableReplies = params.replies.filter((reply) => reply.available);

  const comparisonPrompt = await loadPrompt("conseil3ia.md");
  const synthesisInput = [
    comparisonPrompt,
    "",
    buildPrompt(params.context, params.userPrompt),
    "",
    "REPONSES DES MODELES",
    ...params.replies.flatMap((reply) => [
      `${reply.provider.toUpperCase()} - ${reply.model}`,
      reply.available ? reply.message : `[INDISPONIBLE] ${reply.error}`,
      "",
    ]),
  ].join("\n");

  if (process.env.OPENAI_API_KEY) {
    const reply = await askOpenAI(synthesisInput);
    if (reply.available) {
      return {
        summary: reply.message,
        synthesizedBy: `${reply.provider} (${reply.model})`,
      };
    }
  }

  const fallbackSummary = [
    `CONSEIL 3 IA - ${params.userPrompt}`,
    "",
    "MODELES INTERROGES",
    availableReplies.length > 0
      ? availableReplies.map((reply) => `- ${reply.provider} (${reply.model})`).join("\n")
      : "- Aucun modele disponible",
    "",
    "CONVERGENCES",
    "Synthese automatique indisponible sans moteur de comparaison actif.",
    "",
    "DIVERGENCES",
    "Lire les reponses detaillees par modele ci-dessous.",
    "",
    "RESTITUTION PAR MODELE",
    ...params.replies.flatMap((reply) => [
      reply.provider.toUpperCase(),
      reply.available ? reply.message : `[INDISPONIBLE] ${reply.error}`,
      "",
    ]),
  ].join("\n");

  return {
    summary: fallbackSummary,
    synthesizedBy: "Assemblage local",
  };
}

export async function runProviderCouncil(params: {
  context: string;
  userPrompt: string;
}) {
  const providerPrompt = buildProviderQuestion(params.context, params.userPrompt);

  const replies = await Promise.all([
    askOpenAI(providerPrompt),
    askGemini(providerPrompt),
    askClaude(providerPrompt),
  ]);

  const synthesis = await synthesizeComparison({
    context: params.context,
    userPrompt: params.userPrompt,
    replies,
  });

  return {
    message: [
      synthesis.summary,
      "",
      "ETAT DES CONNECTEURS",
      ...replies.map((reply) =>
        reply.available
          ? `- ${reply.provider} : connecte (${reply.model})`
          : `- ${reply.provider} : indisponible - ${reply.error}`
      ),
    ].join("\n"),
    promptPreview: providerPrompt,
    synthesizedBy: synthesis.synthesizedBy,
  };
}
