import type { Member } from "@/types";
import { createMembersBulk, getMembers } from "@/services/api";
import { getApiErrorMessage } from "@/lib/errors";
import { parseBool, splitList } from "@/lib/csv";
import {
  downloadExcelTemplate,
  downloadExcelData,
  downloadPdfTable,
  parseSpreadsheetFile,
} from "@/lib/spreadsheet";

/** Required import/export column order for members. */
export const MEMBER_CSV_HEADERS = [
  "first_name",
  "last_name",
  "middle_name",
  "email",
  "phone",
  "address",
  "date_of_birth",
  "gender",
  "marital_status",
  "status",
  "baptized",
  "holy_spirit_baptized",
  "is_deacon",
  "requires_follow_up",
  "joined_date",
  "salvation_date",
  "member_type",
  "telegram_username",
  "facebook_username",
  "instagram_username",
  "whatsapp_number",
  "location_id",
  "employment_status",
  "profession",
  "employer",
  "education_level",
  "education_field",
  "interested_ministries",
] as const;

export const MEMBER_CSV_SAMPLE: Record<string, string> = {
  first_name: "Jane",
  last_name: "Doe",
  middle_name: "",
  email: "jane@example.com",
  phone: "+251900000000",
  address: "Addis Ababa",
  date_of_birth: "1990-01-15",
  gender: "female",
  marital_status: "single",
  status: "pending",
  baptized: "yes",
  holy_spirit_baptized: "no",
  is_deacon: "no",
  requires_follow_up: "no",
  joined_date: "2024-01-01",
  salvation_date: "",
  member_type: "existing",
  telegram_username: "",
  facebook_username: "",
  instagram_username: "",
  whatsapp_number: "",
  location_id: "",
  employment_status: "",
  profession: "",
  employer: "",
  education_level: "",
  education_field: "",
  interested_ministries: "Worship|Youth",
};

const BULK_CHUNK = 200;

function boolToCsv(v: boolean | string | undefined): string {
  if (v === true || v === "true" || v === "yes") return "yes";
  if (v === false || v === "false" || v === "no") return "no";
  return "";
}

export function memberToCsvRow(m: Member): Record<string, string> {
  return {
    first_name: m.first_name ?? "",
    last_name: m.last_name ?? "",
    middle_name: m.middle_name ?? "",
    email: m.email ?? "",
    phone: m.phone ?? "",
    address: m.address ?? "",
    date_of_birth: m.date_of_birth ? String(m.date_of_birth).slice(0, 10) : "",
    gender: m.gender ?? "",
    marital_status: m.marital_status ?? "",
    status: m.status ?? "",
    baptized: boolToCsv(m.baptized),
    holy_spirit_baptized: boolToCsv(m.holy_spirit_baptized),
    is_deacon: boolToCsv(m.is_deacon),
    requires_follow_up: boolToCsv(m.requires_follow_up),
    joined_date: m.joined_date ? String(m.joined_date).slice(0, 10) : "",
    salvation_date: m.salvation_date
      ? String(m.salvation_date).slice(0, 10)
      : "",
    member_type: m.member_type ?? "",
    telegram_username: m.telegram_username ?? "",
    facebook_username: m.facebook_username ?? "",
    instagram_username: m.instagram_username ?? "",
    whatsapp_number: m.whatsapp_number ?? "",
    location_id: m.location_id ?? "",
    employment_status: m.employment_status ?? "",
    profession: m.profession ?? "",
    employer: m.employer ?? "",
    education_level: m.education_level ?? "",
    education_field: m.education_field ?? "",
    interested_ministries: (m.interested_ministries || []).join("|"),
  };
}

async function fetchAllMembers(): Promise<Member[]> {
  const all: Member[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const result = await getMembers({ page, limit });
    all.push(...result.data);
    if (all.length >= result.total || result.data.length === 0) break;
    page += 1;
  }
  return all;
}

export async function downloadMemberTemplate(): Promise<void> {
  await downloadExcelTemplate(
    "members-template.xlsx",
    [...MEMBER_CSV_HEADERS],
    MEMBER_CSV_SAMPLE,
  );
}

export async function exportMembersExcel(): Promise<void> {
  const all = await fetchAllMembers();
  const rows = all.map(memberToCsvRow);
  await downloadExcelData(
    `members-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    [...MEMBER_CSV_HEADERS],
    rows,
    "Members",
  );
}

export async function exportMembersPdf(): Promise<void> {
  const all = await fetchAllMembers();
  const rows = all.map(memberToCsvRow);
  const pdfHeaders = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "status",
    "member_type",
    "joined_date",
    "marital_status",
  ];
  await downloadPdfTable({
    filename: `members-export-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: "Members export",
    headers: pdfHeaders,
    rows: rows.length
      ? rows
      : [Object.fromEntries(pdfHeaders.map((h) => [h, ""]))],
  });
}

function rowToMemberPayload(
  row: Record<string, string>,
): Record<string, unknown> {
  const first_name = row.first_name?.trim();
  const last_name = row.last_name?.trim();
  if (!first_name || !last_name) {
    throw new Error("first_name and last_name are required");
  }

  const payload: Record<string, unknown> = {
    first_name,
    last_name,
  };

  const optionalStrings = [
    "middle_name",
    "email",
    "phone",
    "address",
    "date_of_birth",
    "gender",
    "marital_status",
    "status",
    "joined_date",
    "salvation_date",
    "member_type",
    "telegram_username",
    "facebook_username",
    "instagram_username",
    "whatsapp_number",
    "location_id",
    "employment_status",
    "profession",
    "employer",
    "education_level",
    "education_field",
  ] as const;

  for (const key of optionalStrings) {
    const v = row[key]?.trim();
    if (v) payload[key] = v;
  }

  const baptized = parseBool(row.baptized);
  if (baptized !== undefined) payload.baptized = baptized;
  const holy = parseBool(row.holy_spirit_baptized);
  if (holy !== undefined) payload.holy_spirit_baptized = holy;
  const deacon = parseBool(row.is_deacon);
  if (deacon !== undefined) payload.is_deacon = deacon;
  const follow = parseBool(row.requires_follow_up);
  if (follow !== undefined) payload.requires_follow_up = follow;

  const interests = splitList(row.interested_ministries);
  if (interests?.length) payload.interested_ministries = interests;

  return payload;
}

export async function importMembersFromFile(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<{
  ok: number;
  failed: number;
  errors: string[];
}> {
  const { headers, rows } = await parseSpreadsheetFile(file);
  if (!headers.includes("first_name") || !headers.includes("last_name")) {
    throw new Error(
      "File must include first_name and last_name columns (download the template)",
    );
  }

  const payloads: Record<string, unknown>[] = [];
  const parseErrors: string[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const line = i + 2;
    try {
      payloads.push(rowToMemberPayload(rows[i]));
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
      const result = await createMembersBulk(chunk);
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
