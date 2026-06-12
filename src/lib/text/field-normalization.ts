export function normalizeTextareaValue(value: string) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function normalizeOptionalText(value: string | null | undefined) {
  const normalized = normalizeTextareaValue(value ?? "");

  return normalized ? normalized : null;
}

export function normalizePromptContent(value: string) {
  const listSectionHeadings = new Set([
    "acceptance criteria",
    "dependencies",
    "qa instructions",
    "requirements",
  ]);
  let inListSection = false;

  return normalizeTextareaValue(value)
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        inListSection = false;
        return line;
      }

      if (listSectionHeadings.has(trimmed.toLowerCase())) {
        inListSection = true;
        return line;
      }

      if (
        inListSection &&
        !/^[-*]\s+/.test(trimmed) &&
        !/^\d+[.)]\s+/.test(trimmed)
      ) {
        return `- ${trimmed}`;
      }

      return line;
    })
    .join("\n");
}

export function normalizeLineItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" ? normalizeLineString(item) : [],
    );
  }

  return typeof value === "string" ? normalizeLineString(value) : [];
}

function normalizeLineString(value: string) {
  return normalizeTextareaValue(value)
    .split("\n")
    .map((item) =>
      item
        .trim()
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .trim(),
    )
    .filter(Boolean);
}
