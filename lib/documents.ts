import { readFile } from "node:fs/promises";
import path from "node:path";
import { readMeetingReports } from "./meeting-reports";

export type DocumentEntry = {
  id: string;
  title: string;
  category:
    | "prompt"
    | "architecture"
    | "data"
    | "prototype"
    | "registry"
    | "governance"
    | "meeting";
  description: string;
  filePath?: string;
};

export const staticDocuments: DocumentEntry[] = [
  {
    id: "pack-prompts",
    title: "Pack prompts finaux maitre",
    category: "registry",
    description: "Vue d'ensemble des prompts finaux de reference du systeme.",
    filePath: path.join(process.cwd(), "..", "PACK_PROMPTS_FINAUX_MAITRE.md"),
  },
  {
    id: "archi-systeme",
    title: "Architecture systeme multi-agents",
    category: "architecture",
    description: "Document principal d'architecture globale du systeme.",
    filePath: path.join(process.cwd(), "..", "ARCHITECTURE_SYSTEME_MULTI_AGENTS.md"),
  },
  {
    id: "schema-donnees",
    title: "Schema de donnees du systeme",
    category: "data",
    description: "Modele de donnees du systeme multi-agents.",
    filePath: path.join(process.cwd(), "..", "SCHEMA_DONNEES_SYSTEME.md"),
  },
  {
    id: "registre-textes",
    title: "Registre initial des textes opposables",
    category: "registry",
    description: "Socle des textes reglementaires et juridiques a integrer.",
    filePath: path.join(process.cwd(), "..", "REGISTRE_INITIAL_TEXTES_OPPOSABLES.md"),
  },
  {
    id: "prompt-ekt",
    title: "Prompt final EKT V2",
    category: "prompt",
    description: "Prompt maitre du systeme, lisibilite et arbitrage inter-agents.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_EKT_V2.md"),
  },
  {
    id: "prompt-vie",
    title: "Prompt final Vie V4",
    category: "prompt",
    description: "Jumeau numerique, intelligence spatiale et vulnerabilites.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_VIE_V4.md"),
  },
  {
    id: "prompt-juridique",
    title: "Prompt final Juridique V2",
    category: "prompt",
    description: "Qualification des actions, risques et fenetres normatives.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_JURIDIQUE_REGLEMENTAIRE_V2.md"),
  },
  {
    id: "prompt-administratif",
    title: "Prompt final Administratif",
    category: "prompt",
    description: "Protocoles, emails, demandes et comptes rendus.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_ADMINISTRATIF.md"),
  },
  {
    id: "structure-prototype",
    title: "Structure technique du prototype",
    category: "prototype",
    description: "Architecture minimale du prototype prompts.",
    filePath: path.join(process.cwd(), "..", "STRUCTURE_TECHNIQUE_PROTOTYPE_PROMPTS.md"),
  },
  {
    id: "readme-prototype",
    title: "README prototype",
    category: "prototype",
    description: "Mode d'emploi rapide du prototype courant.",
    filePath: path.join(process.cwd(), "README.md"),
  },
  {
    id: "matrice-acces-internet",
    title: "Matrice d'acces Internet des agents",
    category: "governance",
    description: "Regles d'acces web par agent, niveaux de permission et garde-fous.",
    filePath: path.join(process.cwd(), "..", "MATRICE_ACCES_INTERNET_AGENTS.md"),
  },
  {
    id: "deploiement-web-telephone",
    title: "Deploiement web et telephone",
    category: "governance",
    description: "Feuille de route pour rendre le cockpit accessible partout et installable sur mobile.",
    filePath: path.join(process.cwd(), "..", "DEPLOIEMENT_WEB_TELEPHONE.md"),
  },
];

export async function getDocuments() {
  const meetingReports = await readMeetingReports();
  const meetingDocuments: DocumentEntry[] = meetingReports.map((report) => ({
    id: report.id,
    title: report.title,
    category: "meeting",
    description: report.description,
  }));

  return [...meetingDocuments, ...staticDocuments];
}

export async function readDocumentContent(id: string) {
  const meetingReports = await readMeetingReports();
  const meetingReport = meetingReports.find((report) => report.id === id);

  if (meetingReport) {
    return {
      id: meetingReport.id,
      title: meetingReport.title,
      category: "meeting" as const,
      description: meetingReport.description,
      content: meetingReport.content,
    };
  }

  const document = staticDocuments.find((entry) => entry.id === id);

  if (!document || !document.filePath) {
    throw new Error("Document introuvable.");
  }

  const content = await readFile(document.filePath, "utf8");

  return {
    ...document,
    content,
  };
}
