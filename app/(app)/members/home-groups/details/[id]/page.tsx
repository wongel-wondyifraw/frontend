import HomeGroupDetail from '@/views/HomeGroups/HomeGroupDetail';
import { getHomeGroupServer } from '@/lib/api-server';

export const metadata = {
  title: 'Home Group Details — Shepherd.One',
};

export default async function HomeGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialHomeGroup = null;
  try {
    initialHomeGroup = await getHomeGroupServer(id);
  } catch {
    initialHomeGroup = null;
  }
  return <HomeGroupDetail homeGroupId={id} initialHomeGroup={initialHomeGroup} />;
}
