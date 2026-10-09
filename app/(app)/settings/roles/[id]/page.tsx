import React from 'react';
import RoleDetailPage from '@/views/Settings/RoleDetailPage';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <RoleDetailPage id={resolvedParams.id} isNew={false} />;
}
