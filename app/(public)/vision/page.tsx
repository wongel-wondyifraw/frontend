'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/** Vision is managed under Landing Page → Vision (homepage #vision). */
export default function VisionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/#vision');
  }, [router]);
  return (
    <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
