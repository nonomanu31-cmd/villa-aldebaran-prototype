import type { AgentDefinition, AgentId } from "./types";

export const agents: AgentDefinition[] = [
  {
    id: "ekt",
    label: "EKT",
    description: "Coordination, lisibilite globale et arbitrage inter-agents.",
    promptFile: "ekt.md",
  },
  {
    id: "vie",
    label: "Vie",
    description: "Jumeau numerique operationnel et intelligence spatiale systemique.",
    promptFile: "vie.md",
  },
  {
    id: "juridique",
    label: "Juridique",
    description: "Qualification des actions, risques et fenetres normatives.",
    promptFile: "juridique.md",
  },
  {
    id: "chantier",
    label: "Chantier",
    description: "Lecture des lots, sequences critiques, blocages et points de bascule.",
    promptFile: "chantier.md",
  },
  {
    id: "exploitation",
    label: "Exploitation",
    description: "Lecture de l'accueil, de l'usage, des evenements et de l'experience.",
    promptFile: "exploitation.md",
  },
  {
    id: "finances",
    label: "Finances",
    description: "Lecture budget, scenarios, tensions de depense et arbitrages economiques.",
    promptFile: "finances.md",
  },
  {
    id: "ecologie",
    label: "Ecologie",
    description: "Lecture eau, energie, climat, biodiversite et resilience du site.",
    promptFile: "ecologie.md",
  },
  {
    id: "enosirai",
    label: "ENOSIRAI",
    description: "Supervision robotique, faisabilite des missions et retour terrain.",
    promptFile: "enosirai.md",
  },
  {
    id: "administratif",
    label: "Administratif",
    description: "Protocoles, mails, demandes administratives et comptes rendus.",
    promptFile: "administratif.md",
  },
  {
    id: "conseil3ia",
    label: "Conseil 3 IA",
    description: "Interroge ChatGPT, Gemini et Claude puis compare les positions.",
    promptFile: "conseil3ia.md",
  },
];

export function findAgentById(agentId: AgentId) {
  return agents.find((agent) => agent.id === agentId);
}
