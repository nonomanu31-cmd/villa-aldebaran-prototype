import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier recu." }, { status: 400 });
    }

    const fileName = sanitizeFileName(file.name || "document-importe");

    if (!fileName) {
      return NextResponse.json({ error: "Nom de fichier invalide." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const localDirectory = path.join(process.cwd(), "data", "imports");
    const localPath = path.join(localDirectory, fileName);

    await mkdir(localDirectory, { recursive: true });
    await writeFile(localPath, buffer);

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await put(`imports/${fileName}`, buffer, {
          access: process.env.BLOB_STORE_ACCESS === "public" ? "public" : "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: file.type || undefined,
        });
      } catch (error) {
        console.warn(`Blob upload unavailable for ${fileName}.`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      fileName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant l'import du document.",
      },
      { status: 500 }
    );
  }
}
