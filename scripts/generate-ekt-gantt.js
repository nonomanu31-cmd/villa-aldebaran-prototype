const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const DATE_FORMAT = "dd/mm/yyyy";
const BASE_DATE = new Date("2026-04-20T00:00:00");
const DEFAULT_PROJECT_START = new Date("2026-04-01T00:00:00");
const TASK_START_ROW = 4;
const TASK_STARTER_ROWS = 30;
const DECISION_START_ROW = 4;
const DECISION_STARTER_ROWS = 20;
const MAX_VIEW_ROWS = 300;
const TIMELINE_PERIODS = 52;
const OUTPUT_DIR = path.join(__dirname, "..", "data", "exports");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "EKT_Gantt_Dynamique.xlsx");

const STATUS_LIST = [
  "à instruire",
  "prêt à décider",
  "bloqué",
  "en exécution",
  "clos",
  "non réouvrable",
];

const YES_NO_LIST = ["oui", "non"];
const CRITICITY_LIST = ["faible", "moyenne", "haute", "critique"];
const IRREVERSIBILITY_LIST = ["faible", "moyenne", "forte"];
const DECISION_STATUS_LIST = ["ouverte", "tranchée", "sans objet"];
const DECISION_TYPE_LIST = [
  "arbitrage",
  "go/no-go",
  "repriorisation",
  "budget",
  "sécurité",
  "conformité",
  "risque",
];
const IMPACT_LIST = ["nul", "faible", "moyen", "fort"];

const taskHeaders = [
  "ID",
  "Sujet",
  "Lot_Domaine",
  "Agent_source",
  "Responsable",
  "Statut",
  "Date_debut_prevue",
  "Date_fin_prevue",
  "Duree_jours",
  "Date_debut_reelle",
  "Date_fin_reelle",
  "Blocage",
  "Depend_de",
  "Non_negociable",
  "Seuil_de_reprise",
  "Donnee_manquante",
  "Niveau_criticite",
  "Irreversibilite",
  "Decision_Emmanuel",
  "Commentaire_EKT",
  "Goulot",
  "Point_de_bascule",
];

const decisionHeaders = [
  "Date",
  "Sujet",
  "Decision",
  "Type_decision",
  "Responsable",
  "Impact_planning",
  "Impact_budget",
  "Impact_securite",
  "Impact_conformite",
  "Notes",
];

const colors = {
  ink: "FF1F2937",
  muted: "FF6B7280",
  grid: "FFD1D5DB",
  headerBg: "FF243447",
  headerFont: "FFFFFFFF",
  sectionBg: "FFF3F4F6",
  accent: "FF2563EB",
  infoBg: "FFF8FAFC",
  gray: "FFB8C0CC",
  orange: "FFF59E0B",
  red: "FFDC2626",
  blue: "FF2563EB",
  green: "FF16A34A",
  violet: "FF7C3AED",
  paleYellow: "FFFEF3C7",
  paleRed: "FFFEE2E2",
  paleOrange: "FFFFEDD5",
  paleBlue: "FFDBEAFE",
  paleGreen: "FFDCFCE7",
  paleViolet: "FFEDE9FE",
  paleGray: "FFF3F4F6",
  today: "FFB91C1C",
};

function toColumnLetter(index) {
  let dividend = index;
  let columnName = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

function applyBorders(cell) {
  cell.border = {
    top: { style: "thin", color: { argb: colors.grid } },
    left: { style: "thin", color: { argb: colors.grid } },
    bottom: { style: "thin", color: { argb: colors.grid } },
    right: { style: "thin", color: { argb: colors.grid } },
  };
}

function styleHeaderRow(worksheet, rowNumber, fromColumn, toColumn) {
  for (let index = fromColumn; index <= toColumn; index += 1) {
    const cell = worksheet.getCell(rowNumber, index);
    cell.font = { bold: true, color: { argb: colors.headerFont } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.headerBg },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyBorders(cell);
  }
}

function styleSectionTitle(cell) {
  cell.font = { bold: true, size: 14, color: { argb: colors.ink } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: colors.sectionBg },
  };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  applyBorders(cell);
}

function addDirectListValidation(worksheet, range, items) {
  const formula = `"${items.join(",")}"`;
  worksheet.dataValidations.add(range, {
    type: "list",
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
  });
}

function setColumnWidths(worksheet, widths) {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function baseRowFormula(header, rowNumber) {
  return `=IF($A${rowNumber}="","",INDEX(tblTasks[${header}],ROW()-6))`;
}

async function buildWorkbook() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.company = "EKT";
  workbook.created = BASE_DATE;
  workbook.modified = BASE_DATE;
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;

  const paramsSheet = workbook.addWorksheet("PARAMS", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 3 }],
  });
  const tasksSheet = workbook.addWorksheet("TASKS", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 3 }],
  });
  const decisionsSheet = workbook.addWorksheet("DECISIONS", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 3 }],
  });
  const ganttSheet = workbook.addWorksheet("GANTT_VIEW", {
    views: [{ state: "frozen", xSplit: 12, ySplit: 4, showGridLines: false }],
  });
  const filterSheet = workbook.addWorksheet("FILTER_VIEW", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 6 }],
  });

  buildParamsSheet(workbook, paramsSheet);
  buildTasksSheet(tasksSheet);
  buildDecisionsSheet(decisionsSheet);
  buildGanttSheet(ganttSheet);
  buildFilterSheet(filterSheet);

  await workbook.xlsx.writeFile(OUTPUT_FILE);
}

function buildParamsSheet(workbook, worksheet) {
  worksheet.mergeCells("A1:C1");
  worksheet.getCell("A1").value = "Pilotage EKT - Paramètres de la vue Gantt";
  styleSectionTitle(worksheet.getCell("A1"));
  worksheet.getCell("A2").value =
    "Les cellules de la colonne Valeur pilotent la timeline, les vues filtrées et la ligne Aujourd'hui.";
  worksheet.getCell("A2").font = { italic: true, color: { argb: colors.muted } };

  worksheet.getRow(3).values = ["Paramètre", "Valeur", "Usage"];
  styleHeaderRow(worksheet, 3, 1, 3);

  const params = [
    ["date_debut_projet", DEFAULT_PROJECT_START, "Point de départ de la timeline affichée."],
    ["date_du_jour", { formula: "TODAY()" }, "Repère dynamique pour la colonne Aujourd'hui."],
    ["horizon_affichage", 26, "Nombre de semaines ou mois visibles dans la vue Gantt."],
    ["mode_affichage", "semaine", "Choisir 'semaine' ou 'mois'."],
    ["filtre_statut", "tous", "Laisser 'tous' pour ne pas filtrer."],
    ["filtre_agent", "tous", "Filtre exact sur Agent_source ou Responsable."],
    ["filtre_criticite", "toutes", "Laisser 'toutes' pour ne pas filtrer."],
  ];

  params.forEach((row, index) => {
    const excelRow = 4 + index;
    worksheet.getCell(excelRow, 1).value = row[0];
    worksheet.getCell(excelRow, 2).value = row[1];
    worksheet.getCell(excelRow, 3).value = row[2];

    for (let column = 1; column <= 3; column += 1) {
      const cell = worksheet.getCell(excelRow, column);
      cell.alignment = { vertical: "middle", horizontal: column === 2 ? "center" : "left" };
      applyBorders(cell);
    }
  });

  worksheet.getColumn(2).numFmt = DATE_FORMAT;
  worksheet.getCell("B6").numFmt = "0";
  worksheet.getCell("B4").numFmt = DATE_FORMAT;
  worksheet.getCell("B5").numFmt = DATE_FORMAT;

  addDirectListValidation(worksheet, "B7", ["semaine", "mois"]);
  addDirectListValidation(worksheet, "B8", ["tous", ...STATUS_LIST]);
  addDirectListValidation(worksheet, "B10", ["toutes", ...CRITICITY_LIST]);
  worksheet.dataValidations.add("B6", {
    type: "whole",
    operator: "between",
    allowBlank: false,
    showErrorMessage: true,
    formulae: [1, TIMELINE_PERIODS],
  });

  workbook.definedNames.add("param_date_debut_projet", "PARAMS!$B$4");
  workbook.definedNames.add("param_date_du_jour", "PARAMS!$B$5");
  workbook.definedNames.add("param_horizon_affichage", "PARAMS!$B$6");
  workbook.definedNames.add("param_mode_affichage", "PARAMS!$B$7");
  workbook.definedNames.add("param_filtre_statut", "PARAMS!$B$8");
  workbook.definedNames.add("param_filtre_agent", "PARAMS!$B$9");
  workbook.definedNames.add("param_filtre_criticite", "PARAMS!$B$10");

  worksheet.mergeCells("E1:G1");
  worksheet.getCell("E1").value = "Légende visuelle";
  styleSectionTitle(worksheet.getCell("E1"));
  worksheet.getRow(3).getCell(5).value = "Statut";
  worksheet.getRow(3).getCell(6).value = "Couleur";
  worksheet.getRow(3).getCell(7).value = "Lecture";
  styleHeaderRow(worksheet, 3, 5, 7);

  const legend = [
    ["à instruire", colors.gray, "Instruction encore incomplète."],
    ["prêt à décider", colors.orange, "Arbitrage prêt à être rendu."],
    ["bloqué", colors.red, "Traitement prioritaire."],
    ["en exécution", colors.blue, "Action engagée."],
    ["clos", colors.green, "Sujet terminé."],
    ["non réouvrable / irréversibilité forte", colors.violet, "Retour arrière coûteux ou impossible."],
    ["Goulot = oui", colors.paleYellow, "La ligne est surlignée."],
    ["Jalon (début = fin)", "FFFFFFFF", "Affiché avec un diamant noir."],
  ];

  legend.forEach((item, index) => {
    const row = 4 + index;
    worksheet.getCell(row, 5).value = item[0];
    worksheet.getCell(row, 6).value = "";
    worksheet.getCell(row, 7).value = item[2];
    worksheet.getCell(row, 6).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: item[1] },
    };

    for (let column = 5; column <= 7; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.alignment = { vertical: "middle", horizontal: column === 6 ? "center" : "left" };
      applyBorders(cell);
    }
  });

  setColumnWidths(worksheet, [24, 20, 56, 4, 34, 12, 42]);
  worksheet.getRow(1).height = 22;
}

function buildTasksSheet(worksheet) {
  worksheet.mergeCells("A1:V1");
  worksheet.getCell("A1").value = "Pilotage EKT - Registre principal des tâches";
  styleSectionTitle(worksheet.getCell("A1"));
  worksheet.getCell("A2").value =
    "La durée se calcule à partir des dates prévues. Pour l'alerte de dépendance, renseigner idéalement un ID unique dans Depend_de.";
  worksheet.getCell("A2").font = { italic: true, color: { argb: colors.muted } };

  const emptyRows = Array.from({ length: TASK_STARTER_ROWS }, () => taskHeaders.map(() => ""));
  worksheet.addTable({
    name: "tblTasks",
    ref: "A3",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: taskHeaders.map((name) => ({ name })),
    rows: emptyRows,
  });

  setColumnWidths(worksheet, [
    12, 34, 18, 18, 18, 18, 15, 15, 12, 15, 15, 12, 14, 14, 18, 20, 16, 16, 20, 28, 10, 14,
  ]);

  ["G", "H", "J", "K"].forEach((column) => {
    worksheet.getColumn(column).numFmt = DATE_FORMAT;
  });
  worksheet.getColumn("I").numFmt = "0";

  for (let row = TASK_START_ROW; row < TASK_START_ROW + TASK_STARTER_ROWS; row += 1) {
    worksheet.getCell(`I${row}`).value = {
      formula: `IF(OR(G${row}="",H${row}=""),"",MAX(1,H${row}-G${row}+1))`,
    };
  }

  addDirectListValidation(worksheet, "F4:F1000", STATUS_LIST);
  addDirectListValidation(worksheet, "L4:L1000", YES_NO_LIST);
  addDirectListValidation(worksheet, "N4:N1000", YES_NO_LIST);
  addDirectListValidation(worksheet, "Q4:Q1000", CRITICITY_LIST);
  addDirectListValidation(worksheet, "R4:R1000", IRREVERSIBILITY_LIST);
  addDirectListValidation(worksheet, "S4:S1000", DECISION_STATUS_LIST);
  addDirectListValidation(worksheet, "U4:U1000", YES_NO_LIST);
  addDirectListValidation(worksheet, "V4:V1000", YES_NO_LIST);

  worksheet.addConditionalFormatting({
    ref: "A4:V1000",
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: ['OR(LOWER($F4)="bloqué",LOWER($L4)="oui")'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleRed } },
        },
      },
      {
        type: "expression",
        priority: 2,
        formulae: ['LOWER($U4)="oui"'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleYellow } },
        },
      },
      {
        type: "expression",
        priority: 3,
        formulae: ['AND($S4<>"",LOWER($S4)<>"tranchée",LOWER($S4)<>"sans objet")'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleOrange } },
        },
      },
    ],
  });
}

function buildDecisionsSheet(worksheet) {
  worksheet.mergeCells("A1:J1");
  worksheet.getCell("A1").value = "Pilotage EKT - Journal des décisions";
  styleSectionTitle(worksheet.getCell("A1"));
  worksheet.getCell("A2").value =
    "Journal sobre pour tracer les arbitrages et leurs impacts sur le pilotage.";
  worksheet.getCell("A2").font = { italic: true, color: { argb: colors.muted } };

  const emptyRows = Array.from({ length: DECISION_STARTER_ROWS }, () => decisionHeaders.map(() => ""));
  worksheet.addTable({
    name: "tblDecisions",
    ref: "A3",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: decisionHeaders.map((name) => ({ name })),
    rows: emptyRows,
  });

  setColumnWidths(worksheet, [14, 30, 38, 18, 18, 16, 14, 16, 18, 36]);
  worksheet.getColumn("A").numFmt = DATE_FORMAT;

  addDirectListValidation(worksheet, "D4:D1000", DECISION_TYPE_LIST);
  addDirectListValidation(worksheet, "F4:I1000", IMPACT_LIST);
}

function buildGanttSheet(worksheet) {
  worksheet.mergeCells("A1:L1");
  worksheet.getCell("A1").value = "Pilotage EKT - Vue Gantt orientée décision";
  styleSectionTitle(worksheet.getCell("A1"));
  worksheet.mergeCells("A2:L2");
  worksheet.getCell("A2").value =
    "Executable = non si la tâche est bloquée ou si la dépendance renseignée n'est pas close dans TASKS.";
  worksheet.getCell("A2").font = { italic: true, color: { argb: colors.muted } };

  const visibleHeaders = [
    "ID",
    "Sujet",
    "Responsable",
    "Statut",
    "Depend_de",
    "Blocage",
    "Criticité",
    "Goulot",
    "Executable",
    "Début_prévu",
    "Fin_prévu",
    "Irreversibilité",
  ];

  visibleHeaders.forEach((header, index) => {
    worksheet.getCell(4, index + 1).value = header;
  });

  styleHeaderRow(worksheet, 4, 1, 12);
  worksheet.getRow(4).height = 28;

  setColumnWidths(worksheet, [12, 36, 20, 18, 14, 10, 12, 10, 14, 14, 14, 14]);
  ["J", "K"].forEach((column) => {
    worksheet.getColumn(column).numFmt = DATE_FORMAT;
    worksheet.getColumn(column).hidden = true;
  });
  worksheet.getColumn("L").hidden = true;

  const timelineStartColumn = 13;
  const firstTimelineLetter = toColumnLetter(timelineStartColumn);
  const lastTimelineLetter = toColumnLetter(timelineStartColumn + TIMELINE_PERIODS - 1);

  for (let index = 0; index < TIMELINE_PERIODS; index += 1) {
    const columnNumber = timelineStartColumn + index;
    const columnLetter = toColumnLetter(columnNumber);
    worksheet.getColumn(columnNumber).width = 5;

    worksheet.getCell(3, columnNumber).value = {
      formula: `IF(${index + 1}<=param_horizon_affichage,IF(param_mode_affichage="mois",EDATE(param_date_debut_projet,${index}),param_date_debut_projet+7*${index}),"")`,
    };
    worksheet.getCell(3, columnNumber).numFmt = DATE_FORMAT;
    worksheet.getCell(4, columnNumber).value = {
      formula: `IF(${columnLetter}3="","",IF(param_mode_affichage="mois",TEXT(${columnLetter}3,"mmm yy"),TEXT(${columnLetter}3,"dd mmm")))`,
    };
    worksheet.getCell(2, columnNumber).value = {
      formula: `IF(${columnLetter}3="","",IF(AND(param_date_du_jour>=${columnLetter}3,param_date_du_jour<=IF(param_mode_affichage="mois",EOMONTH(${columnLetter}3,0),${columnLetter}3+6)),"Aujourd'hui",""))`,
    };
    worksheet.getCell(2, columnNumber).font = { bold: true, color: { argb: colors.today }, size: 10 };
    worksheet.getCell(2, columnNumber).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    worksheet.getCell(4, columnNumber).font = { bold: true, color: { argb: colors.headerFont }, size: 9 };
    worksheet.getCell(4, columnNumber).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.headerBg },
    };
    worksheet.getCell(4, columnNumber).alignment = {
      horizontal: "center",
      vertical: "middle",
      textRotation: 90,
      wrapText: true,
    };
    applyBorders(worksheet.getCell(4, columnNumber));
  }

  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).hidden = true;
  worksheet.getRow(4).height = 60;

  for (let row = 5; row < 5 + MAX_VIEW_ROWS; row += 1) {
    worksheet.getCell(`A${row}`).value = { formula: `IFERROR(INDEX(tblTasks[ID],ROW()-4),"")` };
    worksheet.getCell(`B${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Sujet],ROW()-4))` };
    worksheet.getCell(`C${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Responsable],ROW()-4))` };
    worksheet.getCell(`D${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Statut],ROW()-4))` };
    worksheet.getCell(`E${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Depend_de],ROW()-4))` };
    worksheet.getCell(`F${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Blocage],ROW()-4))` };
    worksheet.getCell(`G${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Niveau_criticite],ROW()-4))` };
    worksheet.getCell(`H${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Goulot],ROW()-4))` };
    worksheet.getCell(`I${row}`).value = {
      formula: `IF($A${row}="","",IF(LOWER($F${row})="oui","non",IF($E${row}="","oui",IFERROR(IF(LOWER(INDEX(tblTasks[Statut],MATCH($E${row},tblTasks[ID],0)))="clos","oui","non"),"non"))))`,
    };
    worksheet.getCell(`J${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Date_debut_prevue],ROW()-4))` };
    worksheet.getCell(`K${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Date_fin_prevue],ROW()-4))` };
    worksheet.getCell(`L${row}`).value = { formula: `IF($A${row}="","",INDEX(tblTasks[Irreversibilite],ROW()-4))` };

    ["J", "K"].forEach((column) => {
      worksheet.getCell(`${column}${row}`).numFmt = DATE_FORMAT;
    });

    for (let column = 1; column <= 12; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.alignment = { vertical: "middle", horizontal: column === 2 ? "left" : "center", wrapText: true };
      applyBorders(cell);
    }

    for (let index = 0; index < TIMELINE_PERIODS; index += 1) {
      const columnLetter = toColumnLetter(timelineStartColumn + index);
      const cell = worksheet.getCell(row, timelineStartColumn + index);
      cell.value = {
        formula: `IF(OR($A${row}="",${columnLetter}$3=""),"",IF(AND($J${row}<>"",$K${row}<>"",$J${row}=$K${row},$J${row}>=${columnLetter}$3,$J${row}<=IF(param_mode_affichage="mois",EOMONTH(${columnLetter}$3,0),${columnLetter}$3+6)),"◆",""))`,
      };
      cell.font = { bold: true, color: { argb: colors.ink } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      applyBorders(cell);
    }
  }

  worksheet.autoFilter = {
    from: "A4",
    to: `I${4 + MAX_VIEW_ROWS}`,
  };

  worksheet.addConditionalFormatting({
    ref: `${firstTimelineLetter}4:${lastTimelineLetter}${4 + MAX_VIEW_ROWS}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [
          `AND(${firstTimelineLetter}$3<>"",param_date_du_jour>=${firstTimelineLetter}$3,param_date_du_jour<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6))`,
        ],
        style: {
          border: {
            left: { style: "medium", color: { argb: colors.today } },
            right: { style: "medium", color: { argb: colors.today } },
          },
        },
      },
    ],
  });

  const statusRules = [
    {
      priority: 2,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,OR(LOWER($D5)="non réouvrable",LOWER($L5)="forte"))`,
      fill: colors.violet,
    },
    {
      priority: 3,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,OR(LOWER($D5)="bloqué",LOWER($F5)="oui"))`,
      fill: colors.red,
    },
    {
      priority: 4,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,LOWER($D5)="clos")`,
      fill: colors.green,
    },
    {
      priority: 5,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,LOWER($D5)="en exécution")`,
      fill: colors.blue,
    },
    {
      priority: 6,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,LOWER($D5)="prêt à décider")`,
      fill: colors.orange,
    },
    {
      priority: 7,
      formula: `AND(${firstTimelineLetter}$3<>"",$A5<>"",$J5<>"",$K5<>"",$J5<>$K5,$J5<=IF(param_mode_affichage="mois",EOMONTH(${firstTimelineLetter}$3,0),${firstTimelineLetter}$3+6),$K5>=${firstTimelineLetter}$3,LOWER($D5)="à instruire")`,
      fill: colors.gray,
    },
  ];

  statusRules.forEach((rule) => {
    worksheet.addConditionalFormatting({
      ref: `${firstTimelineLetter}5:${lastTimelineLetter}${4 + MAX_VIEW_ROWS}`,
      rules: [
        {
          type: "expression",
          priority: rule.priority,
          formulae: [rule.formula],
          style: {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: rule.fill } },
          },
        },
      ],
    });
  });

  worksheet.addConditionalFormatting({
    ref: `A5:I${4 + MAX_VIEW_ROWS}`,
    rules: [
      {
        type: "expression",
        priority: 8,
        formulae: ['LOWER($H5)="oui"'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleYellow } },
          font: { bold: true },
        },
      },
    ],
  });

  worksheet.addConditionalFormatting({
    ref: `I5:I${4 + MAX_VIEW_ROWS}`,
    rules: [
      {
        type: "expression",
        priority: 9,
        formulae: ['LOWER($I5)="non"'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleOrange } },
          font: { bold: true, color: { argb: colors.red } },
        },
      },
    ],
  });
}

function buildFilterSheet(worksheet) {
  worksheet.mergeCells("A1:AB1");
  worksheet.getCell("A1").value = "Pilotage EKT - Vue filtrable et synthèse";
  styleSectionTitle(worksheet.getCell("A1"));
  worksheet.mergeCells("A2:A3");
  worksheet.getCell("A2").value = "Conseil";
  worksheet.getCell("A2").font = { bold: true, color: { argb: colors.ink } };
  worksheet.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: colors.sectionBg },
  };
  worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };
  applyBorders(worksheet.getCell("A2"));
  worksheet.mergeCells("A4:AB4");
  worksheet.getCell("A4").value =
    "Filtrer d'abord Match_global = oui pour appliquer les filtres PARAMS, puis utiliser les colonnes Vue_*.";
  worksheet.getCell("A4").font = { italic: true, color: { argb: colors.muted } };

  const summaryLabels = [
    "Tâches bloquées",
    "Tâches critiques",
    "Décisions Emmanuel ouvertes",
    "Donnée manquante",
    "Non réouvrables",
  ];

  const summaryColors = [
    colors.paleRed,
    colors.paleOrange,
    colors.paleBlue,
    colors.paleGray,
    colors.paleViolet,
  ];

  summaryLabels.forEach((label, index) => {
    const column = 2 + index;
    worksheet.getCell(2, column).value = label;
    worksheet.getCell(2, column).font = { bold: true, color: { argb: colors.ink } };
    worksheet.getCell(2, column).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: summaryColors[index] },
    };
    worksheet.getCell(2, column).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorders(worksheet.getCell(2, column));
    worksheet.getCell(3, column).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(3, column).font = { bold: true, size: 13, color: { argb: colors.ink } };
    applyBorders(worksheet.getCell(3, column));
  });

  worksheet.getCell("B3").value = { formula: `COUNTIFS($W$7:$W$${6 + MAX_VIEW_ROWS},"oui",$X$7:$X$${6 + MAX_VIEW_ROWS},"oui")` };
  worksheet.getCell("C3").value = { formula: `COUNTIFS($W$7:$W$${6 + MAX_VIEW_ROWS},"oui",$Y$7:$Y$${6 + MAX_VIEW_ROWS},"oui")` };
  worksheet.getCell("D3").value = { formula: `COUNTIFS($W$7:$W$${6 + MAX_VIEW_ROWS},"oui",$Z$7:$Z$${6 + MAX_VIEW_ROWS},"oui")` };
  worksheet.getCell("E3").value = { formula: `COUNTIFS($W$7:$W$${6 + MAX_VIEW_ROWS},"oui",$AA$7:$AA$${6 + MAX_VIEW_ROWS},"oui")` };
  worksheet.getCell("F3").value = { formula: `COUNTIFS($W$7:$W$${6 + MAX_VIEW_ROWS},"oui",$AB$7:$AB$${6 + MAX_VIEW_ROWS},"oui")` };

  const headers = [
    ...taskHeaders,
    "Match_global",
    "Vue_bloquee",
    "Vue_critique",
    "Vue_decision_Emmanuel_ouverte",
    "Vue_donnee_manquante",
    "Vue_non_reouvrable",
  ];

  headers.forEach((header, index) => {
    worksheet.getCell(6, index + 1).value = header;
  });
  styleHeaderRow(worksheet, 6, 1, headers.length);

  setColumnWidths(worksheet, [
    12, 30, 16, 16, 16, 16, 14, 14, 12, 14, 14, 12, 14, 14, 18, 18, 16, 16, 18, 24, 10, 14,
    14, 12, 12, 18, 18, 18,
  ]);
  ["G", "H", "J", "K"].forEach((column) => {
    worksheet.getColumn(column).numFmt = DATE_FORMAT;
  });
  worksheet.getColumn("I").numFmt = "0";

  for (let row = 7; row < 7 + MAX_VIEW_ROWS; row += 1) {
    taskHeaders.forEach((header, index) => {
      const columnLetter = toColumnLetter(index + 1);
      worksheet.getCell(row, index + 1).value = {
        formula: index === 0 ? `IFERROR(INDEX(tblTasks[${header}],ROW()-6),"")` : baseRowFormula(header, row),
      };
      worksheet.getCell(row, index + 1).alignment = {
        vertical: "middle",
        horizontal: index === 1 || index === 19 ? "left" : "center",
        wrapText: true,
      };
      applyBorders(worksheet.getCell(row, index + 1));
      if (["G", "H", "J", "K"].includes(columnLetter)) {
        worksheet.getCell(`${columnLetter}${row}`).numFmt = DATE_FORMAT;
      }
    });

    worksheet.getCell(`W${row}`).value = {
      formula: `IF($A${row}="","",IF(AND(OR(param_filtre_statut="tous",LOWER($F${row})=LOWER(param_filtre_statut)),OR(param_filtre_agent="tous",LOWER($D${row})=LOWER(param_filtre_agent),LOWER($E${row})=LOWER(param_filtre_agent)),OR(param_filtre_criticite="toutes",LOWER($Q${row})=LOWER(param_filtre_criticite))),"oui","non"))`,
    };
    worksheet.getCell(`X${row}`).value = {
      formula: `IF($A${row}="","",IF(OR(LOWER($F${row})="bloqué",LOWER($L${row})="oui"),"oui","non"))`,
    };
    worksheet.getCell(`Y${row}`).value = {
      formula: `IF($A${row}="","",IF(OR(LOWER($Q${row})="critique",LOWER($U${row})="oui",LOWER($V${row})="oui"),"oui","non"))`,
    };
    worksheet.getCell(`Z${row}`).value = {
      formula: `IF($A${row}="","",IF(AND($S${row}<>"",LOWER($S${row})<>"tranchée",LOWER($S${row})<>"sans objet",LOWER($S${row})<>"clos"),"oui","non"))`,
    };
    worksheet.getCell(`AA${row}`).value = {
      formula: `IF($A${row}="","",IF($P${row}<>"","oui","non"))`,
    };
    worksheet.getCell(`AB${row}`).value = {
      formula: `IF($A${row}="","",IF(OR(LOWER($F${row})="non réouvrable",LOWER($R${row})="forte"),"oui","non"))`,
    };

    for (let column = 23; column <= 28; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.alignment = { vertical: "middle", horizontal: "center" };
      applyBorders(cell);
    }
  }

  worksheet.autoFilter = {
    from: "A6",
    to: `AB${6 + MAX_VIEW_ROWS}`,
  };

  worksheet.addConditionalFormatting({
    ref: `W7:AB${6 + MAX_VIEW_ROWS}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: ['LOWER(W7)="oui"'],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleGreen } },
          font: { bold: true, color: { argb: colors.green } },
        },
      },
    ],
  });
}

async function verifyWorkbook() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(OUTPUT_FILE);

  const expectedSheets = ["PARAMS", "TASKS", "DECISIONS", "GANTT_VIEW", "FILTER_VIEW"];
  const sheetNames = workbook.worksheets.map((sheet) => sheet.name);

  expectedSheets.forEach((name) => {
    if (!sheetNames.includes(name)) {
      throw new Error(`Feuille manquante: ${name}`);
    }
  });

  const paramsSheet = workbook.getWorksheet("PARAMS");
  const tasksSheet = workbook.getWorksheet("TASKS");
  const ganttSheet = workbook.getWorksheet("GANTT_VIEW");
  const filterSheet = workbook.getWorksheet("FILTER_VIEW");

  const checks = [
    paramsSheet.getCell("B5").formula === "TODAY()",
    tasksSheet.getCell("I4").formula === 'IF(OR(G4="",H4=""),"",MAX(1,H4-G4+1))',
    typeof ganttSheet.getCell("M3").formula === "string",
    ganttSheet.getCell("M5").formula.includes("◆"),
    filterSheet.getCell("W7").formula.includes("param_filtre_statut"),
  ];

  if (checks.includes(false)) {
    throw new Error("Certaines formules clés n'ont pas été enregistrées correctement.");
  }

  return {
    output: OUTPUT_FILE,
    sheets: sheetNames,
  };
}

async function main() {
  await buildWorkbook();
  const verification = await verifyWorkbook();
  console.log(`Workbook créé: ${verification.output}`);
  console.log(`Feuilles: ${verification.sheets.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
