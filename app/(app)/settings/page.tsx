import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Settings — Goro Full Gospel Church',
};

import AppSkeleton from '@/Components/common/skeletons/AppSkeleton';

const SettingsClient = dynamic(() => import('@/views/Settings/Settings'), {
  loading: () => <AppSkeleton />,
});

export default function SettingsPage() {
  return <SettingsClient />;
}
