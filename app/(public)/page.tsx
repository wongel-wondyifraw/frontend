import dynamic from 'next/dynamic';
import { TENANT, PLATFORM } from '@/lib/tenant';
import PublicSkeleton from '@/Components/common/skeletons/PublicSkeleton';

export const metadata = {
  title: TENANT.name,
  description: `${TENANT.tagline} Managed with ${PLATFORM.name}.`,
};

/* Split ChurchFeed (+ antd/framer/landing CSS) out of the initial route chunk
 * so first paint is not blocked on the full landing JS/CSS graph. */
const ChurchFeed = dynamic(() => import('@/views/LandingPage/ChurchFeed'), {
  loading: () => <PublicSkeleton />,
  ssr: true,
});

export default function LandingPage() {
  return <ChurchFeed />;
}
