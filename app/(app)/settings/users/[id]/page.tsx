import UserDetailPage from '@/views/Settings/UserDetailPage';

export const metadata = {
  title: 'User Details — Goro Full Gospel Church',
};

export default async function UserDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <UserDetailPage userId={resolvedParams.id} />;
}
