import { NextResponse } from "next/server";
import { readDocumentContent } from "../../../../lib/documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const document = await readDocumentContent(context.params.id);
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lecture document.",
      },
      { status: 404 }
    );
  }
}
