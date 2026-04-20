export type GanttStatus =
  | "a-instruire"
  | "pret-a-decider"
  | "bloque"
  | "en-execution"
  | "clos"
  | "non-reouvrable";

export type GanttCriticality = "faible" | "moyenne" | "haute" | "critique";
export type GanttIrreversibility = "faible" | "moyenne" | "forte";
export type GanttDecisionState = "ouverte" | "tranchee" | "sans-objet";
export type GanttMode = "week" | "month";
export type GanttFocus =
  | "all"
  | "blocked"
  | "critical"
  | "emmanuel"
  | "missing"
  | "irreversible";

export type GanttTask = {
  id: string;
  sujet: string;
  lotDomaine: string;
  agentSource: string;
  responsable: string;
  statut: GanttStatus;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle?: string | null;
  dateFinReelle?: string | null;
  blocage: boolean;
  dependDe?: string | null;
  nonNegociable: boolean;
  seuilDeReprise: string;
  donneeManquante?: string | null;
  niveauCriticite: GanttCriticality;
  irreversibilite: GanttIrreversibility;
  decisionEmmanuel: GanttDecisionState;
  commentaireEkt: string;
  goulot: boolean;
  pointDeBascule: string;
};

export type EktDecisionLog = {
  date: string;
  sujet: string;
  decision: string;
  typeDecision: string;
  responsable: string;
  impactPlanning: "nul" | "faible" | "moyen" | "fort";
  impactBudget: "nul" | "faible" | "moyen" | "fort";
  impactSecurite: "nul" | "faible" | "moyen" | "fort";
  impactConformite: "nul" | "faible" | "moyen" | "fort";
  notes: string;
};

export const ganttProjectStart = "2026-04-07";

export const ganttTasks: GanttTask[] = [
  {
    id: "EKT-01",
    sujet: "Arbitrage securite incendie",
    lotDomaine: "Securite / conformite",
    agentSource: "juridique",
    responsable: "Emmanuel",
    statut: "pret-a-decider",
    dateDebutPrevue: "2026-04-14",
    dateFinPrevue: "2026-04-24",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: false,
    dependDe: null,
    nonNegociable: true,
    seuilDeReprise: "Accord formel sur le scenario de couverture incendie.",
    donneeManquante: "Retour final SDIS sur option B.",
    niveauCriticite: "critique",
    irreversibilite: "forte",
    decisionEmmanuel: "ouverte",
    commentaireEkt:
      "Point de decision majeur. Sans arbitrage, plusieurs lots restent figes artificiellement.",
    goulot: true,
    pointDeBascule: "Au-dela du 24 avril, la sequence chantier perd sa fenetre utile.",
  },
  {
    id: "EKT-02",
    sujet: "Levee reserve acces PMR",
    lotDomaine: "Exploitation / usagers",
    agentSource: "exploitation",
    responsable: "Claire",
    statut: "en-execution",
    dateDebutPrevue: "2026-04-18",
    dateFinPrevue: "2026-05-02",
    dateDebutReelle: "2026-04-19",
    dateFinReelle: null,
    blocage: false,
    dependDe: null,
    nonNegociable: true,
    seuilDeReprise: "Validation terrain du cheminement definitif.",
    donneeManquante: null,
    niveauCriticite: "haute",
    irreversibilite: "moyenne",
    decisionEmmanuel: "tranchee",
    commentaireEkt: "Action utile visible rapidement, mais sensible a toute derive travaux.",
    goulot: false,
    pointDeBascule: "Si la reserve n'est pas levee avant ouverture tests, reprise complete.",
  },
  {
    id: "EKT-03",
    sujet: "Depot dossier conforme mairie",
    lotDomaine: "Administratif",
    agentSource: "administratif",
    responsable: "Emmanuel",
    statut: "bloque",
    dateDebutPrevue: "2026-04-25",
    dateFinPrevue: "2026-05-05",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: true,
    dependDe: "EKT-01",
    nonNegociable: true,
    seuilDeReprise: "Pack documentaire complet et scenario incendie arbitre.",
    donneeManquante: "Version signee du schema securite.",
    niveauCriticite: "critique",
    irreversibilite: "forte",
    decisionEmmanuel: "ouverte",
    commentaireEkt: "Blocage prioritaire. Ne pas laisser croire que le dossier est librement executable.",
    goulot: true,
    pointDeBascule: "Chaque semaine perdue cree un risque de glissement institutionnel.",
  },
  {
    id: "EKT-04",
    sujet: "Decision budget reseau incendie",
    lotDomaine: "Finances",
    agentSource: "finances",
    responsable: "Emmanuel",
    statut: "pret-a-decider",
    dateDebutPrevue: "2026-04-25",
    dateFinPrevue: "2026-04-25",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: false,
    dependDe: "EKT-01",
    nonNegociable: true,
    seuilDeReprise: "Comparatif cout / risque boucle.",
    donneeManquante: "Chiffrage final de la variante renforcee.",
    niveauCriticite: "haute",
    irreversibilite: "forte",
    decisionEmmanuel: "ouverte",
    commentaireEkt: "Jalon d'arbitrage. A afficher distinctement comme decision et non comme tache longue.",
    goulot: true,
    pointDeBascule: "Sans go budget, la sequence technique suivante doit etre gelee.",
  },
  {
    id: "EKT-05",
    sujet: "Contrat exploitation cible",
    lotDomaine: "Exploitation / contractualisation",
    agentSource: "exploitation",
    responsable: "Marc",
    statut: "a-instruire",
    dateDebutPrevue: "2026-04-28",
    dateFinPrevue: "2026-05-16",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: false,
    dependDe: "EKT-04",
    nonNegociable: false,
    seuilDeReprise: "Hypothese d'investissement stabilisee.",
    donneeManquante: "Cout exploitation post-travaux.",
    niveauCriticite: "moyenne",
    irreversibilite: "moyenne",
    decisionEmmanuel: "ouverte",
    commentaireEkt: "A ne pas traiter comme libre. Depend de l'arbitrage budget.",
    goulot: false,
    pointDeBascule: "Si le contrat part sur une mauvaise base, la correction sera couteuse.",
  },
  {
    id: "EKT-06",
    sujet: "Sequence terrassement lot nord",
    lotDomaine: "Chantier",
    agentSource: "chantier",
    responsable: "Nadia",
    statut: "clos",
    dateDebutPrevue: "2026-04-09",
    dateFinPrevue: "2026-04-16",
    dateDebutReelle: "2026-04-09",
    dateFinReelle: "2026-04-16",
    blocage: false,
    dependDe: null,
    nonNegociable: false,
    seuilDeReprise: "Sans objet.",
    donneeManquante: null,
    niveauCriticite: "moyenne",
    irreversibilite: "faible",
    decisionEmmanuel: "sans-objet",
    commentaireEkt: "Reference utile pour mesurer les glissements amont.",
    goulot: false,
    pointDeBascule: "Sans objet.",
  },
  {
    id: "EKT-07",
    sujet: "Choix filiere eaux grises",
    lotDomaine: "Ecologie / technique",
    agentSource: "ecologie",
    responsable: "Emmanuel",
    statut: "non-reouvrable",
    dateDebutPrevue: "2026-05-03",
    dateFinPrevue: "2026-05-22",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: false,
    dependDe: null,
    nonNegociable: true,
    seuilDeReprise: "Etude comparative complete avec cout de retour arriere.",
    donneeManquante: null,
    niveauCriticite: "haute",
    irreversibilite: "forte",
    decisionEmmanuel: "tranchee",
    commentaireEkt:
      "Sujet a tres forte irreversibilite. Doit rester visuellement distinct du flux courant.",
    goulot: false,
    pointDeBascule: "Une fois engage, le retour arriere impose reprise de lot et surcout.",
  },
  {
    id: "EKT-08",
    sujet: "Autorisation temporaire acces chantier",
    lotDomaine: "Juridique / chantier",
    agentSource: "juridique",
    responsable: "Sonia",
    statut: "bloque",
    dateDebutPrevue: "2026-04-20",
    dateFinPrevue: "2026-04-29",
    dateDebutReelle: null,
    dateFinReelle: null,
    blocage: true,
    dependDe: null,
    nonNegociable: true,
    seuilDeReprise: "Confirmation prefectorale ecrite.",
    donneeManquante: "Attestation de flux temporaires.",
    niveauCriticite: "haute",
    irreversibilite: "moyenne",
    decisionEmmanuel: "ouverte",
    commentaireEkt: "Urgence visible. Le blocage doit ressortir avant toute autre lecture.",
    goulot: true,
    pointDeBascule: "Si non levee cette semaine, risque de rupture de sequence chantier.",
  },
];

export const ganttDecisions: EktDecisionLog[] = [
  {
    date: "2026-04-18",
    sujet: "Scenario incendie",
    decision: "Maintenir deux variantes jusqu'au retour SDIS.",
    typeDecision: "arbitrage",
    responsable: "Emmanuel",
    impactPlanning: "moyen",
    impactBudget: "moyen",
    impactSecurite: "fort",
    impactConformite: "fort",
    notes: "Decision transitoire. Doit etre refermee vite pour eviter l'illusion d'avancement.",
  },
  {
    date: "2026-04-19",
    sujet: "Reserve PMR",
    decision: "Lancer les ajustements legers sans attendre la boucle finale.",
    typeDecision: "go/no-go",
    responsable: "Claire",
    impactPlanning: "faible",
    impactBudget: "faible",
    impactSecurite: "nul",
    impactConformite: "moyen",
    notes: "Permet de tenir le rythme sans engager de reprise lourde.",
  },
  {
    date: "2026-04-20",
    sujet: "Acces chantier temporaire",
    decision: "Saisir prioritairement le juridique et suspendre tout engagement irrevisible.",
    typeDecision: "risque",
    responsable: "Sonia",
    impactPlanning: "fort",
    impactBudget: "moyen",
    impactSecurite: "moyen",
    impactConformite: "fort",
    notes: "Blocage prioritaire du moment.",
  },
  {
    date: "2026-04-22",
    sujet: "Budget reseau incendie",
    decision: "Arbitrage Emmanuel attendu en comite restreint.",
    typeDecision: "budget",
    responsable: "Emmanuel",
    impactPlanning: "fort",
    impactBudget: "fort",
    impactSecurite: "moyen",
    impactConformite: "moyen",
    notes: "Jalon noir dans la vue Gantt.",
  },
];

export const ganttStatusLabels: Record<GanttStatus, string> = {
  "a-instruire": "A instruire",
  "pret-a-decider": "Pret a decider",
  bloque: "Bloque",
  "en-execution": "En execution",
  clos: "Clos",
  "non-reouvrable": "Non reouvrable",
};

export const ganttStatusColors: Record<GanttStatus, string> = {
  "a-instruire": "#b8c0cc",
  "pret-a-decider": "#f59e0b",
  bloque: "#dc2626",
  "en-execution": "#2563eb",
  clos: "#16a34a",
  "non-reouvrable": "#7c3aed",
};

export function parseIsoDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(parseIsoDate(value));
}

export function formatDateLong(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseIsoDate(value));
}

export function getTaskDuration(task: GanttTask) {
  const start = parseIsoDate(task.dateDebutPrevue);
  const end = parseIsoDate(task.dateFinPrevue);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 86400000) + 1;
}

export function isMilestone(task: GanttTask) {
  return task.dateDebutPrevue === task.dateFinPrevue;
}

export function isIrreversible(task: GanttTask) {
  return task.statut === "non-reouvrable" || task.irreversibilite === "forte";
}

export function findDependencyTask(task: GanttTask, tasks: GanttTask[]) {
  if (!task.dependDe) {
    return null;
  }

  return tasks.find((candidate) => candidate.id === task.dependDe) ?? null;
}

export function isExecutable(task: GanttTask, tasks: GanttTask[]) {
  if (task.blocage) {
    return false;
  }

  const dependency = findDependencyTask(task, tasks);
  if (!dependency) {
    return true;
  }

  return dependency.statut === "clos";
}

export function getExecutionReason(task: GanttTask, tasks: GanttTask[]) {
  if (task.blocage) {
    return "Blocage declare";
  }

  const dependency = findDependencyTask(task, tasks);
  if (!dependency) {
    return "Libre";
  }

  if (dependency.statut === "clos") {
    return `Dependance levee (${dependency.id})`;
  }

  return `En attente de ${dependency.id}`;
}

export function getUniqueAgents(tasks: GanttTask[]) {
  return Array.from(new Set(tasks.map((task) => task.agentSource))).sort((a, b) =>
    a.localeCompare(b, "fr-FR")
  );
}

