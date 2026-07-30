import LoginPage from '@/views/LoginPage/LoginPage';
import { pageTitle, TENANT } from '@/lib/tenant';

export const metadata = {
  title: pageTitle('Login'),
  description: `Sign in to ${TENANT.name}.`,
};

export default function LoginRoute() {
  return <LoginPage />;
}
