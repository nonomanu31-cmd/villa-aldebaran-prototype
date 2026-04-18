import { NextResponse } from "next/server";
import { readHistory } from "../../../lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const history = await readHistory();
  return NextResponse.json({ history });
}
