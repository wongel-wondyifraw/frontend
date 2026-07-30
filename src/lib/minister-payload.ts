import type { Dayjs } from 'dayjs';

type MinisterFormValues = {
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
  date_of_birth?: Dayjs;
  joined_date?: Dayjs;
  image_url?: string;
};

export function buildMinisterPayload(
  values: MinisterFormValues,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    first_name: values.first_name?.trim() ?? '',
    last_name: values.last_name?.trim() ?? '',
    email: values.email?.trim().toLowerCase() ?? '',
    ...extras,
  };

  const middleName = values.middle_name?.trim();
  if (middleName) payload.middle_name = middleName;

  const phone = values.phone?.trim();
  if (phone) payload.phone = phone;

  const address = values.address?.trim();
  if (address) payload.address = address;

  const title = values.title?.trim();
  if (title) payload.title = title;

  if (values.marital_status) payload.marital_status = values.marital_status;
  if (values.gender) payload.gender = values.gender;
  if (values.status) payload.status = values.status;

  if (values.date_of_birth) {
    payload.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
  }
  if (values.joined_date) {
    payload.joined_date = values.joined_date.format('YYYY-MM-DD');
  }

  if (values.image_url) payload.image_url = values.image_url;

  return payload;
}
