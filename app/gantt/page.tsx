import { buildGanttDataset } from "../../lib/ekt-gantt-data";
import { GanttClient } from "./GanttClient";

export default async function GanttPage() {
  const dataset = await buildGanttDataset();

  return (
    <GanttClient
      initialTasks={dataset.tasks}
      initialDecisions={dataset.decisions}
      projectStart={dataset.projectStart}
      sourceLabel={dataset.sourceLabel}
    />
  );
}
