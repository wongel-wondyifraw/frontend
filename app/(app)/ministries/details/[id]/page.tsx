import MinistryDetail from '@/views/Ministries/MinistryDetail';
import { getMinistryServer } from '@/lib/api-server';

export const metadata = {
  title: 'Ministry Details — Goro Full Gospel Church',
};

export default async function MinistryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialMinistry = null;

  try {
    initialMinistry = await getMinistryServer(id);
  } catch {
    initialMinistry = null;
  }

  return <MinistryDetail ministryId={id} initialMinistry={initialMinistry} />;
}
