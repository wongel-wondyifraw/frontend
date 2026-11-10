'use client';

import { useSyncExternalStore } from 'react';
import { useUser } from '@/context/UserContext';

const subscribeNoop = () => () => {};

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TopbarGreeting() {
  const { user } = useUser();
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const now = isClient ? new Date() : null;

  const today = now
    ? now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const shortDate = now
    ? now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;
  const firstName = user ? user.first_name : null;
  const greeting = now ? greetingForHour(now.getHours()) : 'Welcome';

  return (
    <div className="greeting-section">
      <h1>
        <span className="greeting-full">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </span>
        <span className="greeting-short">{firstName || greeting}</span>
      </h1>
      <p className="date-text">
        <span className="date-full">{today ? `It's ${today}` : '\u00A0'}</span>
        <span className="date-short">{shortDate || '\u00A0'}</span>
      </p>
    </div>
  );
}
