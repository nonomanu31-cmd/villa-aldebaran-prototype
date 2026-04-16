import type { AgentRunRecord } from "./types";
import { readPersistedJson, resolveDataFile, writePersistedJson } from "./persistence";

const historyPath = resolveDataFile("history.json");
const historyBlobPath = "app-data/history.json";

export async function readHistory(): Promise<AgentRunRecord[]> {
  return readPersistedJson(historyBlobPath, historyPath, []);
}

export async function appendHistory(record: AgentRunRecord) {
  const history = await readHistory();
  history.unshift(record);
  await writePersistedJson(historyBlobPath, historyPath, history);
}
