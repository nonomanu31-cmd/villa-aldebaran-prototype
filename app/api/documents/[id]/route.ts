import { NextResponse } from "next/server";
import {
  deleteImportedDocument,
  readDocumentContent,
  resolveImportedDocumentLocation,
} from "../../../../lib/documents";

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

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const importedDocument = await resolveImportedDocumentLocation(context.params.id);

    if (!importedDocument) {
      return NextResponse.json(
        { error: "Seuls les documents importes peuvent etre supprimes." },
        { status: 400 }
      );
    }

    const deleted = await deleteImportedDocument(context.params.id);

    return NextResponse.json({
      ok: true,
      title: deleted.fileName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur suppression document.",
      },
      { status: 500 }
    );
  }
}
