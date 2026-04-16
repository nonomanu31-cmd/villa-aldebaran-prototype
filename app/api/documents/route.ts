import { NextResponse } from "next/server";
import { documents } from "../../../lib/documents";

export async function GET() {
  return NextResponse.json({ documents });
}

