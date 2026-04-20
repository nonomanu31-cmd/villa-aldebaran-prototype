import { readPersistedJson, resolveDataFile, writePersistedJson } from "./persistence";

export type MemoryItemType =
  | "decision"
  | "alert"
  | "openQuestion"
  | "uncertaintyMinor"
  | "uncertaintyStructuring"
  | "uncertaintyCritical"
  | "uncertaintyCategoryShift";

export type MemoryItem = {
  id: string;
  title: string;
  content: string;
  sourceAgentId: string;
  createdAt: string;
};

export type UncertaintyLevel =
  | "mineure"
  | "structurante"
  | "critique"
  | "change-categorie";

export type UncertaintyItem = MemoryItem & {
  level: UncertaintyLevel;
};

export type DecisionRegisterItem = {
  id: string;
  subject: string;
  decision: string;
  status: string;
  nonNegotiable: string;
  missingData: string;
  resumeThreshold: string;
  owner: string;
  sourceAgentId: string;
  createdAt: string;
};

export type WorkingMemory = {
  activeContext: string;
  decisions: MemoryItem[];
  alerts: MemoryItem[];
  openQuestions: MemoryItem[];
  uncertainties: UncertaintyItem[];
  decisionRegister: DecisionRegisterItem[];
};

const memoryPath = resolveDataFile("working-memory.json");
const memoryBlobPath = "app-data/working-memory.json";

const emptyMemory: WorkingMemory = {
  activeContext: "Villa Aldebaran - memoire de travail initiale.",
  decisions: [],
  alerts: [],
  openQuestions: [],
  uncertainties: [],
  decisionRegister: [],
};

export async function readWorkingMemory(): Promise<WorkingMemory> {
  return readPersistedJson(memoryBlobPath, memoryPath, emptyMemory);
}

export async function writeWorkingMemory(memory: WorkingMemory) {
  await writePersistedJson(memoryBlobPath, memoryPath, memory);
}

export async function updateActiveContext(activeContext: string) {
  const memory = await readWorkingMemory();
  memory.activeContext = activeContext;
  await writeWorkingMemory(memory);
  return memory;
}

export async function appendMemoryItem(
  type: MemoryItemType,
  item: MemoryItem
): Promise<WorkingMemory> {
  const memory = await readWorkingMemory();

  if (type === "decision") {
    memory.decisions.unshift(item);
  }

  if (type === "alert") {
    memory.alerts.unshift(item);
  }

  if (type === "openQuestion") {
    memory.openQuestions.unshift(item);
  }

  if (type === "uncertaintyMinor") {
    memory.uncertainties.unshift({
      ...item,
      level: "mineure",
    });
  }

  if (type === "uncertaintyStructuring") {
    memory.uncertainties.unshift({
      ...item,
      level: "structurante",
    });
  }

  if (type === "uncertaintyCritical") {
    memory.uncertainties.unshift({
      ...item,
      level: "critique",
    });
  }

  if (type === "uncertaintyCategoryShift") {
    memory.uncertainties.unshift({
      ...item,
      level: "change-categorie",
    });
  }

  await writeWorkingMemory(memory);
  return memory;
}

export async function appendDecisionRegisterItem(
  item: DecisionRegisterItem
): Promise<WorkingMemory> {
  const memory = await readWorkingMemory();
  memory.decisionRegister.unshift(item);
  await writeWorkingMemory(memory);
  return memory;
}
