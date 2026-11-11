import {
  toApiDateFields,
  type CalendarDateFieldValue,
} from "@/lib/ethiopian-calendar";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "@/lib/name-normalizer";

export type MinisterFormValues = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  marital_status?: string;
  gender?: string;
  status?: string;
  title?: string;
  date_of_birth?: CalendarDateFieldValue | string | null;
  joined_date?: CalendarDateFieldValue | string | null;
  image_url?: string;
};

export function buildMinisterPayload(
  values: MinisterFormValues,
  extras: Record<string, unknown> = {},
  options: { clearEmptyDates?: boolean } = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    first_name: normalizePersonName(values.first_name ?? ""),
    last_name: normalizePersonName(values.last_name ?? ""),
    email: values.email?.trim().toLowerCase() ?? "",
    ...extras,
  };

  const middleName = normalizePersonName(values.middle_name ?? "");
  if (middleName) payload.middle_name = middleName;

  const phone = values.phone?.trim();
  if (phone) payload.phone = phone;

  const address = values.address?.trim();
  if (address) payload.address = address;

  const title = normalizeTitleInitials(values.title ?? "");
  if (title) payload.title = title;

  if (values.marital_status) payload.marital_status = values.marital_status;
  if (values.gender) payload.gender = values.gender;
  if (values.status) payload.status = values.status;

  Object.assign(
    payload,
    toApiDateFields(values.date_of_birth, "date_of_birth", {
      clearAsNull: options.clearEmptyDates,
    }),
    toApiDateFields(values.joined_date, "joined_date", {
      clearAsNull: options.clearEmptyDates,
    }),
  );

  if (values.image_url) payload.image_url = values.image_url;

  return payload;
}
