import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type MemoryItemType = "decision" | "alert" | "openQuestion";

export type MemoryItem = {
  id: string;
  title: string;
  content: string;
  sourceAgentId: string;
  createdAt: string;
};

export type WorkingMemory = {
  activeContext: string;
  decisions: MemoryItem[];
  alerts: MemoryItem[];
  openQuestions: MemoryItem[];
};

const memoryPath = path.join(process.cwd(), "data", "working-memory.json");

const emptyMemory: WorkingMemory = {
  activeContext: "Villa Aldebaran - memoire de travail initiale.",
  decisions: [],
  alerts: [],
  openQuestions: [],
};

export async function readWorkingMemory(): Promise<WorkingMemory> {
  try {
    const content = await readFile(memoryPath, "utf8");
    return JSON.parse(content) as WorkingMemory;
  } catch {
    return emptyMemory;
  }
}

export async function writeWorkingMemory(memory: WorkingMemory) {
  await writeFile(memoryPath, JSON.stringify(memory, null, 2), "utf8");
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

  await writeWorkingMemory(memory);
  return memory;
}

