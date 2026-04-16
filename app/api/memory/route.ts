import { NextResponse } from "next/server";
import {
  appendMemoryItem,
  readWorkingMemory,
  updateActiveContext,
  type MemoryItemType,
} from "../../../lib/memory";

export async function GET() {
  const memory = await readWorkingMemory();
  return NextResponse.json({ memory });
}

export async function POST(request: Request) {
  const body = (await request.json()) as
    | {
        action: "setContext";
        activeContext: string;
      }
    | {
        action: "capture";
        type: MemoryItemType;
        title: string;
        content: string;
        sourceAgentId: string;
      };

  if (body.action === "setContext") {
    const memory = await updateActiveContext(body.activeContext);
    return NextResponse.json({ memory });
  }

  if (body.action === "capture") {
    const memory = await appendMemoryItem(body.type, {
      id: crypto.randomUUID(),
      title: body.title,
      content: body.content,
      sourceAgentId: body.sourceAgentId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ memory });
  }

  return NextResponse.json({ error: "Action memoire inconnue." }, { status: 400 });
}

