import BibleStudyDetail from '@/views/BibleStudy/BibleStudyDetail';
import { getBibleStudyServer } from '@/lib/api-server';

export const metadata = {
  title: 'Bible Study Details — Goro Full Gospel Church',
};

export default async function BibleStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialBibleStudy = null;
  try {
    initialBibleStudy = await getBibleStudyServer(id);
  } catch {
    initialBibleStudy = null;
  }
  return <BibleStudyDetail bibleStudyId={id} initialBibleStudy={initialBibleStudy} />;
}
