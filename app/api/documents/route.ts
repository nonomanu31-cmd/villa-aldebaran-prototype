import { NextResponse } from "next/server";
import { getDocuments } from "../../../lib/documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const documents = await getDocuments();
  return NextResponse.json({ documents });
}
