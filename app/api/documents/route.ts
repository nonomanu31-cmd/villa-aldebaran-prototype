import { NextResponse } from "next/server";
import { getDocuments } from "../../../lib/documents";

export async function GET() {
  const documents = await getDocuments();
  return NextResponse.json({ documents });
}
