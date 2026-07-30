import FamilyDetail from '@/views/Families/FamilyDetail';

export const metadata = {
  title: 'Family Details — Goro Full Gospel Church',
};

export default async function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FamilyDetail familyId={id} />;
}
