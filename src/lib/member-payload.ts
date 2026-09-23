import type { Dayjs } from 'dayjs';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
const DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) {
    return 'Photo must be JPEG, PNG, GIF, or WebP';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'Photo must be 5MB or smaller';
  }
  return null;
}

export function validateDocumentFile(file: File): string | null {
  const okType = DOC_TYPES.has(file.type) || /\.(pdf|doc|docx|txt|jpe?g|png)$/i.test(file.name);
  if (!okType) {
    return 'Letter must be PDF, DOC, DOCX, TXT, or an image';
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return 'Document must be 15MB or smaller';
  }
  return null;
}

export function fileDisplayName(file: File | null, url?: string | null): string {
  if (file?.name) return file.name;
  if (!url) return '';
  try {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch {
    return url;
  }
}

export const MEMBER_TYPE_OPTIONS = [
  { value: 'existing', label: 'Existing Member' },
  { value: 'baptized', label: 'Baptized Member' },
  { value: 'transferred', label: 'Transferred' },
];

export const VISITATION_METHOD_OPTIONS = ['Home', 'Office', 'Phone'];

type MemberFormValues = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  marital_status?: string;
  gender?: string;
  status?: string;
  baptized?: string | boolean;
  holy_spirit_baptized?: string | boolean;
  date_of_birth?: Dayjs;
  joined_date?: Dayjs;
  salvation_date?: Dayjs;
  image_url?: string;
  recommendation_letter_url?: string;
  telegram_username?: string;
  facebook_username?: string;
  instagram_username?: string;
  whatsapp_number?: string;
  member_type?: string;
  location_id?: string;
  interested_ministries?: string[];
  employment_status?: string;
  profession?: string;
  employer?: string;
  education_level?: string;
  education_field?: string;
};

function yesNoToBool(value: unknown): boolean | undefined {
  if (value === 'yes' || value === true) return true;
  if (value === 'no' || value === false) return false;
  return undefined;
}

function setOptionalString(payload: Record<string, unknown>, key: string, value?: string) {
  const trimmed = value?.trim();
  if (trimmed) payload[key] = trimmed;
}

/** Build a JSON body Nest can validate — omit empty optional strings. */
export function buildMemberPayload(
  values: MemberFormValues,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    first_name: values.first_name?.trim() ?? '',
    last_name: values.last_name?.trim() ?? '',
    ...extras,
  };

  setOptionalString(payload, 'middle_name', values.middle_name);
  setOptionalString(payload, 'email', values.email);
  setOptionalString(payload, 'phone', values.phone);
  setOptionalString(payload, 'address', values.address);
  setOptionalString(payload, 'marital_status', values.marital_status);
  setOptionalString(payload, 'gender', values.gender);
  setOptionalString(payload, 'status', values.status);
  setOptionalString(payload, 'location_id', values.location_id);
  setOptionalString(payload, 'image_url', values.image_url);
  setOptionalString(payload, 'recommendation_letter_url', values.recommendation_letter_url);
  setOptionalString(payload, 'employment_status', values.employment_status);
  setOptionalString(payload, 'profession', values.profession);
  setOptionalString(payload, 'employer', values.employer);
  setOptionalString(payload, 'education_level', values.education_level);
  setOptionalString(payload, 'education_field', values.education_field);
  setOptionalString(payload, 'facebook_username', values.facebook_username);
  setOptionalString(payload, 'instagram_username', values.instagram_username);
  setOptionalString(payload, 'whatsapp_number', values.whatsapp_number);
  setOptionalString(payload, 'member_type', values.member_type);

  const telegram = values.telegram_username?.trim().replace(/^@+/, '');
  if (telegram) payload.telegram_username = telegram;

  if (values.date_of_birth) payload.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
  if (values.joined_date) payload.joined_date = values.joined_date.format('YYYY-MM-DD');
  if (values.salvation_date) payload.salvation_date = values.salvation_date.format('YYYY-MM-DD');

  const baptized = yesNoToBool(values.baptized);
  if (baptized !== undefined) payload.baptized = baptized;

  const hs = yesNoToBool(values.holy_spirit_baptized);
  if (hs !== undefined) payload.holy_spirit_baptized = hs;

  if (values.interested_ministries?.length) {
    payload.interested_ministries = values.interested_ministries;
  }

  const memberType = (values.member_type || 'existing').toLowerCase();
  const hasLetter = Boolean(values.recommendation_letter_url?.trim() || extras.recommendation_letter_url);
  payload.requires_follow_up = memberType === 'transferred' && !hasLetter;

  return payload;
}
