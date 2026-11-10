export type DatePrecision = "day" | "month" | "year";
export type CalendarSystem = "gc" | "ec";

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export interface ParsedCalendarDate {
  /** Canonical Gregorian ISO date (YYYY-MM-DD) for backend storage */
  isoDate: string;
  precision: DatePrecision;
  calendar: CalendarSystem;
  year: number;
  month: number;
  day: number;
}

export interface CalendarDateFieldValue {
  /** Formatted in the declared `calendar` and `precision`: YYYY | YYYY-MM | YYYY-MM-DD | null */
  date: string | null;
  precision: DatePrecision;
  calendar: CalendarSystem;
}

export const ETHIOPIC_MONTHS = [
  { value: 1, name: "Meskerem", short: "Mes", amharic: "መስከረም" },
  { value: 2, name: "Tikimt", short: "Tik", amharic: "ጥቅምት" },
  { value: 3, name: "Hidar", short: "Hid", amharic: "ኅዳር" },
  { value: 4, name: "Tahsas", short: "Tah", amharic: "ታኅሣሥ" },
  { value: 5, name: "Tir", short: "Tir", amharic: "ጥር" },
  { value: 6, name: "Yekatit", short: "Yek", amharic: "የካቲት" },
  { value: 7, name: "Megabit", short: "Meg", amharic: "መጋቢት" },
  { value: 8, name: "Miazia", short: "Mia", amharic: "ሚያዝያ" },
  { value: 9, name: "Ginbot", short: "Gin", amharic: "ግንቦት" },
  { value: 10, name: "Sene", short: "Sen", amharic: "ሰኔ" },
  { value: 11, name: "Hamle", short: "Ham", amharic: "ሐምሌ" },
  { value: 12, name: "Nehase", short: "Neh", amharic: "ነሐሴ" },
  { value: 13, name: "Pagume", short: "Pag", amharic: "ጳጉሜን" },
] as const;

export const GREGORIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const GREGORIAN_MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const ETHIOPIC_JDN_OFFSET = 1723856;
const MIN_YEAR = 1800;
const MAX_YEAR = 2200;

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getGregorianMonthDays(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }
  const days = [
    31,
    isGregorianLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return days[month - 1];
}

export function isValidGregorianDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return false;
  }
  const maxDay = getGregorianMonthDays(year, month);
  return maxDay > 0 && Number.isInteger(day) && day >= 1 && day <= maxDay;
}

export function isEthiopianLeapYear(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

export function getEthiopianMonthDays(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 13) {
    return 0;
  }
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return 30;
}

export function isValidEthiopianDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return false;
  }
  const maxDay = getEthiopianMonthDays(year, month);
  return maxDay > 0 && Number.isInteger(day) && day >= 1 && day <= maxDay;
}

export function gcToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGc(jdn: number): CalendarDateValue {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

export function ecToJdn(year: number, month: number, day: number): number {
  return (
    ETHIOPIC_JDN_OFFSET +
    365 * year +
    Math.floor(year / 4) +
    30 * (month - 1) +
    (day - 1)
  );
}

export function jdnToEc(jdn: number): CalendarDateValue {
  const d0 = jdn - ETHIOPIC_JDN_OFFSET;
  const cycle4 = Math.floor(d0 / 1461);
  const rem4 = d0 - cycle4 * 1461;
  const yearOffset = Math.min(3, Math.floor(rem4 / 365));
  const year = cycle4 * 4 + yearOffset;
  const dayOfYear = rem4 - yearOffset * 365;
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;
  return { year, month, day };
}

export function ecToGc(
  year: number,
  month: number,
  day: number,
): CalendarDateValue {
  if (!isValidEthiopianDate(year, month, day)) {
    throw new Error(`Invalid Ethiopian date: ${year}-${month}-${day}`);
  }
  return jdnToGc(ecToJdn(year, month, day));
}

export function gcToEc(
  year: number,
  month: number,
  day: number,
): CalendarDateValue {
  if (!isValidGregorianDate(year, month, day)) {
    throw new Error(`Invalid Gregorian date: ${year}-${month}-${day}`);
  }
  return jdnToEc(gcToJdn(year, month, day));
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function gcIsoToEc(isoDate: string): CalendarDateValue | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!isValidGregorianDate(y, m, d)) return null;
  return gcToEc(y, m, d);
}

export interface ParseCalendarOptions {
  calendar?: CalendarSystem | null;
  precision?: DatePrecision | null;
  allowPartial?: boolean;
}

const PREFIX_TAG_RE = /^(ec|e\.c\.|gc|g\.c\.)\s*:\s*(.+)$/i;
const SUFFIX_TAG_RE = /^(.+?)\s+(ec|e\.c\.|gc|g\.c\.)$/i;
const FULL_ISO_RE =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const MONTH_ONLY_RE = /^(\d{4})-(\d{1,2})$/;
const YEAR_ONLY_RE = /^(\d{4})$/;

export function parseFlexibleCalendarDate(
  rawInput: string,
  options: ParseCalendarOptions = {},
): ParsedCalendarDate | null {
  if (typeof rawInput !== "string") return null;
  let core = rawInput.trim();
  if (!core) return null;

  let inlineCalendar: CalendarSystem | null = null;
  const prefixMatch = PREFIX_TAG_RE.exec(core);
  if (prefixMatch) {
    inlineCalendar = prefixMatch[1].toLowerCase().startsWith("e") ? "ec" : "gc";
    core = prefixMatch[2].trim();
  } else {
    const suffixMatch = SUFFIX_TAG_RE.exec(core);
    if (suffixMatch) {
      inlineCalendar = suffixMatch[2].toLowerCase().startsWith("e")
        ? "ec"
        : "gc";
      core = suffixMatch[1].trim();
    }
  }

  if (
    inlineCalendar &&
    options.calendar &&
    inlineCalendar !== options.calendar
  ) {
    return null;
  }

  const calendar: CalendarSystem = inlineCalendar ?? options.calendar ?? "gc";
  const allowPartial = options.allowPartial ?? true;

  let detectedPrecision: DatePrecision;
  let year: number;
  let month = 1;
  let day = 1;

  const yearMatch = YEAR_ONLY_RE.exec(core);
  const monthMatch = MONTH_ONLY_RE.exec(core);
  const fullMatch = FULL_ISO_RE.exec(core);

  if (yearMatch) {
    detectedPrecision = "year";
    year = Number(yearMatch[1]);
  } else if (monthMatch) {
    detectedPrecision = "month";
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]);
  } else if (fullMatch) {
    detectedPrecision = "day";
    year = Number(fullMatch[1]);
    month = Number(fullMatch[2]);
    day = Number(fullMatch[3]);
  } else {
    return null;
  }

  const precisionOrder: Record<DatePrecision, number> = {
    year: 0,
    month: 1,
    day: 2,
  };
  if (
    options.precision &&
    precisionOrder[options.precision] > precisionOrder[detectedPrecision]
  ) {
    return null;
  }

  const precision: DatePrecision = options.precision ?? detectedPrecision;
  if (!allowPartial && precision !== "day") {
    return null;
  }

  const anchoredMonth = precision === "year" ? 1 : month;
  const anchoredDay = precision === "day" ? day : 1;

  if (calendar === "ec") {
    if (!isValidEthiopianDate(year, anchoredMonth, anchoredDay)) {
      return null;
    }
    const gc = ecToGc(year, anchoredMonth, anchoredDay);
    return {
      isoDate: formatIsoDate(gc.year, gc.month, gc.day),
      precision,
      calendar: "ec",
      year,
      month: anchoredMonth,
      day: anchoredDay,
    };
  }

  if (!isValidGregorianDate(year, anchoredMonth, anchoredDay)) {
    return null;
  }
  return {
    isoDate: formatIsoDate(year, anchoredMonth, anchoredDay),
    precision,
    calendar: "gc",
    year,
    month: anchoredMonth,
    day: anchoredDay,
  };
}

export function getTodayInCalendar(
  calendar: CalendarSystem,
): CalendarDateValue & { isoDate: string } {
  const now = new Date();
  const gcY = now.getFullYear();
  const gcM = now.getMonth() + 1;
  const gcD = now.getDate();
  if (calendar === "ec") {
    const ec = gcToEc(gcY, gcM, gcD);
    return {
      ...ec,
      isoDate: formatIsoDate(ec.year, ec.month, ec.day),
    };
  }
  return {
    year: gcY,
    month: gcM,
    day: gcD,
    isoDate: formatIsoDate(gcY, gcM, gcD),
  };
}

export function formatByPrecision(
  year: number,
  month: number,
  day: number,
  precision: DatePrecision,
): string {
  const y = String(year).padStart(4, "0");
  if (precision === "year") return y;
  const m = String(month).padStart(2, "0");
  if (precision === "month") return `${y}-${m}`;
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function extractIsoParts(
  isoDate?: string | Date | null,
): CalendarDateValue | null {
  if (!isoDate) return null;
  const str =
    isoDate instanceof Date
      ? formatIsoDate(
          isoDate.getFullYear(),
          isoDate.getMonth() + 1,
          isoDate.getDate(),
        )
      : String(isoDate).trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidGregorianDate(year, month, day)) return null;
  return { year, month, day };
}

/**
 * Hydrate a UI CalendarDateFieldValue from a DB record's canonical Gregorian ISO
 * date and companion `_precision` / `_calendar` metadata.
 */
export function fromEntityDate(
  isoDate?: string | Date | null,
  precision: DatePrecision | null | undefined = "day",
  calendar: CalendarSystem | null | undefined = "gc",
): CalendarDateFieldValue {
  const effectivePrecision: DatePrecision = precision ?? "day";
  const effectiveCalendar: CalendarSystem = calendar ?? "gc";
  const gc = extractIsoParts(isoDate);
  if (!gc) {
    return {
      date: null,
      precision: effectivePrecision,
      calendar: effectiveCalendar,
    };
  }
  if (effectiveCalendar === "ec") {
    const ec = gcToEc(gc.year, gc.month, gc.day);
    return {
      date: formatByPrecision(ec.year, ec.month, ec.day, effectivePrecision),
      precision: effectivePrecision,
      calendar: "ec",
    };
  }
  return {
    date: formatByPrecision(gc.year, gc.month, gc.day, effectivePrecision),
    precision: effectivePrecision,
    calendar: "gc",
  };
}

export function parseFieldDateParts(
  value?: CalendarDateFieldValue | null,
): { year: number; month?: number; day?: number } | null {
  if (!value?.date) return null;
  const s = value.date.trim();
  const full = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (full) {
    return {
      year: Number(full[1]),
      month: Number(full[2]),
      day: Number(full[3]),
    };
  }
  const ym = /^(\d{4})-(\d{1,2})$/.exec(s);
  if (ym) {
    return { year: Number(ym[1]), month: Number(ym[2]) };
  }
  const y = /^(\d{4})$/.exec(s);
  if (y) {
    return { year: Number(y[1]) };
  }
  return null;
}

/**
 * Convert an existing UI CalendarDateFieldValue between Gregorian and Ethiopian calendars
 * while preserving the user's selected precision.
 */
export function convertFieldCalendar(
  value: CalendarDateFieldValue,
  targetCalendar: CalendarSystem,
): CalendarDateFieldValue {
  if (value.calendar === targetCalendar) return value;
  if (!value.date) {
    return { ...value, calendar: targetCalendar };
  }
  const parsed = parseFlexibleCalendarDate(value.date, {
    calendar: value.calendar,
    precision: value.precision,
    allowPartial: true,
  });
  if (!parsed) {
    return { date: null, precision: value.precision, calendar: targetCalendar };
  }
  return fromEntityDate(parsed.isoDate, value.precision, targetCalendar);
}

/**
 * Resize precision on a CalendarDateFieldValue in-place (truncating when narrowing,
 * anchoring month/day to 01 when expanding).
 */
export function convertFieldPrecision(
  value: CalendarDateFieldValue,
  targetPrecision: DatePrecision,
): CalendarDateFieldValue {
  if (value.precision === targetPrecision) return value;
  if (!value.date) {
    return { ...value, precision: targetPrecision };
  }
  const parts = parseFieldDateParts(value);
  if (!parts) {
    return { ...value, date: null, precision: targetPrecision };
  }
  const m = parts.month ?? 1;
  const maxDay =
    value.calendar === "ec"
      ? getEthiopianMonthDays(parts.year, m)
      : getGregorianMonthDays(parts.year, m);
  const d = Math.min(parts.day ?? 1, Math.max(1, maxDay));
  return {
    ...value,
    precision: targetPrecision,
    date: formatByPrecision(parts.year, m, d, targetPrecision),
  };
}

/**
 * Serialize a UI date field into DTO payload properties.
 * For endpoints without precision columns (e.g. plans/tasks), pass `{ includePrecision: false }`.
 */
export function toApiDateFields(
  value: CalendarDateFieldValue | string | null | undefined,
  fieldName: string,
  options: { clearAsNull?: boolean; includePrecision?: boolean } = {},
): Record<string, string | null> {
  const includePrecision = options.includePrecision ?? true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return options.clearAsNull ? { [fieldName]: null } : {};
    }
    const parsed = parseFlexibleCalendarDate(trimmed, {
      allowPartial: includePrecision,
    });
    if (!parsed) {
      return { [fieldName]: trimmed };
    }
    return {
      [fieldName]: formatByPrecision(
        parsed.year,
        parsed.month,
        parsed.day,
        parsed.precision,
      ),
      [`${fieldName}_calendar`]: parsed.calendar,
      ...(includePrecision ? { [`${fieldName}_precision`]: parsed.precision } : {}),
    };
  }

  if (!value || !value.date) {
    return options.clearAsNull ? { [fieldName]: null } : {};
  }

  return {
    [fieldName]: value.date,
    [`${fieldName}_calendar`]: value.calendar,
    ...(includePrecision ? { [`${fieldName}_precision`]: value.precision } : {}),
  };
}

/**
 * Format an equivalent cross-calendar readout for a UI CalendarDateFieldValue or DB ISO date.
 */
export function formatEquivalentRange(
  isoDate: string | Date | null | undefined,
  precision: DatePrecision = "day",
  calendar: CalendarSystem = "gc",
): string | null {
  const gcStart = extractIsoParts(isoDate);
  if (!gcStart) return null;

  if (calendar === "ec") {
    const ec = gcToEc(gcStart.year, gcStart.month, gcStart.day);
    if (precision === "day") {
      return `${GREGORIAN_MONTHS_SHORT[gcStart.month - 1]} ${gcStart.day}, ${gcStart.year} G.C.`;
    }
    if (precision === "month") {
      const endDay = getEthiopianMonthDays(ec.year, ec.month);
      const gcEnd = ecToGc(ec.year, ec.month, endDay);
      if (gcStart.year === gcEnd.year) {
        return `${GREGORIAN_MONTHS_SHORT[gcStart.month - 1]} ${gcStart.day} – ${GREGORIAN_MONTHS_SHORT[gcEnd.month - 1]} ${gcEnd.day}, ${gcEnd.year} G.C.`;
      }
      return `${GREGORIAN_MONTHS_SHORT[gcStart.month - 1]} ${gcStart.year} – ${GREGORIAN_MONTHS_SHORT[gcEnd.month - 1]} ${gcEnd.year} G.C.`;
    }
    const pagumeEnd = getEthiopianMonthDays(ec.year, 13);
    const gcYearEnd = ecToGc(ec.year, 13, pagumeEnd);
    return `${GREGORIAN_MONTHS_SHORT[gcStart.month - 1]} ${gcStart.year} – ${GREGORIAN_MONTHS_SHORT[gcYearEnd.month - 1]} ${gcYearEnd.year} G.C.`;
  }

  const ecStart = gcToEc(gcStart.year, gcStart.month, gcStart.day);
  if (precision === "day") {
    return `${ETHIOPIC_MONTHS[ecStart.month - 1].name} ${ecStart.day}, ${ecStart.year} E.C.`;
  }
  if (precision === "month") {
    const endDay = getGregorianMonthDays(gcStart.year, gcStart.month);
    const ecEnd = gcToEc(gcStart.year, gcStart.month, endDay);
    if (ecStart.year === ecEnd.year) {
      return `${ETHIOPIC_MONTHS[ecStart.month - 1].short}–${ETHIOPIC_MONTHS[ecEnd.month - 1].short} ${ecStart.year} E.C.`;
    }
    return `${ETHIOPIC_MONTHS[ecStart.month - 1].short} ${ecStart.year} – ${ETHIOPIC_MONTHS[ecEnd.month - 1].short} ${ecEnd.year} E.C.`;
  }
  const ecEnd = gcToEc(gcStart.year, 12, 31);
  return `${ETHIOPIC_MONTHS[ecStart.month - 1].short} ${ecStart.year} – ${ETHIOPIC_MONTHS[ecEnd.month - 1].short} ${ecEnd.year} E.C.`;
}

export function formatFieldEquivalent(
  value?: CalendarDateFieldValue | null,
): string | null {
  if (!value?.date) return null;
  const parsed = parseFlexibleCalendarDate(value.date, {
    calendar: value.calendar,
    precision: value.precision,
    allowPartial: true,
  });
  if (!parsed) return null;
  return formatEquivalentRange(parsed.isoDate, value.precision, value.calendar);
}

/**
 * Format a canonical Gregorian DB ISO date for human display honoring its recorded
 * `precision` (`day` | `month` | `year`) and `calendar` (`gc` | `ec`).
 */
export function formatCalendarDate(
  isoDate?: string | Date | null,
  precision: DatePrecision | null | undefined = "day",
  calendar: CalendarSystem | null | undefined = "gc",
  options: { includeEquivalent?: boolean; short?: boolean } = {},
): string {
  const gc = extractIsoParts(isoDate);
  if (!gc) return "N/A";
  const effectivePrecision: DatePrecision = precision ?? "day";
  const effectiveCalendar: CalendarSystem = calendar ?? "gc";

  let main: string;
  if (effectiveCalendar === "ec") {
    const ec = gcToEc(gc.year, gc.month, gc.day);
    const monthLabel = options.short
      ? ETHIOPIC_MONTHS[ec.month - 1].short
      : ETHIOPIC_MONTHS[ec.month - 1].name;
    if (effectivePrecision === "year") {
      main = `${ec.year} E.C.`;
    } else if (effectivePrecision === "month") {
      main = `${monthLabel} ${ec.year} E.C.`;
    } else {
      main = `${monthLabel} ${ec.day}, ${ec.year} E.C.`;
    }
  } else {
    const monthLabel = options.short
      ? GREGORIAN_MONTHS_SHORT[gc.month - 1]
      : GREGORIAN_MONTHS_FULL[gc.month - 1];
    if (effectivePrecision === "year") {
      main = `${gc.year}`;
    } else if (effectivePrecision === "month") {
      main = `${monthLabel} ${gc.year}`;
    } else {
      main = `${GREGORIAN_MONTHS_SHORT[gc.month - 1]} ${gc.day}, ${gc.year}`;
    }
  }

  if (options.includeEquivalent) {
    const eq = formatEquivalentRange(gcToIso(gc), effectivePrecision, effectiveCalendar);
    if (eq) {
      return `${main} (${eq})`;
    }
  }
  return main;
}

function gcToIso(gc: CalendarDateValue): string {
  return formatIsoDate(gc.year, gc.month, gc.day);
}

/**
 * Format a UI CalendarDateFieldValue for summary/review display before submit.
 */
export function formatCalendarDateField(
  value?: CalendarDateFieldValue | null,
  options: { includeEquivalent?: boolean; short?: boolean } = {},
): string {
  if (!value?.date) return "—";
  const parsed = parseFlexibleCalendarDate(value.date, {
    calendar: value.calendar,
    precision: value.precision,
    allowPartial: true,
  });
  if (!parsed) return value.date;
  return formatCalendarDate(parsed.isoDate, value.precision, value.calendar, options);
}

/**
 * Format an unanchored/partial or calendar-aware date input directly for spreadsheet export
 * (e.g., `"1984 EC"`, `"1999-06 EC"`, `"2019-03-01 EC"`, `"1990"`, `"1990-05"`, `"2024-01-15"`).
 */
export function formatDateForCsv(
  isoDate?: string | Date | null,
  precision: DatePrecision | null | undefined = "day",
  calendar: CalendarSystem | null | undefined = "gc",
): string {
  const field = fromEntityDate(isoDate, precision, calendar);
  if (!field.date) return "";
  return field.calendar === "ec" ? `${field.date} EC` : field.date;
}

export interface AgeResult {
  age: number;
  approximate: boolean;
  label: string;
}

/**
 * Compute integer age respecting date precision and declared calendar.
 */
export function computeCalendarAge(
  isoDate?: string | Date | null,
  precision: DatePrecision | null | undefined = "day",
  calendar: CalendarSystem | null | undefined = "gc",
  now: Date = new Date(),
): AgeResult | null {
  const gc = extractIsoParts(isoDate);
  if (!gc) return null;

  const effectivePrecision: DatePrecision = precision ?? "day";
  const effectiveCalendar: CalendarSystem = calendar ?? "gc";
  const todayGcY = now.getFullYear();
  const todayGcM = now.getMonth() + 1;
  const todayGcD = now.getDate();

  if (effectivePrecision === "day") {
    let age = todayGcY - gc.year;
    if (todayGcM < gc.month || (todayGcM === gc.month && todayGcD < gc.day)) {
      age -= 1;
    }
    const safeAge = Math.max(0, age);
    return { age: safeAge, approximate: false, label: `${safeAge} yrs` };
  }

  if (effectiveCalendar === "ec") {
    const birthEc = gcToEc(gc.year, gc.month, gc.day);
    const todayEc = gcToEc(todayGcY, todayGcM, todayGcD);
    let age = todayEc.year - birthEc.year;
    if (effectivePrecision === "month" && todayEc.month < birthEc.month) {
      age -= 1;
    }
    const safeAge = Math.max(0, age);
    return { age: safeAge, approximate: true, label: `~${safeAge} yrs` };
  }

  let age = todayGcY - gc.year;
  if (effectivePrecision === "month" && todayGcM < gc.month) {
    age -= 1;
  }
  const safeAge = Math.max(0, age);
  return { age: safeAge, approximate: true, label: `~${safeAge} yrs` };
}

/** Compute age directly from a live UI CalendarDateFieldValue (e.g. child form DOB picker). */
export function computeAgeFromFieldValue(
  value?: CalendarDateFieldValue | null,
): number | undefined {
  if (!value?.date) return undefined;
  const parsed = parseFlexibleCalendarDate(value.date, {
    calendar: value.calendar,
    precision: value.precision,
    allowPartial: true,
  });
  if (!parsed) return undefined;
  const result = computeCalendarAge(parsed.isoDate, value.precision, value.calendar);
  return result?.age;
}
