import Planning from '@/views/Planning/Planning';
import { Suspense } from 'react';

export const metadata = {
  title: 'Planning — Goro Full Gospel Church',
};

export default function PlanningPage() {
  return (
    <Suspense fallback={null}>
      <Planning />
    </Suspense>
  );
}
