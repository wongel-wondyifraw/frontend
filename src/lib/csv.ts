/** Minimal CSV helpers (RFC 4180–style) — no external deps. */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(
  headers: string[],
  rows: Record<string, unknown>[],
): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Parse CSV text into objects keyed by header row. */
export function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const records = parseCsvRecords(text);
  if (records.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = records[0].map((h) => h.trim());
  const rows = records
    .slice(1)
    .map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (cells[i] ?? "").trim();
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ""));
  return { headers, rows };
}

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\r") {
      // ignore; handle with \n
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  const v = value.trim().toLowerCase();
  if (["true", "yes", "1", "y"].includes(v)) return true;
  if (["false", "no", "0", "n"].includes(v)) return false;
  return undefined;
}

export function splitList(value: string | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  return value
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
