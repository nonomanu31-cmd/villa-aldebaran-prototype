export type AgentId =
  | "ekt"
  | "vie"
  | "juridique"
  | "chantier"
  | "exploitation"
  | "finances"
  | "ecologie"
  | "enosirai"
  | "administratif"
  | "conseil3ia";

export type AgentDefinition = {
  id: AgentId;
  label: string;
  description: string;
  promptFile: string;
};

export type AgentRunRequest = {
  agentId: AgentId;
  context: string;
  userPrompt: string;
  useWeb?: boolean;
};

export type WebSource = {
  url: string;
  title?: string;
};

export type MeetingParticipantResponse = {
  agentId: AgentId;
  label: string;
  message: string;
  promptPreview: string;
  sources?: WebSource[];
};

export type AgentMeetingResponse = {
  participantIds: AgentId[];
  moderatorId: AgentId;
  agenda: string;
  transcript: MeetingParticipantResponse[];
  synthesis: MeetingParticipantResponse | null;
  minutes: MeetingParticipantResponse | null;
};

export type AgentRunRecord = {
  id: string;
  agentId: AgentId;
  context: string;
  userPrompt: string;
  response: string;
  createdAt: string;
};
