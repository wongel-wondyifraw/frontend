import type { Dayjs } from 'dayjs';

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
  date_of_birth?: Dayjs;
  joined_date?: Dayjs;
  image_url?: string;
};

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

  const middleName = values.middle_name?.trim();
  if (middleName) payload.middle_name = middleName;

  const email = values.email?.trim();
  if (email) payload.email = email;

  const phone = values.phone?.trim();
  if (phone) payload.phone = phone;

  const address = values.address?.trim();
  if (address) payload.address = address;

  if (values.marital_status) payload.marital_status = values.marital_status;
  if (values.gender) payload.gender = values.gender;
  if (values.status) payload.status = values.status;

  if (values.date_of_birth) {
    payload.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
  }
  if (values.joined_date) {
    payload.joined_date = values.joined_date.format('YYYY-MM-DD');
  }

  if (values.baptized === 'yes' || values.baptized === true) {
    payload.baptized = true;
  } else if (values.baptized === 'no' || values.baptized === false) {
    payload.baptized = false;
  }

  if (values.image_url) payload.image_url = values.image_url;

  return payload;
}
