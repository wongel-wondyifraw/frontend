import MemberDetail from '@/views/Members/MemberDetail';
import { getMemberServer } from '@/lib/api-server';

export const metadata = {
  title: 'Member Details — Shepherd.One',
};

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialMember = null;

  try {
    initialMember = await getMemberServer(id);
  } catch {
    initialMember = null;
  }

  return <MemberDetail memberId={id} initialMember={initialMember} />;
}
