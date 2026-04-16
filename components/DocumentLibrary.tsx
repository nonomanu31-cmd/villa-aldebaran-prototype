"use client";

import { useEffect, useState } from "react";
import type { DocumentEntry } from "../lib/documents";

type LoadedDocument = DocumentEntry & {
  content: string;
};

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LoadedDocument | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  async function loadDocument(id: string) {
    setLoadingId(id);
    const result = await fetch(`/api/documents/${id}`);
    const data = (await result.json()) as { document?: LoadedDocument };
    setSelectedDocument(data.document ?? null);
    setLoadingId(null);
  }

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>Centre documentaire</h1>
        <p style={styles.text}>
          Documents structurants du systeme, prompts finaux et references prototype.
        </p>
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
              <span style={styles.badge}>
                {loadingId === selectedDocument.id ? "Chargement..." : selectedDocument.category}
              </span>
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
  text: {
    color: "#566072",
    lineHeight: 1.5,
  },
  list: {
    display: "grid",
    gap: 10,
    marginTop: 14,
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
  content: {
    margin: 0,
    whiteSpace: "pre-wrap",
    font: "14px/1.65 Consolas, monospace",
    color: "#243042",
  },
};

