'use client';

import { useUser } from '@/context/UserContext';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TopbarGreeting() {
  const { user } = useUser();
  const now = new Date();
  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const shortDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const firstName = user ? user.first_name : '...';
  const greeting = greetingForHour(now.getHours());

  return (
    <div className="greeting-section">
      <h1>
        <span className="greeting-full">
          {greeting}, {firstName}
        </span>
        <span className="greeting-short">{firstName}</span>
      </h1>
      <p className="date-text">
        <span className="date-full">It&apos;s {today}</span>
        <span className="date-short">{shortDate}</span>
      </p>
    </div>
  );
}
