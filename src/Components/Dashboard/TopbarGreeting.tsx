'use client';

import { useUser } from '@/context/UserContext';

export default function TopbarGreeting() {
  const { user } = useUser();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="greeting-section">
      <h1>Good Afternoon, {user ? user.first_name : '...'}</h1>
      <p className="date-text">It&apos;s {today}</p>
    </div>
  );
}
