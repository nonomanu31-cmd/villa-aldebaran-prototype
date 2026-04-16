import { get, put } from "@vercel/blob";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const blobAccess = process.env.BLOB_STORE_ACCESS === "public" ? "public" : "private";

type StoredValueResult<T> = {
  found: boolean;
  value: T;
};

function canUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobJson<T>(
  pathname: string,
  fallback: T
): Promise<StoredValueResult<T>> {
  if (!canUseBlobStorage()) {
    return { found: false, value: fallback };
  }

  try {
    const result = await get(pathname, {
      access: blobAccess,
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return { found: false, value: fallback };
    }

    const content = await new Response(result.stream).text();
    return { found: true, value: JSON.parse(content) as T };
  } catch (error) {
    console.warn(`Blob read unavailable for ${pathname}.`, error);
    return { found: false, value: fallback };
  }
}

async function writeBlobJson<T>(pathname: string, value: T) {
  if (!canUseBlobStorage()) {
    return false;
  }

  try {
    await put(pathname, JSON.stringify(value, null, 2), {
      access: blobAccess,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return true;
  } catch (error) {
    console.warn(`Blob write unavailable for ${pathname}.`, error);
    return false;
  }
}

async function readLocalJson<T>(
  filePath: string,
  fallback: T
): Promise<StoredValueResult<T>> {
  try {
    const content = await readFile(filePath, "utf8");
    return { found: true, value: JSON.parse(content) as T };
  } catch {
    return { found: false, value: fallback };
  }
}

async function writeLocalJson<T>(filePath: string, value: T) {
  try {
    await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
    return true;
  } catch (error) {
    console.warn(`Local write unavailable for ${filePath}.`, error);
    return false;
  }
}

export function resolveDataFile(filename: string) {
  return path.join(process.cwd(), "data", filename);
}

export async function readPersistedJson<T>(
  blobPathname: string,
  localFilePath: string,
  fallback: T
): Promise<T> {
  const blobResult = await readBlobJson(blobPathname, fallback);

  if (blobResult.found) {
    return blobResult.value;
  }

  const localResult = await readLocalJson(localFilePath, fallback);
  return localResult.value;
}

export async function writePersistedJson<T>(
  blobPathname: string,
  localFilePath: string,
  value: T
) {
  const blobWritten = await writeBlobJson(blobPathname, value);
  const localWritten = await writeLocalJson(localFilePath, value);

  if (!blobWritten && !localWritten) {
    console.warn(`No persistence backend accepted write for ${blobPathname}.`);
  }
}
