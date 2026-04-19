"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DocumentEntry, DocumentFolder } from "../lib/documents";

type LoadedDocument = DocumentEntry & {
  content: string;
};

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LoadedDocument | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newFolderLabel, setNewFolderLabel] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState("all");
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      const result = await fetch("/api/documents");
      const data = (await result.json()) as {
        documents: DocumentEntry[];
        folders: DocumentFolder[];
      };
      setDocuments(data.documents);
      setFolders(data.folders);
      if (data.documents[0]) {
        await loadDocument(data.documents[0].id);
      }
    }

    void loadDocuments();
  }, []);

  async function loadDocuments() {
    const result = await fetch("/api/documents");
    const data = (await result.json()) as {
      documents: DocumentEntry[];
      folders: DocumentFolder[];
    };
    setDocuments(data.documents);
    setFolders(data.folders);
    return data.documents;
  }

  async function loadDocument(id: string) {
    setLoadingId(id);
    const result = await fetch(`/api/documents/${id}`);
    const data = (await result.json()) as { document?: LoadedDocument };
    setSelectedDocument(data.document ?? null);
    setTargetFolderId(data.document?.folderId ?? "");
    setLoadingId(null);
  }

  async function handleUpload() {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadStatus("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await result.json()) as { ok?: boolean; error?: string };

      if (!result.ok || !data.ok) {
        throw new Error(data.error || "L'import du document a echoue.");
      }

      const refreshedDocuments = await loadDocuments();
      const importedDocument = refreshedDocuments.find((entry) => entry.title === file.name);

      if (importedDocument) {
        await loadDocument(importedDocument.id);
      }

      setUploadStatus(`Import termine : ${file.name}`);
      setFile(null);
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : "Erreur inconnue pendant l'import."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedDocument || selectedDocument.category !== "import" || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer le document "${selectedDocument.title}" ?`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setUploadStatus("");

    try {
      const result = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "DELETE",
      });
      const data = (await result.json()) as { ok?: boolean; error?: string; title?: string };

      if (!result.ok || !data.ok) {
        throw new Error(data.error || "La suppression du document a echoue.");
      }

      const refreshedDocuments = await loadDocuments();

      const nextDocument =
        refreshedDocuments.find((entry) => entry.id !== selectedDocument.id) ?? null;

      if (nextDocument) {
        await loadDocument(nextDocument.id);
      } else {
        setSelectedDocument(null);
      }

      setUploadStatus(`Document supprime : ${data.title || selectedDocument.title}`);
      setFile(null);
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : "Erreur inconnue pendant la suppression."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderLabel.trim() || isCreatingFolder) {
      return;
    }

    setIsCreatingFolder(true);
    setUploadStatus("");

    try {
      const result = await fetch("/api/documents/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newFolderLabel.trim(),
        }),
      });
      const data = (await result.json()) as {
        ok?: boolean;
        error?: string;
        folder?: DocumentFolder;
      };

      if (!result.ok || !data.ok || !data.folder) {
        throw new Error(data.error || "La creation du dossier a echoue.");
      }

      const refreshedDocuments = await loadDocuments();
      setNewFolderLabel("");
      setTargetFolderId(data.folder.id);
      setUploadStatus(`Dossier cree : ${data.folder.label}`);

      if (selectedDocument) {
        const refreshedSelected = refreshedDocuments.find(
          (entry) => entry.id === selectedDocument.id
        );

        if (refreshedSelected) {
          setSelectedDocument((current) =>
            current
              ? {
                  ...current,
                  folderId: refreshedSelected.folderId,
                  folderLabel: refreshedSelected.folderLabel,
                }
              : current
          );
        }
      }
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : "Erreur creation dossier."
      );
    } finally {
      setIsCreatingFolder(false);
    }
  }

  async function handleMoveSelected() {
    if (
      !selectedDocument
      || selectedDocument.category !== "import"
      || !targetFolderId
      || isMoving
    ) {
      return;
    }

    setIsMoving(true);
    setUploadStatus("");

    try {
      const result = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: targetFolderId,
        }),
      });
      const data = (await result.json()) as {
        ok?: boolean;
        error?: string;
        folder?: DocumentFolder;
      };

      if (!result.ok || !data.ok || !data.folder) {
        throw new Error(data.error || "Le deplacement du document a echoue.");
      }

      await loadDocuments();
      await loadDocument(selectedDocument.id);
      setUploadStatus(`Document deplace vers : ${data.folder.label}`);
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : "Erreur deplacement document."
      );
    } finally {
      setIsMoving(false);
    }
  }

  const filteredDocuments = documents.filter((document) => {
    if (selectedFolderFilter === "all") {
      return true;
    }

    if (document.category !== "import") {
      return false;
    }

    return document.folderId === selectedFolderFilter;
  });

  useEffect(() => {
    if (filteredDocuments.length === 0) {
      setSelectedDocument(null);
      setTargetFolderId("");
      return;
    }

    if (!selectedDocument || !filteredDocuments.find((entry) => entry.id === selectedDocument.id)) {
      void loadDocument(filteredDocuments[0].id);
    }
  }, [selectedFolderFilter, documents]);

  const importFolderCounts = folders.reduce<Record<string, number>>((counts, folder) => {
    counts[folder.id] = documents.filter(
      (document) => document.category === "import" && document.folderId === folder.id
    ).length;
    return counts;
  }, {});

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.topLinks}>
          <Link href="/cockpit" style={styles.topLink}>
            Cockpit
          </Link>
          <Link href="/history" style={styles.topLink}>
            Historique
          </Link>
        </div>
        <h1 style={styles.title}>Centre documentaire</h1>
        <p style={styles.text}>
          Documents structurants du systeme, imports projet, prompts finaux, references prototype et comptes rendus de reunion.
        </p>
        <div style={styles.uploadCard}>
          <strong style={styles.uploadTitle}>Importer un document</strong>
          <p style={styles.uploadText}>
            PDF, DOCX, TXT, MD, JSON, CSV et LOG.
          </p>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={styles.fileInput}
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={!file || isUploading ? styles.uploadButtonDisabled : styles.uploadButton}
          >
            {isUploading ? "Import en cours..." : "Importer le fichier"}
          </button>
          <p style={styles.uploadStatus}>
            {uploadStatus || (file ? `Pret a importer : ${file.name}` : "Aucun fichier selectionne.")}
          </p>
        </div>
        <div style={styles.uploadCard}>
          <strong style={styles.uploadTitle}>Organisation documentaire</strong>
          <p style={styles.uploadText}>
            Creez vos dossiers, filtrez la liste et classez vos fichiers importes pour garder un centre documentaire propre.
          </p>
          <div style={styles.organisationHint}>
            Cette zone sert a ranger les documents importes. Les dossiers de base sont deja prets.
          </div>
          <div style={styles.folderCreateRow}>
            <input
              type="text"
              value={newFolderLabel}
              onChange={(event) => setNewFolderLabel(event.target.value)}
              placeholder="Nom du dossier"
              style={styles.folderInput}
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderLabel.trim() || isCreatingFolder}
              style={
                !newFolderLabel.trim() || isCreatingFolder
                  ? styles.uploadButtonDisabled
                  : styles.uploadButton
              }
            >
              {isCreatingFolder ? "Creation..." : "Creer"}
            </button>
          </div>
          <div style={styles.folderList}>
            <button
              type="button"
              onClick={() => setSelectedFolderFilter("all")}
              style={{
                ...styles.folderChip,
                ...(selectedFolderFilter === "all" ? styles.folderChipActive : {}),
              }}
            >
              Tous les documents
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderFilter(folder.id)}
                style={{
                  ...styles.folderChip,
                  ...(selectedFolderFilter === folder.id ? styles.folderChipActive : {}),
                }}
              >
                {folder.label} ({importFolderCounts[folder.id] ?? 0})
              </button>
            ))}
          </div>
        </div>
        <div style={styles.listHeader}>
          <strong style={styles.listHeaderTitle}>
            {selectedFolderFilter === "all" ? "Documents visibles" : "Documents du dossier"}
          </strong>
          <span style={styles.listHeaderCount}>{filteredDocuments.length}</span>
        </div>
        <div style={styles.list}>
          {filteredDocuments.length === 0 ? (
            <div style={styles.emptyListCard}>
              Aucun document visible dans cette vue pour l'instant.
            </div>
          ) : null}
          {filteredDocuments.map((document) => {
            const selected = selectedDocument?.id === document.id;
            return (
              <button
                key={document.id}
                type="button"
                onClick={() => loadDocument(document.id)}
                style={{
                  ...styles.item,
                  background: selected ? "#e8f1ea" : "#fff",
                  borderColor: selected
                    ? "rgba(31,75,63,0.24)"
                    : "rgba(31,40,55,0.08)",
                }}
              >
                <strong style={styles.itemTitle}>{document.title}</strong>
                <p style={styles.itemCategory}>{document.category}</p>
                {document.folderLabel ? (
                  <p style={styles.itemFolder}>Dossier : {document.folderLabel}</p>
                ) : null}
                <p style={styles.itemText}>{document.description}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section style={styles.viewer}>
        {selectedDocument ? (
          <>
            <div style={styles.viewerHeader}>
              <div>
                <h2 style={styles.viewerTitle}>{selectedDocument.title}</h2>
                <p style={styles.viewerMeta}>{selectedDocument.description}</p>
              </div>
              <div style={styles.viewerHeaderActions}>
                <span style={styles.badge}>
                  {loadingId === selectedDocument.id ? "Chargement..." : selectedDocument.category}
                </span>
                {selectedDocument.category === "import" ? (
                  <>
                    <div style={styles.moveCard}>
                      <strong style={styles.moveTitle}>
                        Dossier actuel : {selectedDocument.folderLabel || "A trier"}
                      </strong>
                      <div style={styles.moveRow}>
                        <select
                          value={targetFolderId}
                          onChange={(event) => setTargetFolderId(event.target.value)}
                          style={styles.moveSelect}
                        >
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleMoveSelected}
                          disabled={!targetFolderId || isMoving}
                          style={
                            !targetFolderId || isMoving
                              ? styles.uploadButtonDisabled
                              : styles.uploadButton
                          }
                        >
                          {isMoving ? "Deplacement..." : "Deplacer"}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      style={isDeleting ? styles.deleteButtonDisabled : styles.deleteButton}
                    >
                      {isDeleting ? "Suppression..." : "Supprimer ce document"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <pre style={styles.content}>{selectedDocument.content}</pre>
          </>
        ) : (
          <p style={styles.text}>Aucun document charge.</p>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 16,
    padding: 16,
    background: "#f4f1ea",
  },
  sidebar: {
    background: "#fffdf8",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(31,40,55,0.08)",
  },
  title: {
    margin: 0,
    color: "#1d2433",
  },
  topLinks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  topLink: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    textDecoration: "none",
    background: "#eef5f0",
    color: "#1f4b3f",
    border: "1px solid rgba(31,75,63,0.12)",
    fontWeight: 700,
  },
  text: {
    color: "#566072",
    lineHeight: 1.5,
  },
  list: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  listHeaderTitle: {
    color: "#1d2433",
  },
  listHeaderCount: {
    borderRadius: 999,
    background: "#eef5f0",
    color: "#1f4b3f",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  uploadCard: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    background: "#f8f7f4",
    padding: 14,
    display: "grid",
    gap: 8,
  },
  uploadTitle: {
    color: "#1d2433",
  },
  uploadText: {
    margin: 0,
    color: "#566072",
    lineHeight: 1.5,
    fontSize: 14,
  },
  fileInput: {
    font: "inherit",
  },
  uploadButton: {
    border: 0,
    borderRadius: 999,
    padding: "10px 14px",
    background: "#1f4b3f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  uploadButtonDisabled: {
    border: 0,
    borderRadius: 999,
    padding: "10px 14px",
    background: "#d7ddd8",
    color: "#6a6f79",
    cursor: "not-allowed",
    fontWeight: 700,
  },
  uploadStatus: {
    margin: 0,
    color: "#566072",
    lineHeight: 1.5,
    fontSize: 13,
  },
  folderCreateRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
  },
  folderInput: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: "10px 12px",
    font: "inherit",
    background: "#fff",
  },
  folderList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  organisationHint: {
    borderRadius: 12,
    background: "#eef5f0",
    color: "#1f4b3f",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.5,
    border: "1px solid rgba(31,75,63,0.12)",
  },
  folderChip: {
    borderRadius: 999,
    border: "1px solid rgba(31,40,55,0.08)",
    padding: "8px 12px",
    background: "#fff",
    color: "#324055",
    cursor: "pointer",
    fontWeight: 700,
  },
  folderChipActive: {
    background: "#e8f1ea",
    color: "#1f4b3f",
    borderColor: "rgba(31,75,63,0.18)",
  },
  item: {
    textAlign: "left",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    padding: 14,
    cursor: "pointer",
  },
  emptyListCard: {
    borderRadius: 16,
    border: "1px dashed rgba(31,40,55,0.18)",
    background: "#fff",
    padding: 14,
    color: "#566072",
    lineHeight: 1.5,
  },
  itemTitle: {
    color: "#1d2433",
  },
  itemCategory: {
    margin: "6px 0",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1f4b3f",
  },
  itemText: {
    margin: 0,
    color: "#566072",
    lineHeight: 1.5,
  },
  itemFolder: {
    margin: "0 0 6px",
    color: "#1f4b3f",
    lineHeight: 1.4,
    fontWeight: 700,
    fontSize: 13,
  },
  viewer: {
    background: "#fff",
    borderRadius: 20,
    padding: 18,
    border: "1px solid rgba(31,40,55,0.08)",
    overflow: "auto",
  },
  viewerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  viewerHeaderActions: {
    display: "grid",
    gap: 8,
    justifyItems: "end",
    minWidth: 260,
  },
  viewerTitle: {
    margin: 0,
    color: "#1d2433",
  },
  viewerMeta: {
    margin: "8px 0 0",
    color: "#566072",
  },
  badge: {
    borderRadius: 999,
    background: "#edf2f7",
    padding: "8px 12px",
    color: "#324055",
    fontSize: 13,
  },
  moveCard: {
    borderRadius: 14,
    border: "1px solid rgba(31,40,55,0.08)",
    background: "#f8f7f4",
    padding: 12,
    display: "grid",
    gap: 8,
    width: "100%",
  },
  moveTitle: {
    color: "#1d2433",
    fontSize: 13,
  },
  moveRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
  },
  moveSelect: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(31,40,55,0.12)",
    padding: "10px 12px",
    font: "inherit",
    background: "#fff",
  },
  deleteButton: {
    border: "1px solid rgba(164, 42, 42, 0.18)",
    borderRadius: 999,
    padding: "10px 14px",
    background: "#fff1f1",
    color: "#8f1f1f",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButtonDisabled: {
    border: "1px solid rgba(31,40,55,0.08)",
    borderRadius: 999,
    padding: "10px 14px",
    background: "#f1f3f5",
    color: "#7b818b",
    cursor: "not-allowed",
    fontWeight: 700,
  },
  content: {
    margin: 0,
    whiteSpace: "pre-wrap",
    font: "14px/1.65 Consolas, monospace",
    color: "#243042",
  },
};
