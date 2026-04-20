"use client";

import Link from "next/link";

type WorkspaceTabsProps = {
  active: "cockpit" | "gantt" | "history" | "documents";
};

const tabs = [
  { id: "cockpit", href: "/cockpit", label: "Cockpit" },
  { id: "gantt", href: "/gantt", label: "Gantt" },
  { id: "history", href: "/history", label: "Historique" },
  { id: "documents", href: "/documents", label: "Centre documentaire" },
] as const;

export function WorkspaceTabs({ active }: WorkspaceTabsProps) {
  return (
    <nav style={styles.nav} aria-label="Navigation principale du prototype">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          style={tab.id === active ? styles.linkActive : styles.link}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  link: {
    display: "inline-block",
    padding: "9px 13px",
    borderRadius: 999,
    textDecoration: "none",
    background: "#ffffff",
    color: "#1d2433",
    border: "1px solid rgba(31,40,55,0.12)",
    fontWeight: 700,
    fontSize: 13,
  },
  linkActive: {
    display: "inline-block",
    padding: "9px 13px",
    borderRadius: 999,
    textDecoration: "none",
    background: "#1f4b3f",
    color: "#ffffff",
    border: "1px solid rgba(31,75,63,0.16)",
    fontWeight: 700,
    fontSize: 13,
  },
};
