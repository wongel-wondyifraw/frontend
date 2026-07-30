import MinisterDetail from '@/views/Ministers/MinisterDetail';
import { getMinisterServer } from '@/lib/api-server';

export const metadata = {
  title: 'Minister Details — Shepherd.One',
};

export default async function MinisterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialMinister = null;
  try {
    initialMinister = await getMinisterServer(id);
  } catch {
    initialMinister = null;
  }
  return <MinisterDetail ministerId={id} initialMinister={initialMinister} />;
}
