export type ParsedSection = {
  title: string;
  body: string[];
};

function normalizeTitle(line: string) {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .trim();
}

function isHeading(line: string) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\*\*.*\*\*$/.test(line.trim()) ||
    /^[A-Z0-9À-ÿ\s'\/\-\(\)]+$/.test(line.trim())
  );
}

export function parseModelResponse(raw: string) {
  const lines = raw.split("\n").map((line) => line.trimEnd());
  const sections: ParsedSection[] = [];

  let current: ParsedSection = {
    title: "Reponse",
    body: [],
  };

  for (const line of lines) {
    if (!line.trim()) {
      current.body.push("");
      continue;
    }

    if (isHeading(line) && line.trim().length < 120) {
      if (current.body.length > 0 || current.title !== "Reponse") {
        sections.push({
          title: current.title,
          body: current.body.filter((item, index, array) => {
            return !(item === "" && array[index - 1] === "");
          }),
        });
      }

      current = {
        title: normalizeTitle(line),
        body: [],
      };
      continue;
    }

    current.body.push(line);
  }

  if (current.body.length > 0 || sections.length === 0) {
    sections.push({
      title: current.title,
      body: current.body.filter((item, index, array) => {
        return !(item === "" && array[index - 1] === "");
      }),
    });
  }

  return {
    raw,
    sections,
  };
}
