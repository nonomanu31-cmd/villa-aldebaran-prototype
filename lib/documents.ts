import { del, get, list } from "@vercel/blob";
import { readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  readPersistedJson,
  resolveDataFile,
  writePersistedJson,
} from "./persistence";
import { readMeetingReports } from "./meeting-reports";

export type DocumentEntry = {
  id: string;
  title: string;
  category:
    | "prompt"
    | "architecture"
    | "data"
    | "prototype"
    | "registry"
    | "governance"
    | "meeting"
    | "import";
  description: string;
  filePath?: string;
  folderId?: string;
  folderLabel?: string;
  movable?: boolean;
};

export type ImportedDocumentLocation = {
  fileName: string;
  localPath: string;
  blobPath: string;
};

export type DocumentFolder = {
  id: string;
  label: string;
  system?: boolean;
};

type DocumentLibraryState = {
  folders: DocumentFolder[];
  assignments: Record<string, string>;
};

const importsDirectory = path.join(process.cwd(), "data", "imports");
const readableImportExtensions = new Set([".md", ".txt", ".json", ".csv", ".log"]);
const importedDocumentsBlobPrefix = "imports/";
const documentLibraryPath = resolveDataFile("document-library.json");
const documentLibraryBlobPath = "app-data/document-library.json";

const defaultFolders: DocumentFolder[] = [
  { id: "imports-a-trier", label: "A trier", system: true },
  { id: "imports-technique", label: "Technique", system: true },
  { id: "imports-juridique", label: "Juridique", system: true },
  { id: "imports-finances", label: "Finances", system: true },
  { id: "imports-administratif", label: "Administratif", system: true },
  { id: "imports-reunions", label: "Reunions", system: true },
];

const defaultDocumentLibraryState: DocumentLibraryState = {
  folders: defaultFolders,
  assignments: {},
};

export const staticDocuments: DocumentEntry[] = [
  {
    id: "pack-prompts",
    title: "Pack prompts finaux maitre",
    category: "registry",
    description: "Vue d'ensemble des prompts finaux de reference du systeme.",
    filePath: path.join(process.cwd(), "..", "PACK_PROMPTS_FINAUX_MAITRE.md"),
  },
  {
    id: "archi-systeme",
    title: "Architecture systeme multi-agents",
    category: "architecture",
    description: "Document principal d'architecture globale du systeme.",
    filePath: path.join(process.cwd(), "..", "ARCHITECTURE_SYSTEME_MULTI_AGENTS.md"),
  },
  {
    id: "schema-donnees",
    title: "Schema de donnees du systeme",
    category: "data",
    description: "Modele de donnees du systeme multi-agents.",
    filePath: path.join(process.cwd(), "..", "SCHEMA_DONNEES_SYSTEME.md"),
  },
  {
    id: "prompt-maitre-systeme-v2",
    title: "Prompt maitre systeme V2",
    category: "architecture",
    description: "Cadre des deux regimes, matrice commune, non-redondance utile et lecture EKT V3.",
    filePath: path.join(process.cwd(), "..", "PROMPT_MAITRE_SYSTEME_V2.md"),
  },
  {
    id: "registre-textes",
    title: "Registre initial des textes opposables",
    category: "registry",
    description: "Socle des textes reglementaires et juridiques a integrer.",
    filePath: path.join(process.cwd(), "..", "REGISTRE_INITIAL_TEXTES_OPPOSABLES.md"),
  },
  {
    id: "prompt-ekt",
    title: "Prompt final EKT V2",
    category: "prompt",
    description: "Prompt maitre du systeme, lisibilite et arbitrage inter-agents.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_EKT_V2.md"),
  },
  {
    id: "prompt-vie",
    title: "Prompt final Vie V4",
    category: "prompt",
    description: "Jumeau numerique, intelligence spatiale et vulnerabilites.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_VIE_V4.md"),
  },
  {
    id: "prompt-juridique",
    title: "Prompt final Juridique V2",
    category: "prompt",
    description: "Qualification des actions, risques et fenetres normatives.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_JURIDIQUE_REGLEMENTAIRE_V2.md"),
  },
  {
    id: "prompt-administratif",
    title: "Prompt final Administratif",
    category: "prompt",
    description: "Protocoles, emails, demandes et comptes rendus.",
    filePath: path.join(process.cwd(), "..", "PROMPT_FINAL_AGENT_ADMINISTRATIF.md"),
  },
  {
    id: "structure-prototype",
    title: "Structure technique du prototype",
    category: "prototype",
    description: "Architecture minimale du prototype prompts.",
    filePath: path.join(process.cwd(), "..", "STRUCTURE_TECHNIQUE_PROTOTYPE_PROMPTS.md"),
  },
  {
    id: "readme-prototype",
    title: "README prototype",
    category: "prototype",
    description: "Mode d'emploi rapide du prototype courant.",
    filePath: path.join(process.cwd(), "README.md"),
  },
  {
    id: "matrice-acces-internet",
    title: "Matrice d'acces Internet des agents",
    category: "governance",
    description: "Regles d'acces web par agent, niveaux de permission et garde-fous.",
    filePath: path.join(process.cwd(), "..", "MATRICE_ACCES_INTERNET_AGENTS.md"),
  },
  {
    id: "deploiement-web-telephone",
    title: "Deploiement web et telephone",
    category: "governance",
    description: "Feuille de route pour rendre le cockpit accessible partout et installable sur mobile.",
    filePath: path.join(process.cwd(), "..", "DEPLOIEMENT_WEB_TELEPHONE.md"),
  },
];

function buildImportedDocumentId(fileName: string) {
  return `import-${fileName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function slugifyFolderLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function readDocumentLibraryState() {
  const state = await readPersistedJson<DocumentLibraryState>(
    documentLibraryBlobPath,
    documentLibraryPath,
    defaultDocumentLibraryState
  );

  const folders = [...defaultFolders];

  state.folders.forEach((folder) => {
    if (!folders.find((entry) => entry.id === folder.id)) {
      folders.push(folder);
    }
  });

  return {
    folders,
    assignments: state.assignments ?? {},
  };
}

async function writeDocumentLibraryState(state: DocumentLibraryState) {
  await writePersistedJson(documentLibraryBlobPath, documentLibraryPath, state);
}

export async function getDocumentFolders() {
  const state = await readDocumentLibraryState();
  return state.folders;
}

export async function createDocumentFolder(label: string) {
  const cleanLabel = label.trim();

  if (!cleanLabel) {
    throw new Error("Le nom du dossier est vide.");
  }

  const state = await readDocumentLibraryState();
  const existing = state.folders.find(
    (folder) => folder.label.toLowerCase() === cleanLabel.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const baseId = slugifyFolderLabel(cleanLabel) || "dossier";
  let candidateId = `imports-${baseId}`;
  let index = 2;

  while (state.folders.find((folder) => folder.id === candidateId)) {
    candidateId = `imports-${baseId}-${index}`;
    index += 1;
  }

  const folder = {
    id: candidateId,
    label: cleanLabel,
  };

  state.folders.push(folder);
  await writeDocumentLibraryState(state);
  return folder;
}

export async function assignDocumentToFolder(documentId: string, folderId: string) {
  const state = await readDocumentLibraryState();
  const folder = state.folders.find((entry) => entry.id === folderId);

  if (!folder) {
    throw new Error("Dossier introuvable.");
  }

  const location = await resolveImportedDocumentLocation(documentId);

  if (!location) {
    throw new Error("Seuls les documents importes peuvent etre deplaces.");
  }

  state.assignments[documentId] = folderId;
  await writeDocumentLibraryState(state);
  return folder;
}

async function getImportedDocuments(): Promise<DocumentEntry[]> {
  try {
    const entries = await readdir(importsDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        id: buildImportedDocumentId(entry.name),
        title: entry.name,
        category: "import" as const,
        description: "Document importe depuis le dossier data/imports pour nourrir le projet.",
        filePath: path.join(importsDirectory, entry.name),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function getBlobImportedDocuments(): Promise<DocumentEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [];
  }

  try {
    const result = await list({ prefix: importedDocumentsBlobPrefix });

    return result.blobs
      .map((blob) => {
        const fileName = blob.pathname.replace(importedDocumentsBlobPrefix, "");

        return {
          id: buildImportedDocumentId(fileName),
          title: fileName,
          category: "import" as const,
          description: "Document importe via l'application pour nourrir le projet.",
          filePath: blob.pathname,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    console.warn("Blob import list unavailable.", error);
    return [];
  }
}

async function extractContentFromBuffer(buffer: Buffer, fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (readableImportExtensions.has(extension)) {
    return buffer.toString("utf8");
  }

  if (extension === ".docx") {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default ?? mammothModule;
    const result = await mammoth.extractRawText({ buffer });

    return [
      result.value.trim() || "Aucun texte exploitable n'a ete extrait du fichier DOCX.",
      ...(result.messages?.length
        ? [
            "",
            "Messages d'extraction :",
            ...result.messages.map((message) => `- ${message.type} : ${message.message}`),
          ]
        : []),
    ].join("\n");
  }

  if (extension === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text?.trim() || "Aucun texte exploitable n'a ete extrait du PDF.";
    } finally {
      await parser.destroy();
    }
  }

  return [
    `Le fichier ${fileName} est bien reference dans le projet.`,
    "",
    `Type detecte : ${extension || "inconnu"}`,
    "",
    "Ce prototype lit directement les fichiers texte et extrait maintenant le texte des .pdf et .docx.",
    "Les autres formats binaires doivent encore etre convertis ou traites par une couche d'extraction supplementaire.",
  ].join("\n");
}

async function dedupeImportedDocuments(documents: DocumentEntry[]) {
  const unique = new Map<string, DocumentEntry>();

  documents.forEach((document) => {
    if (!unique.has(document.id)) {
      unique.set(document.id, document);
      return;
    }

    const current = unique.get(document.id);

    if (
      current
      && current.filePath?.startsWith(importedDocumentsBlobPrefix)
      && !document.filePath?.startsWith(importedDocumentsBlobPrefix)
    ) {
      unique.set(document.id, document);
    }
  });

  return Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

async function applyImportedFolder(document: DocumentEntry) {
  const state = await readDocumentLibraryState();
  const folderId = state.assignments[document.id] || "imports-a-trier";
  const folder =
    state.folders.find((entry) => entry.id === folderId)
    || state.folders.find((entry) => entry.id === "imports-a-trier");

  return {
    ...document,
    folderId: folder?.id ?? "imports-a-trier",
    folderLabel: folder?.label ?? "A trier",
    movable: true,
  };
}

export async function resolveImportedDocumentLocation(
  id: string
): Promise<ImportedDocumentLocation | null> {
  const importedDocuments = await dedupeImportedDocuments([
    ...(await getImportedDocuments()),
    ...(await getBlobImportedDocuments()),
  ]);
  const document = importedDocuments.find((entry) => entry.id === id);

  if (!document) {
    return null;
  }

  return {
    fileName: document.title,
    localPath: path.join(importsDirectory, document.title),
    blobPath: `${importedDocumentsBlobPrefix}${document.title}`,
  };
}

export async function deleteImportedDocument(id: string) {
  const location = await resolveImportedDocumentLocation(id);

  if (!location) {
    throw new Error("Document importe introuvable.");
  }

  try {
    await unlink(location.localPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(location.blobPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (!message.toLowerCase().includes("not found")) {
        console.warn(`Blob delete unavailable for ${location.blobPath}.`, error);
      }
    }
  }

  return location;
}

async function extractImportedDocumentContent(filePath: string) {
  if (filePath.startsWith(importedDocumentsBlobPrefix) && process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(filePath, {
      access: process.env.BLOB_STORE_ACCESS === "public" ? "public" : "private",
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Document Blob introuvable.");
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return extractContentFromBuffer(Buffer.from(arrayBuffer), path.basename(filePath));
  }

  const buffer = await readFile(filePath);
  return extractContentFromBuffer(buffer, path.basename(filePath));
}

export async function getDocuments() {
  const meetingReports = await readMeetingReports();
  const importedDocuments = await dedupeImportedDocuments([
    ...(await getImportedDocuments()),
    ...(await getBlobImportedDocuments()),
  ]);
  const enrichedImportedDocuments = await Promise.all(
    importedDocuments.map((document) => applyImportedFolder(document))
  );
  const meetingDocuments: DocumentEntry[] = meetingReports.map((report) => ({
    id: report.id,
    title: report.title,
    category: "meeting",
    description: report.description,
  }));

  return [...enrichedImportedDocuments, ...meetingDocuments, ...staticDocuments];
}

export async function readDocumentContent(id: string) {
  const meetingReports = await readMeetingReports();
  const meetingReport = meetingReports.find((report) => report.id === id);

  if (meetingReport) {
    return {
      id: meetingReport.id,
      title: meetingReport.title,
      category: "meeting" as const,
      description: meetingReport.description,
      content: meetingReport.content,
    };
  }

  const importedDocuments = await dedupeImportedDocuments([
    ...(await getImportedDocuments()),
    ...(await getBlobImportedDocuments()),
  ]);
  const enrichedImportedDocuments = await Promise.all(
    importedDocuments.map((document) => applyImportedFolder(document))
  );
  const document =
    enrichedImportedDocuments.find((entry) => entry.id === id)
    || staticDocuments.find((entry) => entry.id === id);

  if (!document || !document.filePath) {
    throw new Error("Document introuvable.");
  }

  const content = await extractImportedDocumentContent(document.filePath);

  return {
    ...document,
    content,
  };
}
