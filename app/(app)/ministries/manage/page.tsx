import ManageMinistries from '@/views/Ministries/ManageMinistries';
import { getMinistriesServer } from '@/lib/api-server';

export const metadata = {
  title: 'Manage Ministries — Shepherd.One',
};

export default async function ManageMinistriesPage() {
  let initialPage = null;

  try {
    initialPage = await getMinistriesServer({ page: 1, limit: 10 });
  } catch {
    initialPage = null;
  }

  return <ManageMinistries initialPage={initialPage} />;
}
