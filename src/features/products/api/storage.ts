export function collapseRequiredHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const byLower = new Map<string, { name: string; value: string }>();
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === "host") continue;
    if (!byLower.has(lower)) {
      byLower.set(lower, { name: canonicalHeaderName(name), value });
    }
  }

  const collapsed: Record<string, string> = {};
  for (const { name, value } of byLower.values()) {
    collapsed[name] = value;
  }
  return collapsed;
}

function canonicalHeaderName(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "content-type") return "Content-Type";
  if (lower === "content-length") return "Content-Length";
  return name;
}

export async function putPresignedObject(
  url: string,
  body: Blob,
  requiredHeaders: Record<string, string> = {},
  method = "PUT",
): Promise<void> {
  if (method.toUpperCase() !== "PUT") {
    throw new Error(`Unsupported storage upload method (${method})`);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: collapseRequiredHeaders(requiredHeaders),
    body,
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status})`);
  }
}
