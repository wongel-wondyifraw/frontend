import Dashboard from '@/views/Dashboard/Dashboard';
import { getDashboardStatsServer } from '@/lib/api-server';

export const metadata = {
  title: 'Dashboard — Goro Full Gospel Church',
};

export default async function DashboardPage() {
  let initialStats = null;

  try {
    initialStats = await getDashboardStatsServer();
  } catch {
    initialStats = null;
  }

  return <Dashboard initialStats={initialStats} />;
}
