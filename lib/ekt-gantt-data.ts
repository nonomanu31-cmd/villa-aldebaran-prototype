import { readHistory } from "./storage";
import { readWorkingMemory, type DecisionRegisterItem, type WorkingMemory } from "./memory";
import { parseModelResponse, type ParsedSection } from "./response-parser";
import type { AgentRunRecord } from "./types";
import {
  ganttDecisions as fallbackDecisions,
  ganttProjectStart,
  ganttTasks as fallbackTasks,
  type EktDecisionLog,
  type GanttCriticality,
  type GanttDecisionState,
  type GanttIrreversibility,
  type GanttStatus,
  type GanttTask,
  parseIsoDate,
} from "./ekt-gantt";

export type GanttDataset = {
  projectStart: string;
  tasks: GanttTask[];
  decisions: EktDecisionLog[];
  sourceLabel: string;
};

function normalizeLoose(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/^[-•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^→\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clipText(value: string, limit = 180) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function slugify(value: string) {
  return normalizeLoose(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function isoDate(value: string) {
  return value.slice(0, 10);
}

function addDaysIso(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function findSection(sections: ParsedSection[], matcher: RegExp) {
  return sections.find((section) => matcher.test(normalizeLoose(section.title))) ?? null;
}

function sectionItems(section: ParsedSection | null) {
  if (!section) {
    return [];
  }

  const items: string[] = [];
  let buffer = "";

  for (const line of section.body) {
    const trimmed = cleanText(line);
    if (!trimmed) {
      continue;
    }

    if (/^[-•]/.test(line) || /^\d+[.)]/.test(line.trim())) {
      if (buffer) {
        items.push(buffer.trim());
      }
      buffer = trimmed;
      continue;
    }

    if (/^[A-Za-zÀ-ÿ].{0,40}:/.test(trimmed) && !buffer) {
      items.push(trimmed);
      continue;
    }

    if (buffer) {
      buffer = `${buffer} ${trimmed}`;
    } else {
      items.push(trimmed);
    }
  }

  if (buffer) {
    items.push(buffer.trim());
  }

  return items.filter(Boolean);
}

function inferLotDomaine(text: string) {
  const normalized = normalizeLoose(text);

  if (/(pmr|acces|chantier|niveau fini|logistique|livraison)/.test(normalized)) {
    return "Chantier / acces";
  }

  if (/(tresorerie|banque|paiement|fournisseur|cash|decaissement)/.test(normalized)) {
    return "Finances / tresorerie";
  }

  if (/(juridique|conformite|autorisation|prefecture|mairie)/.test(normalized)) {
    return "Juridique / conformite";
  }

  if (/(incendie|securite|sdis)/.test(normalized)) {
    return "Securite / conformite";
  }

  return "Pilotage EKT";
}

function inferCriticality(text: string, blocked: boolean): GanttCriticality {
  const normalized = normalizeLoose(text);

  if (blocked || /(critique|arret|suspension|irreversibil|prioritaire|goulot)/.test(normalized)) {
    return "critique";
  }

  if (/(urgent|fort|bloquant|non negociable|se ferme)/.test(normalized)) {
    return "haute";
  }

  if (/(a verifier|question|donnee|validation)/.test(normalized)) {
    return "moyenne";
  }

  return "faible";
}

function inferIrreversibility(text: string, nonNegotiable: boolean): GanttIrreversibility {
  const normalized = normalizeLoose(text);

  if (nonNegotiable || /(irreversibil|non reouvrable|verrouillage|se ferme)/.test(normalized)) {
    return "forte";
  }

  if (/(tension|couteux|reprise|contentieux)/.test(normalized)) {
    return "moyenne";
  }

  return "faible";
}

function inferStatus(text: string, options?: { blocked?: boolean; closed?: boolean; decision?: boolean; irreversible?: boolean }) {
  if (options?.closed) {
    return "clos" as GanttStatus;
  }

  if (options?.irreversible) {
    return "non-reouvrable" as GanttStatus;
  }

  if (options?.blocked) {
    return "bloque" as GanttStatus;
  }

  if (options?.decision) {
    return "pret-a-decider" as GanttStatus;
  }

  return "a-instruire" as GanttStatus;
}

function inferDecisionState(responsable: string, status: GanttStatus) {
  if (status === "clos" || status === "non-reouvrable") {
    return "tranchee" as GanttDecisionState;
  }

  return normalizeLoose(responsable).includes("emmanuel") ? "ouverte" : "sans-objet";
}

function guessMissingData(verificationItems: string[]) {
  return verificationItems[0] ? clipText(verificationItems[0], 140) : null;
}

function dedupeTasks(tasks: GanttTask[]) {
  const seen = new Map<string, GanttTask>();

  for (const task of tasks) {
    const key = slugify(task.sujet);
    if (!seen.has(key)) {
      seen.set(key, task);
    }
  }

  return Array.from(seen.values()).sort((left, right) =>
    right.dateDebutPrevue.localeCompare(left.dateDebutPrevue)
  );
}

function dedupeDecisions(decisions: EktDecisionLog[]) {
  const seen = new Map<string, EktDecisionLog>();

  for (const decision of decisions) {
    const key = `${decision.date}-${slugify(decision.sujet)}`;
    if (!seen.has(key)) {
      seen.set(key, decision);
    }
  }

  return Array.from(seen.values()).sort((left, right) => right.date.localeCompare(left.date));
}

function mapDecisionRegisterStatus(item: DecisionRegisterItem) {
  const normalized = normalizeLoose(item.status || "");

  if (/(clos|ferme|tranche|fait|ok)/.test(normalized)) {
    return "clos" as GanttStatus;
  }

  if (/(irreversible|non reouvrable)/.test(normalized)) {
    return "non-reouvrable" as GanttStatus;
  }

  if (item.missingData || /(bloq|attente|suspendu)/.test(normalized)) {
    return "bloque" as GanttStatus;
  }

  if (/(ouvert|arbitrage|decision)/.test(normalized)) {
    return "pret-a-decider" as GanttStatus;
  }

  return "a-instruire" as GanttStatus;
}

function mapDecisionRegisterItem(item: DecisionRegisterItem, index: number): GanttTask {
  const start = isoDate(item.createdAt);
  const status = mapDecisionRegisterStatus(item);
  const nonNegotiable = /oui|yes|true/i.test(item.nonNegotiable || "");

  return {
    id: `MEM-${index + 1}`,
    sujet: clipText(item.subject || "Decision du registre"),
    lotDomaine: inferLotDomaine(`${item.subject} ${item.decision}`),
    agentSource: item.sourceAgentId || "ekt",
    responsable: item.owner || "Emmanuel",
    statut: status,
    dateDebutPrevue: start,
    dateFinPrevue: addDaysIso(start, status === "pret-a-decider" ? 2 : 7),
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: status === "bloque",
    dependDe: null,
    nonNegociable: nonNegotiable,
    seuilDeReprise: item.resumeThreshold || "Seuil non renseigne.",
    donneeManquante: item.missingData || null,
    niveauCriticite: inferCriticality(`${item.subject} ${item.decision} ${item.missingData}`, status === "bloque"),
    irreversibilite: inferIrreversibility(`${item.subject} ${item.decision}`, nonNegotiable),
    decisionEmmanuel: inferDecisionState(item.owner || "Emmanuel", status),
    commentaireEkt: item.decision || "Decision en attente de detail.",
    goulot: status === "bloque" || nonNegotiable,
    pointDeBascule: item.resumeThreshold || item.decision || "Point de bascule non precise.",
  };
}

function mapDecisionRegisterLog(item: DecisionRegisterItem): EktDecisionLog {
  return {
    date: isoDate(item.createdAt),
    sujet: clipText(item.subject || "Decision du registre", 90),
    decision: clipText(item.decision || "Decision du registre", 180),
    typeDecision: "registre",
    responsable: item.owner || "Emmanuel",
    impactPlanning: item.missingData ? "fort" : "moyen",
    impactBudget: /budget|paiement|tresorerie/i.test(item.decision) ? "fort" : "faible",
    impactSecurite: /securit|incendie|pmr/i.test(`${item.subject} ${item.decision}`) ? "fort" : "faible",
    impactConformite: /conform|autorisation|juridique/i.test(`${item.subject} ${item.decision}`) ? "fort" : "moyen",
    notes: clipText(item.resumeThreshold || item.missingData || "Issue du registre de decision EKT.", 220),
  };
}

function buildHistorySubject(prefix: string, item: string) {
  const clean = cleanText(item).replace(/^[A-Za-zÀ-ÿ][^:]{0,30}:\s*/, "");
  return clipText(clean || prefix, 120);
}

function buildHistoryTask(entry: AgentRunRecord, index: number, sujet: string, options: {
  status: GanttStatus;
  blocked?: boolean;
  decision?: boolean;
  goulot?: boolean;
  nonNegotiable?: boolean;
  pointDeBascule?: string;
  missingData?: string | null;
  comment?: string;
}): GanttTask {
  const start = isoDate(entry.createdAt);
  const text = `${sujet} ${options.comment || ""} ${options.pointDeBascule || ""} ${options.missingData || ""}`;

  return {
    id: `HIS-${index + 1}-${slugify(sujet).slice(0, 16) || "ekt"}`,
    sujet: clipText(sujet, 120),
    lotDomaine: inferLotDomaine(`${entry.userPrompt} ${entry.response}`),
    agentSource: entry.agentId,
    responsable: options.decision ? "Emmanuel" : "EKT",
    statut: options.status,
    dateDebutPrevue: start,
    dateFinPrevue: addDaysIso(start, options.status === "pret-a-decider" ? 2 : 7),
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: Boolean(options.blocked),
    dependDe: null,
    nonNegociable: Boolean(options.nonNegotiable),
    seuilDeReprise: options.missingData || "Verification terrain et arbitrage EKT.",
    donneeManquante: options.missingData || null,
    niveauCriticite: inferCriticality(text, Boolean(options.blocked)),
    irreversibilite: inferIrreversibility(text, Boolean(options.nonNegotiable)),
    decisionEmmanuel: options.decision ? "ouverte" : "sans-objet",
    commentaireEkt: clipText(options.comment || entry.userPrompt || "Lecture EKT derivee de l'historique.", 240),
    goulot: Boolean(options.goulot),
    pointDeBascule: clipText(options.pointDeBascule || "Point de bascule non explicite dans la reponse.", 180),
  };
}

function deriveFromHistory(history: AgentRunRecord[]) {
  const ektEntries = history.filter((item) => item.agentId === "ekt" && item.response).slice(0, 4);
  const tasks: GanttTask[] = [];
  const decisions: EktDecisionLog[] = [];

  ektEntries.forEach((entry, entryIndex) => {
    const parsed = parseModelResponse(entry.response);
    const goulotSection = findSection(parsed.sections, /goulot de la semaine/);
    const decisionSection = findSection(parsed.sections, /decisions requises|options de decision/);
    const recommendationSection = findSection(parsed.sections, /recommandation immediate/);
    const verificationSection = findSection(parsed.sections, /verifications a exiger|points fragiles/);
    const pointSection = findSection(parsed.sections, /point de bascule/);

    const verificationItems = sectionItems(verificationSection);
    const pointItems = sectionItems(pointSection);
    const goulotItems = sectionItems(goulotSection);
    const decisionItems = sectionItems(decisionSection).slice(0, 3);
    const recommendationItems = sectionItems(recommendationSection).slice(0, 2);
    const pointText = pointItems[0] || goulotItems.find((item) => /se ferme|bascule|suspension/i.test(item)) || "";
    const missingData = guessMissingData(verificationItems);

    if (goulotSection) {
      const natureLine =
        goulotItems.find((item) => /^nature\s*:/i.test(item))
        || goulotItems.find((item) => !/^localisation\s*:/i.test(item))
        || "Goulot EKT actif";

      tasks.push(
        buildHistoryTask(entry, entryIndex, buildHistorySubject("Goulot EKT", natureLine), {
          status: "bloque",
          blocked: true,
          goulot: true,
          nonNegotiable: true,
          pointDeBascule: pointText,
          missingData,
          comment: goulotItems.join(" "),
        })
      );
    }

    decisionItems.forEach((item, itemIndex) => {
      const subject = buildHistorySubject("Decision Emmanuel", item);
      tasks.push(
        buildHistoryTask(entry, entryIndex * 10 + itemIndex + 1, subject, {
          status: "pret-a-decider",
          decision: true,
          nonNegotiable: /non negociable|priorit|gel|obligatoire/i.test(item),
          pointDeBascule: pointText,
          missingData,
          comment: item,
        })
      );

      decisions.push({
        date: isoDate(entry.createdAt),
        sujet: clipText(subject, 90),
        decision: clipText(item, 180),
        typeDecision: "lecture-ekt",
        responsable: "Emmanuel",
        impactPlanning: /planning|fenetre|retard|arret/i.test(item) ? "fort" : "moyen",
        impactBudget: /budget|paiement|depense|fournisseur/i.test(item) ? "fort" : "faible",
        impactSecurite: /securit|pmr|incendie|incident/i.test(item) ? "fort" : "faible",
        impactConformite: /conform|juridique|autorisation|preuve/i.test(item) ? "fort" : "moyen",
        notes: clipText(pointText || missingData || "Decision derivee d'une lecture EKT recente.", 220),
      });
    });

    recommendationItems.forEach((item, itemIndex) => {
      tasks.push(
        buildHistoryTask(entry, entryIndex * 10 + itemIndex + 5, buildHistorySubject("Action EKT", item), {
          status: "en-execution",
          decision: false,
          nonNegotiable: /exiger|acter|interdiction|mettre en place|lancer/i.test(item),
          pointDeBascule: pointText,
          missingData,
          comment: item,
        })
      );
    });
  });

  return {
    tasks: dedupeTasks(tasks),
    decisions: dedupeDecisions(decisions),
  };
}

function deriveFromMemory(memory: WorkingMemory) {
  return {
    tasks: memory.decisionRegister.map(mapDecisionRegisterItem),
    decisions: memory.decisionRegister.map(mapDecisionRegisterLog),
  };
}

export async function buildGanttDataset(): Promise<GanttDataset> {
  const [memory, history] = await Promise.all([readWorkingMemory(), readHistory()]);
  const memoryData = deriveFromMemory(memory);
  const historyData = deriveFromHistory(history);

  const tasks = dedupeTasks([...memoryData.tasks, ...historyData.tasks]);
  const decisions = dedupeDecisions([...memoryData.decisions, ...historyData.decisions]);

  if (tasks.length === 0) {
    return {
      projectStart: ganttProjectStart,
      tasks: fallbackTasks,
      decisions: fallbackDecisions,
      sourceLabel: "Donnees d'exemple (aucune donnee projet exploitable trouvee)",
    };
  }

  return {
    projectStart: tasks[tasks.length - 1]?.dateDebutPrevue || ganttProjectStart,
    tasks,
    decisions: decisions.length > 0 ? decisions : fallbackDecisions,
    sourceLabel:
      memory.decisionRegister.length > 0
        ? "Memoire EKT + historique des lectures"
        : "Historique recent des lectures EKT",
  };
}
