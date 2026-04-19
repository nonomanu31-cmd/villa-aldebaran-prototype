"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DocumentEntry } from "../lib/documents";

type LoadedDocument = DocumentEntry & {
  content: string;
};

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LoadedDocument | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      const result = await fetch("/api/documents");
      const data = (await result.json()) as { documents: DocumentEntry[] };
      setDocuments(data.documents);
      if (data.documents[0]) {
        await loadDocument(data.documents[0].id);
      }
    }

    void loadDocuments();
  }, []);

  async function loadDocuments() {
    const result = await fetch("/api/documents");
    const data = (await result.json()) as { documents: DocumentEntry[] };
    setDocuments(data.documents);
    return data.documents;
  }

  async function loadDocument(id: string) {
    setLoadingId(id);
    const result = await fetch(`/api/documents/${id}`);
    const data = (await result.json()) as { document?: LoadedDocument };
    setSelectedDocument(data.document ?? null);
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
        <div style={styles.list}>
          {documents.map((document) => {
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
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    style={isDeleting ? styles.deleteButtonDisabled : styles.deleteButton}
                  >
                    {isDeleting ? "Suppression..." : "Supprimer ce document"}
                  </button>
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
  item: {
    textAlign: "left",
    borderRadius: 16,
    border: "1px solid rgba(31,40,55,0.08)",
    padding: 14,
    cursor: "pointer",
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
