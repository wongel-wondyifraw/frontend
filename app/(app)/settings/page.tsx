import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Settings — Goro Full Gospel Church',
};

const SettingsClient = dynamic(() => import('@/views/Settings/Settings'), {
  loading: () => (
    <div className="page-loading">
      <div className="page-loading-spinner" aria-label="Loading settings" />
    </div>
  ),
});

export default function SettingsPage() {
  return <SettingsClient />;
}
