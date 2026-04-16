import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentRunRecord } from "./types";

const historyPath = path.join(process.cwd(), "data", "history.json");

export async function readHistory(): Promise<AgentRunRecord[]> {
  try {
    const content = await readFile(historyPath, "utf8");
    return JSON.parse(content) as AgentRunRecord[];
  } catch {
    return [];
  }
}

export async function appendHistory(record: AgentRunRecord) {
  const history = await readHistory();
  history.unshift(record);
  await writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");
}

