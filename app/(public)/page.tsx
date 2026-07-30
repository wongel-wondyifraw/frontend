import ChurchFeed from '@/views/LandingPage/ChurchFeed';
import { TENANT, PLATFORM } from '@/lib/tenant';

export const metadata = {
  title: TENANT.name,
  description: `${TENANT.tagline} Managed with ${PLATFORM.name}.`,
};

export default function LandingPage() {
  return <ChurchFeed />;
}
