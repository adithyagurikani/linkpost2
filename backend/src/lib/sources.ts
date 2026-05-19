export function parseSourceContent(source: {
  sourceType: string;
  content: string;
}): { contents: string[]; error?: string } {
  if (source.sourceType === "imported_json") {
    return { contents: [source.content] };
  }

  const lines = source.content.split("\n").filter(Boolean);

  if (source.sourceType === "text") {
    return { contents: lines.map((l: string) => l.trim()).filter(Boolean) };
  }

  if (source.sourceType === "json") {
    try {
      const parsed = JSON.parse(source.content);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const contents = items
        .map((i: unknown) => {
          if (typeof i === "string") return i;
          return String(
            (i as Record<string, unknown>).content ||
              (i as Record<string, unknown>).text ||
              JSON.stringify(i)
          );
        })
        .filter(Boolean);
      return { contents };
    } catch {
      return { contents: [], error: "Invalid JSON in source content" };
    }
  }

  if (source.sourceType === "csv") {
    const contents = lines
      .map((l: string) => {
        const trimmed = l.trim();
        if (!trimmed || trimmed.startsWith("#")) return "";
        const fields = parseCSVLine(trimmed);
        return fields.length > 1
          ? fields.slice(1).join(",").trim()
          : fields[0].trim();
      })
      .filter(Boolean);
    return { contents };
  }

  return { contents: [] };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function normalizeContent(content: string): string {
  return content.trim().replace(/\s+/g, " ");
}
