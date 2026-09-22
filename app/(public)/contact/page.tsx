import GenericPublicPage from '@/views/LandingPage/GenericPublicPage';
import { TENANT } from '@/lib/tenant';

export const metadata = {
  title: `Contact | ${TENANT.name}`,
};

export default function ContactPage() {
  return <GenericPublicPage slug="contact" title="Contact Us" />;
}
