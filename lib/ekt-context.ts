import { readHistory } from "./storage";
import { readWorkingMemory } from "./memory";
import { readMeetingReports } from "./meeting-reports";

function truncate(text: string, limit = 900) {
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export async function buildEktContext(baseContext: string) {
  const [memory, history, meetingReports] = await Promise.all([
    readWorkingMemory(),
    readHistory(),
    readMeetingReports(),
  ]);

  const recentHistory = history.slice(0, 5);
  const latestMeeting = meetingReports[0] ?? null;

  return [
    "DOSSIER AUTOMATIQUE EKT",
    "",
    "CONTEXTE FOURNI",
    baseContext || "[aucun contexte fourni]",
    "",
    "CONTEXTE ACTIF MEMOIRE",
    memory.activeContext || "[aucun contexte actif]",
    "",
    "DECISIONS RECENTES",
    ...(memory.decisions.slice(0, 5).map(
      (item) =>
        `- ${item.title} | ${item.sourceAgentId.toUpperCase()} | ${new Date(item.createdAt).toLocaleString("fr-FR")} | ${truncate(item.content, 320)}`
    ) || ["[aucune]"]),
    "",
    "REGISTRE DE DECISION",
    ...(memory.decisionRegister.slice(0, 8).map(
      (item) =>
        [
          `- Sujet : ${item.subject}`,
          `  Decision : ${item.decision}`,
          `  Statut : ${item.status}`,
          `  Non negociable : ${item.nonNegotiable}`,
          `  Donnee manquante : ${item.missingData}`,
          `  Seuil de reprise : ${item.resumeThreshold}`,
          `  Responsable : ${item.owner}`,
        ].join("\n")
    ) || ["[aucun]"]),
    "",
    "ALERTES RECENTES",
    ...(memory.alerts.slice(0, 5).map(
      (item) =>
        `- ${item.title} | ${item.sourceAgentId.toUpperCase()} | ${new Date(item.createdAt).toLocaleString("fr-FR")} | ${truncate(item.content, 320)}`
    ) || ["[aucune]"]),
    "",
    "QUESTIONS OUVERTES",
    ...(memory.openQuestions.slice(0, 5).map(
      (item) =>
        `- ${item.title} | ${item.sourceAgentId.toUpperCase()} | ${new Date(item.createdAt).toLocaleString("fr-FR")} | ${truncate(item.content, 320)}`
    ) || ["[aucune]"]),
    "",
    "REGISTRE D'INCERTITUDE",
    ...(memory.uncertainties.slice(0, 8).map(
      (item) =>
        `- ${item.level} | ${item.sourceAgentId.toUpperCase()} | ${new Date(item.createdAt).toLocaleString("fr-FR")} | ${truncate(item.content, 320)}`
    ) || ["[aucune]"]),
    "",
    "HISTORIQUE RECENT",
    ...(recentHistory.length
      ? recentHistory.map(
          (item) =>
            `- ${item.agentId.toUpperCase()} | ${new Date(item.createdAt).toLocaleString("fr-FR")} | ${truncate(item.userPrompt, 180)} | ${truncate(item.response, 260)}`
        )
      : ["[aucun]"]),
    "",
    "DERNIERE REUNION ARCHIVEE",
    ...(latestMeeting
      ? [
          `Titre : ${latestMeeting.title}`,
          `Date : ${new Date(latestMeeting.createdAt).toLocaleString("fr-FR")}`,
          `Moderateur : ${latestMeeting.moderatorId.toUpperCase()}`,
          `Participants : ${latestMeeting.participantIds.map((id) => id.toUpperCase()).join(", ")}`,
          `Agenda : ${latestMeeting.agenda}`,
          "Extrait :",
          truncate(latestMeeting.content, 1600),
        ]
      : ["[aucune reunion archivee]"]),
  ].join("\n");
}
