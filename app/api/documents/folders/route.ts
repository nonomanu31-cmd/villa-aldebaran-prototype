import { NextResponse } from "next/server";
import { createDocumentFolder, getDocumentFolders } from "../../../../lib/documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const folders = await getDocumentFolders();
  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { label?: string };
    const folder = await createDocumentFolder(body.label ?? "");
    return NextResponse.json({ ok: true, folder });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur creation dossier.",
      },
      { status: 400 }
    );
  }
}
