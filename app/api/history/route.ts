import { NextResponse } from "next/server";
import { readHistory } from "../../../lib/storage";

export async function GET() {
  const history = await readHistory();
  return NextResponse.json({ history });
}

