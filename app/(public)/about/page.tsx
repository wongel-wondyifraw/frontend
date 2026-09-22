import GenericPublicPage from '@/views/LandingPage/GenericPublicPage';
import { TENANT } from '@/lib/tenant';

export const metadata = {
  title: `About | ${TENANT.name}`,
};

export default function AboutPage() {
  return <GenericPublicPage slug="about" title="About Us" />;
}
