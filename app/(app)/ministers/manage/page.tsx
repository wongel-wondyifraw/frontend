import ManageMinisters from '@/views/Ministers/ManageMinisters';
import { getMinistersServer } from '@/lib/api-server';

export const metadata = {
  title: 'Manage Ministers — Shepherd.One',
};

export default async function ManageMinistersPage() {
  let initialPage = null;
  try {
    initialPage = await getMinistersServer({ page: 1, limit: 10 });
  } catch {
    initialPage = null;
  }
  return <ManageMinisters initialPage={initialPage} />;
}
