import ManageMembers from '@/views/Members/ManageMembers';
import { getMembersServer } from '@/lib/api-server';

export const metadata = {
  title: 'Manage Members — Goro Full Gospel Church',
};

export default async function ManageMembersPage() {
  let initialPage = null;

  try {
    initialPage = await getMembersServer({ page: 1, limit: 10 });
  } catch {
    initialPage = null;
  }

  return <ManageMembers initialPage={initialPage} />;
}
