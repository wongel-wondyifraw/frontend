'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/** Contact is managed under Landing Page → Contact (homepage #contact). */
export default function ContactPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/#contact');
  }, [router]);
  return (
    <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
