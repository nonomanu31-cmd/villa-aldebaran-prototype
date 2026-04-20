"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkspaceTabs } from "../../components/WorkspaceTabs";
import {
  ganttStatusColors,
  ganttStatusLabels,
  type EktDecisionLog,
  type GanttCriticality,
  type GanttFocus,
  type GanttMode,
  type GanttStatus,
  type GanttTask,
  findDependencyTask,
  formatDate,
  formatDateLong,
  getExecutionReason,
  getTaskDuration,
  getUniqueAgents,
  isExecutable,
  isIrreversible,
  isMilestone,
  parseIsoDate,
} from "../../lib/ekt-gantt";

type Period = { key: string; label: string; note: string; start: Date; end: Date };

const statusOptions: Array<GanttStatus | "all"> = [
  "all",
  "a-instruire",
  "pret-a-decider",
  "bloque",
  "en-execution",
  "clos",
  "non-reouvrable",
];

const criticalityOptions: Array<GanttCriticality | "all"> = [
  "all",
  "faible",
  "moyenne",
  "haute",
  "critique",
];

const focusLabels: Record<GanttFocus, string> = {
  all: "Tout",
  blocked: "Bloquees",
  critical: "Critiques",
  emmanuel: "Decision Emmanuel",
  missing: "Donnees manquantes",
  irreversible: "Non reouvrables",
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() + (day === 0 ? -6 : 1 - day));
  next.setHours(12, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
}

function buildPeriods(mode: GanttMode, projectStart: string) {
  const base = parseIsoDate(projectStart);
  const periods: Period[] = [];
  const count = mode === "week" ? 14 : 8;

  for (let index = 0; index < count; index += 1) {
    if (mode === "week") {
      const start = addDays(startOfWeek(base), index * 7);
      periods.push({
        key: `w-${index}`,
        label: `S${index + 1}`,
        note: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(start),
        start,
        end: addDays(start, 6),
      });
    } else {
      const start = addMonths(startOfMonth(base), index);
      periods.push({
        key: `m-${index}`,
        label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(start),
        note: new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(start),
        start,
        end: endOfMonth(start),
      });
    }
  }

  return periods;
}

function inPeriod(date: Date, period: Period) {
  return date >= period.start && date <= period.end;
}

function overlaps(task: GanttTask, period: Period) {
  const start = parseIsoDate(task.dateDebutPrevue);
  const end = parseIsoDate(task.dateFinPrevue);
  return start <= period.end && end >= period.start;
}

function milestoneInPeriod(task: GanttTask, period: Period) {
  return isMilestone(task) && inPeriod(parseIsoDate(task.dateDebutPrevue), period);
}

function criticalityLabel(value: GanttCriticality) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sticky(left: number, width: number, selected: boolean, goulot: boolean, center = false) {
  return {
    position: "sticky" as const,
    left,
    zIndex: 2,
    width,
    minWidth: width,
    padding: "10px 12px",
    borderBottom: "1px solid rgba(31,40,55,0.08)",
    borderRight: "1px solid rgba(31,40,55,0.08)",
    verticalAlign: "top" as const,
    textAlign: center ? ("center" as const) : ("left" as const),
    background: selected ? "#fff8ec" : goulot ? "#fffbeb" : "#ffffff",
  };
}

type GanttClientProps = {
  initialTasks: GanttTask[];
  initialDecisions: EktDecisionLog[];
  projectStart: string;
  sourceLabel: string;
};

export function GanttClient({
  initialTasks,
  initialDecisions,
  projectStart,
  sourceLabel,
}: GanttClientProps) {
  const [compact, setCompact] = useState(false);
  const [mode, setMode] = useState<GanttMode>("week");
  const [status, setStatus] = useState<GanttStatus | "all">("all");
  const [agent, setAgent] = useState("all");
  const [criticality, setCriticality] = useState<GanttCriticality | "all">("all");
  const [focus, setFocus] = useState<GanttFocus>("all");
  const [selectedId, setSelectedId] = useState(initialTasks[0]?.id ?? "");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1260px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const periods = buildPeriods(mode, projectStart);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const tasks = initialTasks.filter((task) => {
    if (status !== "all" && task.statut !== status) return false;
    if (agent !== "all" && task.agentSource !== agent) return false;
    if (criticality !== "all" && task.niveauCriticite !== criticality) return false;
    if (focus === "blocked" && !task.blocage) return false;
    if (focus === "critical" && task.niveauCriticite !== "critique") return false;
    if (focus === "emmanuel" && task.decisionEmmanuel !== "ouverte") return false;
    if (focus === "missing" && !task.donneeManquante) return false;
    if (focus === "irreversible" && !isIrreversible(task)) return false;
    return true;
  });

  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0] ?? initialTasks[0] ?? null;
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const counts = {
    blocked: tasks.filter((task) => task.blocage).length,
    critical: tasks.filter((task) => task.niveauCriticite === "critique").length,
    emmanuel: tasks.filter((task) => task.decisionEmmanuel === "ouverte").length,
    missing: tasks.filter((task) => Boolean(task.donneeManquante)).length,
    irreversible: tasks.filter((task) => isIrreversible(task)).length,
  };

  return (
    <main style={{ minHeight: "100vh", padding: compact ? 16 : 20, display: "grid", gap: 16, background: "linear-gradient(180deg, #edf2ec 0%, #f4f1ea 36%, #f2eee6 100%)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: compact ? "flex-start" : "center", flexDirection: compact ? "column" : "row", gap: 16, padding: "18px 20px", borderRadius: 22, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(31,40,55,0.08)", boxShadow: "0 10px 24px rgba(31,40,55,0.06)" }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <WorkspaceTabs active="gantt" />
          </div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#68736b" }}>Villa Aldebaran</p>
          <h1 style={{ margin: "6px 0 4px", fontSize: 28, lineHeight: 1.05, color: "#1d2433" }}>Vue Gantt EKT</h1>
          <p style={{ margin: 0, color: "#465366", lineHeight: 1.55 }}>Version web de pilotage decisionnel : blocages, dependances, goulots et arbitrages Emmanuel visibles en premier.</p>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 13 }}>Source active : {sourceLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-block", padding: "10px 14px", borderRadius: 999, background: "#fff", color: "#1d2433", textDecoration: "none", border: "1px solid rgba(31,40,55,0.12)", fontWeight: 700 }}>Accueil</Link>
        </div>
      </header>

      <section style={{ display: "grid", gap: 14, padding: 16, borderRadius: 22, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(31,40,55,0.08)" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "end", flexDirection: compact ? "column" : "row" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Affichage</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setMode("week")} style={{ border: "1px solid rgba(31,75,63,0.12)", borderRadius: 999, padding: "10px 14px", background: mode === "week" ? "#1f4b3f" : "#fff", color: mode === "week" ? "#fff" : "#243042", cursor: "pointer", fontWeight: 700 }}>Semaine</button>
              <button type="button" onClick={() => setMode("month")} style={{ border: "1px solid rgba(31,75,63,0.12)", borderRadius: 999, padding: "10px 14px", background: mode === "month" ? "#1f4b3f" : "#fff", color: mode === "month" ? "#fff" : "#243042", cursor: "pointer", fontWeight: 700 }}>Mois</button>
            </div>
          </div>
          <FilterSelect label="Statut" value={status} onChange={(value) => setStatus(value as GanttStatus | "all")} options={statusOptions.map((item) => ({ value: item, label: item === "all" ? "Tous" : ganttStatusLabels[item] }))} />
          <FilterSelect label="Agent source" value={agent} onChange={setAgent} options={["all", ...getUniqueAgents(initialTasks)].map((item) => ({ value: item, label: item === "all" ? "Tous" : item }))} />
          <FilterSelect label="Criticite" value={criticality} onChange={(value) => setCriticality(value as GanttCriticality | "all")} options={criticalityOptions.map((item) => ({ value: item, label: item === "all" ? "Toutes" : criticalityLabel(item) }))} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(Object.keys(focusLabels) as GanttFocus[]).map((item) => (
            <button key={item} type="button" onClick={() => setFocus(item)} style={{ border: "1px solid rgba(31,40,55,0.1)", borderRadius: 999, padding: "10px 14px", background: focus === item ? "#eef5f0" : "#f8fafc", color: focus === item ? "#1f4b3f" : "#334155", cursor: "pointer" }}>
              {focusLabels[item]}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: compact ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MetricCard title="Bloquees" value={counts.blocked} tint="#fee2e2" ink="#991b1b" />
        <MetricCard title="Critiques" value={counts.critical} tint="#ffedd5" ink="#9a3412" />
        <MetricCard title="Decision Emmanuel" value={counts.emmanuel} tint="#dbeafe" ink="#1d4ed8" />
        <MetricCard title="Donnees manquantes" value={counts.missing} tint="#eef2f7" ink="#334155" />
        <MetricCard title="Non reouvrables" value={counts.irreversible} tint="#ede9fe" ink="#6d28d9" />
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: compact ? "1fr" : "minmax(0, 1fr) 360px", alignItems: "start" }}>
        <div style={{ padding: 16, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(31,40,55,0.08)", display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#68736b" }}>Planning visible</p>
              <h2 style={{ margin: "4px 0 0", color: "#1d2433" }}>Lecture operative</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 520, color: "#475569", lineHeight: 1.55, textAlign: "right" }}>{tasks.length} ligne(s) visibles. Une tache dependante non levee reste visible mais n'apparait jamais comme librement executable.</p>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#334155", fontSize: 13 }}>
            {Object.entries(ganttStatusLabels).map(([key, label]) => <span key={key} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><span style={{ width: 16, height: 16, borderRadius: 5, background: ganttStatusColors[key as GanttStatus], display: "inline-block" }} />{label}</span>)}
            <span>◆ Jalon</span>
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: 18, borderRadius: 18, background: "#f8fafc", border: "1px dashed rgba(31,40,55,0.12)", color: "#475569" }}>Aucune ligne ne correspond aux filtres actuels.</div>
          ) : (
            <div style={{ overflow: "auto", borderRadius: 18, border: "1px solid rgba(31,40,55,0.08)", background: "#fff" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1600, width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ ...sticky(0, 320, false, false), zIndex: 4, background: "#243447", color: "#fff" }}>Sujet</th>
                    <th style={{ ...sticky(320, 144, false, false, true), zIndex: 4, background: "#243447", color: "#fff" }}>Statut</th>
                    <th style={{ ...sticky(464, 118, false, false, true), zIndex: 4, background: "#243447", color: "#fff" }}>Resp.</th>
                    <th style={{ ...sticky(582, 116, false, false, true), zIndex: 4, background: "#243447", color: "#fff" }}>Criticite</th>
                    <th style={{ ...sticky(698, 140, false, false), zIndex: 4, background: "#243447", color: "#fff" }}>Dependance</th>
                    <th style={{ ...sticky(838, 140, false, false), zIndex: 4, background: "#243447", color: "#fff" }}>Executable</th>
                    {periods.map((period) => <th key={period.key} style={{ minWidth: 52, width: 52, padding: "10px 6px", background: "#243447", color: "#fff", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.12)", borderRight: "1px solid rgba(255,255,255,0.08)", boxShadow: inPeriod(today, period) ? "inset 2px 0 0 #b91c1c, inset -2px 0 0 #b91c1c" : undefined }}><span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{period.label}</span><span style={{ display: "block", marginTop: 4, fontSize: 11, opacity: 0.8 }}>{period.note}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const current = selected?.id === task.id;
                    const dep = findDependencyTask(task, initialTasks);
                    const free = isExecutable(task, initialTasks);
                    return (
                      <tr key={task.id} onClick={() => setSelectedId(task.id)} style={{ cursor: "pointer" }}>
                        <td style={sticky(0, 320, current, task.goulot)}>
                          <div style={{ display: "grid", gap: 4 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <strong style={{ color: "#1f4b3f", fontSize: 13 }}>{task.id}</strong>
                              {task.goulot ? <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700 }}>Goulot</span> : null}
                            </div>
                            <strong style={{ color: "#1d2433", lineHeight: 1.4 }}>{task.sujet}</strong>
                            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{task.lotDomaine}</p>
                            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{formatDate(task.dateDebutPrevue)} - {formatDate(task.dateFinPrevue)} ({getTaskDuration(task)} j)</p>
                          </div>
                        </td>
                        <td style={sticky(320, 144, current, task.goulot, true)}><StatusChip status={task.statut} /></td>
                        <td style={sticky(464, 118, current, task.goulot, true)}>{task.responsable}</td>
                        <td style={sticky(582, 116, current, task.goulot, true)}><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: task.niveauCriticite === "critique" ? "#fee2e2" : task.niveauCriticite === "haute" ? "#ffedd5" : task.niveauCriticite === "moyenne" ? "#fef3c7" : "#eef2f7", color: task.niveauCriticite === "critique" ? "#991b1b" : task.niveauCriticite === "haute" ? "#9a3412" : task.niveauCriticite === "moyenne" ? "#92400e" : "#475569" }}>{criticalityLabel(task.niveauCriticite)}</span></td>
                        <td style={sticky(698, 140, current, task.goulot)}>{dep ? <div style={{ display: "grid", gap: 4 }}><strong style={{ color: "#1d2433", fontSize: 13 }}>{dep.id}</strong><span style={{ color: "#64748b", fontSize: 12 }}>{ganttStatusLabels[dep.statut]}</span></div> : <span style={{ color: "#64748b", fontSize: 13 }}>Aucune</span>}</td>
                        <td style={sticky(838, 140, current, task.goulot)}><div style={{ display: "grid", gap: 6 }}><span style={{ display: "inline-block", width: "fit-content", padding: "5px 9px", borderRadius: 999, background: free ? "#dcfce7" : "#fee2e2", color: free ? "#166534" : "#991b1b", fontWeight: 700, fontSize: 11 }}>{free ? "Oui" : "Non"}</span><span style={{ color: "#64748b", fontSize: 12 }}>{getExecutionReason(task, initialTasks)}</span></div></td>
                        {periods.map((period) => <td key={`${task.id}-${period.key}`} style={{ minWidth: 52, width: 52, height: 54, textAlign: "center", verticalAlign: "middle", borderBottom: "1px solid rgba(31,40,55,0.08)", borderRight: "1px solid rgba(31,40,55,0.06)", background: overlaps(task, period) ? ganttStatusColors[task.statut] : current ? "#fffdf6" : "#fff", boxShadow: inPeriod(today, period) ? "inset 2px 0 0 #b91c1c, inset -2px 0 0 #b91c1c" : task.goulot && overlaps(task, period) ? "inset 0 0 0 2px rgba(146,64,14,0.95)" : undefined }}>{milestoneInPeriod(task, period) ? <span style={{ display: "inline-block", color: "#111827", fontWeight: 700, fontSize: 16 }}>◆</span> : null}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside style={{ display: "grid", gap: 14, position: compact ? "static" : "sticky", top: 18, alignSelf: "start" }}>
          {selected ? (
            <section style={{ padding: 16, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(31,40,55,0.08)", display: "grid", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#68736b" }}>Fiche active</p>
              <h2 style={{ margin: 0, color: "#1d2433", lineHeight: 1.2 }}>{selected.sujet}</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><StatusChip status={selected.statut} /><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: "#eef2f7", color: "#475569", fontSize: 11, fontWeight: 700 }}>{selected.responsable}</span></div>
              <DetailMini label="Debut prevu" value={formatDateLong(selected.dateDebutPrevue)} />
              <DetailMini label="Fin prevue" value={formatDateLong(selected.dateFinPrevue)} />
              <DetailMini label="Commentaire EKT" value={selected.commentaireEkt} />
              <DetailMini label="Seuil de reprise" value={selected.seuilDeReprise} />
              <DetailMini label="Point de bascule" value={selected.pointDeBascule} />
              <DetailMini label="Donnee manquante" value={selected.donneeManquante || "Aucune"} />
            </section>
          ) : null}

          <section style={{ padding: 16, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(31,40,55,0.08)", display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, color: "#1d2433" }}>Decisions Emmanuel ouvertes</h3>
            {tasks.filter((task) => task.decisionEmmanuel === "ouverte").slice(0, 5).map((task) => (
              <button key={task.id} type="button" onClick={() => setSelectedId(task.id)} style={{ textAlign: "left", padding: 12, borderRadius: 16, background: "#fff8ec", border: "1px solid rgba(146,64,14,0.12)", cursor: "pointer", display: "grid", gap: 4 }}>
                <strong style={{ color: "#1d2433", fontSize: 13 }}>{task.id}</strong>
                <span style={{ color: "#243042", fontSize: 14, lineHeight: 1.45 }}>{task.sujet}</span>
                <span style={{ color: "#92400e", fontSize: 12 }}>{task.pointDeBascule}</span>
              </button>
            ))}
          </section>

          <section style={{ padding: 16, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(31,40,55,0.08)", display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, color: "#1d2433" }}>Journal d'arbitrage</h3>
            {initialDecisions.map((decision) => (
              <article key={`${decision.date}-${decision.sujet}`} style={{ padding: 12, borderRadius: 16, background: "#fbfbfa", border: "1px solid rgba(31,40,55,0.06)", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <strong style={{ color: "#1d2433", fontSize: 13 }}>{decision.sujet}</strong>
                  <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(decision.date)}</span>
                </div>
                <p style={{ margin: 0, color: "#243042", fontSize: 14, lineHeight: 1.5 }}>{decision.decision}</p>
                <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>{decision.notes}</p>
              </article>
            ))}
          </section>
        </aside>
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "grid", gap: 8, minWidth: 180 }}>
      <span style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <select style={{ borderRadius: 14, border: "1px solid rgba(31,40,55,0.12)", background: "#fff", color: "#1d2433", padding: "11px 12px" }} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function MetricCard({ title, value, tint, ink }: { title: string; value: number; tint: string; ink: string }) {
  return (
    <article style={{ padding: 16, borderRadius: 20, border: "1px solid rgba(31,40,55,0.06)", display: "grid", gap: 8, background: tint }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ink }}>{title}</p>
      <strong style={{ fontSize: 30, lineHeight: 1, color: ink }}>{value}</strong>
    </article>
  );
}

function DetailMini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 16, background: "#fbfbfa", border: "1px solid rgba(31,40,55,0.06)", display: "grid", gap: 6 }}>
      <span style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <p style={{ margin: 0, color: "#243042", lineHeight: 1.55, fontSize: 14 }}>{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: GanttStatus }) {
  return (
    <span style={{ display: "inline-block", padding: "7px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: ganttStatusColors[status], color: status === "a-instruire" ? "#243042" : "#fff" }}>
      {ganttStatusLabels[status]}
    </span>
  );
}
