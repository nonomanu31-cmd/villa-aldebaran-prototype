import type { AgentMeetingResponse, AgentId } from "./types";
import { readPersistedJson, resolveDataFile, writePersistedJson } from "./persistence";

export type MeetingReportRecord = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  agenda: string;
  moderatorId: AgentId;
  participantIds: AgentId[];
  content: string;
};

const meetingReportsPath = resolveDataFile("meeting-reports.json");
const meetingReportsBlobPath = "app-data/meeting-reports.json";

function buildMeetingReportContent(meeting: AgentMeetingResponse, context: string, userPrompt: string) {
  const parts: string[] = [
    `# ${buildMeetingTitle(meeting.agenda)}`,
    "",
    `Date : ${new Date().toLocaleString("fr-FR")}`,
    `Moderateur : ${meeting.moderatorId.toUpperCase()}`,
    `Participants : ${meeting.participantIds.map((id) => id.toUpperCase()).join(", ")}`,
    "",
    "## Contexte",
    context,
    "",
    "## Demande",
    userPrompt,
    "",
    "## Ordre du jour",
    meeting.agenda,
    "",
    "## Tour de table",
  ];

  meeting.transcript.forEach((entry) => {
    parts.push(`### ${entry.label}`);
    parts.push(entry.message);
    parts.push("");
  });

  if (meeting.synthesis) {
    parts.push("## Synthese moderateur");
    parts.push(meeting.synthesis.message);
    parts.push("");
  }

  if (meeting.minutes) {
    parts.push("## Compte rendu administratif");
    parts.push(meeting.minutes.message);
    parts.push("");
  }

  return parts.join("\n");
}

function buildMeetingTitle(agenda: string) {
  const firstLine = agenda
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? `Reunion IA - ${firstLine}` : "Reunion IA";
}

export async function readMeetingReports(): Promise<MeetingReportRecord[]> {
  return readPersistedJson(meetingReportsBlobPath, meetingReportsPath, []);
}

export async function appendMeetingReport(report: MeetingReportRecord) {
  const reports = await readMeetingReports();
  reports.unshift(report);
  await writePersistedJson(meetingReportsBlobPath, meetingReportsPath, reports);
}

export async function archiveMeetingReport(input: {
  meeting: AgentMeetingResponse;
  context: string;
  userPrompt: string;
}) {
  const createdAt = new Date().toISOString();
  const report: MeetingReportRecord = {
    id: `meeting-${crypto.randomUUID()}`,
    title: buildMeetingTitle(input.meeting.agenda),
    description: `Compte rendu archive de reunion IA du ${new Date(createdAt).toLocaleString("fr-FR")}.`,
    createdAt,
    agenda: input.meeting.agenda,
    moderatorId: input.meeting.moderatorId,
    participantIds: input.meeting.participantIds,
    content: buildMeetingReportContent(input.meeting, input.context, input.userPrompt),
  };

  await appendMeetingReport(report);
  return report;
}
