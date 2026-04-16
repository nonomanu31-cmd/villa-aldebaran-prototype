import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPrompt(promptFile: string) {
  const filePath = path.join(process.cwd(), "prompts", promptFile);
  return readFile(filePath, "utf8");
}

