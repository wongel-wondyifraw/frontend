import GenericPublicPage from '@/views/LandingPage/GenericPublicPage';
import { TENANT } from '@/lib/tenant';

export const metadata = {
  title: `Vision | ${TENANT.name}`,
};

export default function VisionPage() {
  return <GenericPublicPage slug="vision" title="Our Vision" />;
}
