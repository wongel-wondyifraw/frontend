import ManageHomeGroups from '@/views/HomeGroups/ManageHomeGroups';
import { getHomeGroupsServer } from '@/lib/api-server';

export const metadata = {
  title: 'Home Groups — Shepherd.One',
};

export default async function HomeGroupsPage() {
  let initialPage = null;
  try {
    initialPage = await getHomeGroupsServer({ page: 1, limit: 10 });
  } catch {
    initialPage = null;
  }
  return <ManageHomeGroups initialPage={initialPage} />;
}
