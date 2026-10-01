import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { parseCsv } from "@/lib/csv";

export type SheetTable = {
  headers: string[];
  rows: Record<string, string>[];
};

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

/** Parse CSV or Excel (.xlsx / .xls) into header + row objects. */
export async function parseSpreadsheetFile(file: File): Promise<SheetTable> {
  const name = file.name.toLowerCase();
  const isExcel =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel");

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { headers: [], rows: [] };
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<
      (string | number | Date | null | undefined)[]
    >(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    if (!matrix.length) return { headers: [], rows: [] };
    const headers = (matrix[0] || []).map((h) => normalizeCell(h));
    const rows = matrix
      .slice(1)
      .map((cells) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = normalizeCell(cells[i]);
        });
        return row;
      })
      .filter((row) => Object.values(row).some((v) => v !== ""));
    return { headers, rows };
  }

  const text = await file.text();
  return parseCsv(text);
}

export function downloadExcelTemplate(
  filename: string,
  headers: string[],
  sampleRow: Record<string, string>,
): void {
  const sheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Template");
  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function downloadExcelData(
  filename: string,
  headers: string[],
  rows: Record<string, string>[],
  sheetName = "Data",
): void {
  const data = rows.length
    ? rows
    : [Object.fromEntries(headers.map((h) => [h, ""]))];
  const sheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function downloadPdfTable(options: {
  filename: string;
  title: string;
  headers: string[];
  rows: Record<string, string>[];
}): void {
  const { filename, title, headers, rows } = options;
  const doc = new jsPDF({
    orientation: headers.length > 8 ? "landscape" : "portrait",
  });
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  const body = rows.map((row) => headers.map((h) => row[h] ?? ""));

  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: body.length ? body : [headers.map(() => "")],
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7 },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
