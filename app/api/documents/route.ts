import { NextResponse } from "next/server";
import { getDocumentFolders, getDocuments } from "../../../lib/documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const documents = await getDocuments();
  const folders = await getDocumentFolders();
  return NextResponse.json({ documents, folders });
}
