import type { Plan } from "@/types";
import { createPlansBulk, getPlans } from "@/services/api";
import { getApiErrorMessage } from "@/lib/errors";
import { splitList } from "@/lib/csv";
import {
  downloadExcelTemplate,
  downloadExcelData,
  downloadPdfTable,
  parseSpreadsheetFile,
} from "@/lib/spreadsheet";

/** Required import/export column order for plans. */
export const PLAN_CSV_HEADERS = [
  "title",
  "type",
  "plan_date",
  "start_time",
  "end_time",
  "location",
  "notes",
  "status",
  "minister_ids",
] as const;

export const PLAN_CSV_SAMPLE: Record<string, string> = {
  title: "Sunday Service",
  type: "program",
  plan_date: "2026-10-05",
  start_time: "09:00",
  end_time: "11:30",
  location: "Main Hall",
  notes: "Bring song sheets",
  status: "planned",
  minister_ids: "",
};

const PLAN_TYPES = new Set([
  "program",
  "crusade",
  "general_assembly",
  "training",
  "fasting_day",
  "gospel_campaign",
]);

const PLAN_STATUSES = new Set(["planned", "completed", "cancelled"]);
const BULK_CHUNK = 200;

function formatTime(t?: string | null): string {
  if (!t) return "";
  return t.length > 5 ? t.slice(0, 5) : t;
}

export function planToCsvRow(p: Plan): Record<string, string> {
  return {
    title: p.title ?? "",
    type: p.type ?? "",
    plan_date: p.plan_date ? String(p.plan_date).slice(0, 10) : "",
    start_time: formatTime(p.start_time),
    end_time: formatTime(p.end_time),
    location: p.location ?? "",
    notes: p.notes ?? "",
    status: p.status ?? "",
    minister_ids: (p.plan_ministers || [])
      .map((pm) => pm.minister_id)
      .filter(Boolean)
      .join(";"),
  };
}

async function fetchAllPlans(): Promise<Plan[]> {
  const all: Plan[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const result = await getPlans({ page, limit });
    all.push(...result.data);
    if (all.length >= result.total || result.data.length === 0) break;
    page += 1;
  }
  return all;
}

export async function downloadPlanTemplate(): Promise<void> {
  await downloadExcelTemplate(
    "plans-template.xlsx",
    [...PLAN_CSV_HEADERS],
    PLAN_CSV_SAMPLE,
  );
}

export async function exportPlansExcel(): Promise<void> {
  const all = await fetchAllPlans();
  const rows = all.map(planToCsvRow);
  await downloadExcelData(
    `plans-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    [...PLAN_CSV_HEADERS],
    rows,
    "Plans",
  );
}

export async function exportPlansPdf(): Promise<void> {
  const all = await fetchAllPlans();
  const rows = all.map(planToCsvRow);
  const pdfHeaders = [
    "title",
    "type",
    "plan_date",
    "start_time",
    "end_time",
    "location",
    "status",
  ];
  await downloadPdfTable({
    filename: `plans-export-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: "Plans export",
    headers: pdfHeaders,
    rows: rows.length
      ? rows
      : [Object.fromEntries(pdfHeaders.map((h) => [h, ""]))],
  });
}

function rowToPlanPayload(
  row: Record<string, string>,
): Record<string, unknown> {
  const title = row.title?.trim();
  const type = row.type?.trim();
  const plan_date = row.plan_date?.trim();

  if (!title || !type || !plan_date) {
    throw new Error("title, type, and plan_date are required");
  }
  if (!PLAN_TYPES.has(type)) {
    throw new Error(`type must be one of: ${[...PLAN_TYPES].join(", ")}`);
  }

  const payload: Record<string, unknown> = {
    title,
    type,
    plan_date,
  };

  const start = row.start_time?.trim();
  const end = row.end_time?.trim();
  if (start) payload.start_time = start.length === 5 ? `${start}:00` : start;
  if (end) payload.end_time = end.length === 5 ? `${end}:00` : end;

  const location = row.location?.trim();
  if (location) payload.location = location;
  const notes = row.notes?.trim();
  if (notes) payload.notes = notes;

  const status = row.status?.trim();
  if (status) {
    if (!PLAN_STATUSES.has(status)) {
      throw new Error(
        `status must be one of: ${[...PLAN_STATUSES].join(", ")}`,
      );
    }
    payload.status = status;
  }

  const minister_ids = splitList(row.minister_ids);
  if (minister_ids?.length) payload.minister_ids = minister_ids;

  return payload;
}

export async function importPlansFromFile(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<{
  ok: number;
  failed: number;
  errors: string[];
}> {
  const { headers, rows } = await parseSpreadsheetFile(file);
  if (
    !headers.includes("title") ||
    !headers.includes("type") ||
    !headers.includes("plan_date")
  ) {
    throw new Error(
      "File must include title, type, and plan_date columns (download the template)",
    );
  }

  const payloads: Record<string, unknown>[] = [];
  const parseErrors: string[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const line = i + 2;
    try {
      payloads.push(rowToPlanPayload(rows[i]));
    } catch (err) {
      parseErrors.push(`Row ${line}: ${getApiErrorMessage(err)}`);
    }
  }

  let ok = 0;
  let failed = parseErrors.length;
  const errors = [...parseErrors];
  const total = rows.length;
  onProgress?.(0, total);

  let processed = parseErrors.length;
  for (let offset = 0; offset < payloads.length; offset += BULK_CHUNK) {
    const chunk = payloads.slice(offset, offset + BULK_CHUNK);
    const baseIndex = offset;
    try {
      const result = await createPlansBulk(chunk);
      ok += result.created;
      failed += result.failed;
      for (const e of result.errors) {
        errors.push(`Row ${baseIndex + e.index + 2}: ${e.message}`);
      }
    } catch (err) {
      failed += chunk.length;
      errors.push(
        `Rows ${baseIndex + 2}–${baseIndex + chunk.length + 1}: ${getApiErrorMessage(err)}`,
      );
    }
    processed = Math.min(total, processed + chunk.length);
    onProgress?.(processed, total);
  }

  onProgress?.(total, total);
  return { ok, failed, errors };
}
