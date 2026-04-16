import type { AgentId } from "./types";

export type WebAccessLevel = "none" | "limited" | "broad" | "official_only";

export type WebAccessRule = {
  level: WebAccessLevel;
  note: string;
  allowedDomains?: string[];
};

export const webAccessRules: Record<AgentId, WebAccessRule> = {
  ekt: {
    level: "none",
    note: "EKT relit et arbitre ; il ne cherche pas le web en premiere ligne.",
  },
  vie: {
    level: "broad",
    note: "Acces large pour usage reel, meteo, comportements, entretien et signaux faibles.",
  },
  juridique: {
    level: "official_only",
    note: "Sources officielles et corpus opposables uniquement.",
    allowedDomains: [
      "boe.es",
      "portaljuridic.gencat.cat",
      "sede.administracion.gob.es",
      "administracion.gob.es",
      "legifrance.gouv.fr",
      "eur-lex.europa.eu",
      "gencat.cat",
      "cabrerademar.cat",
    ],
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
    note: "Recherche ciblee sur donnees economiques et comparables dates.",
  },
  ecologie: {
    level: "broad",
    note: "Acces large pour meteo, restrictions, ressources et climat.",
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

export function getWebAccessRule(agentId: AgentId) {
  return webAccessRules[agentId];
}

export function canAgentUseWeb(agentId: AgentId) {
  return webAccessRules[agentId].level !== "none";
}
