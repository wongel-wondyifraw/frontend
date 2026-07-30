import ManageBibleStudies from '@/views/BibleStudy/ManageBibleStudies';
import { getBibleStudiesServer } from '@/lib/api-server';

export const metadata = {
  title: 'Bible Studies — Shepherd.One',
};

export default async function BibleStudyPage() {
  let initialPage = null;
  try {
    initialPage = await getBibleStudiesServer({ page: 1, limit: 10 });
  } catch {
    initialPage = null;
  }
  return <ManageBibleStudies initialPage={initialPage} />;
}
