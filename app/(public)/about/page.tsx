'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/** About is managed under Landing Page → About (homepage #about). */
export default function AboutPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/#about');
  }, [router]);
  return (
    <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
