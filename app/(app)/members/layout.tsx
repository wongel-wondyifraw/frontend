import type { ReactNode } from 'react';
import { MembersProvider } from '@/context/MembersContext';

export default function MembersLayout({ children }: { children: ReactNode }) {
  return <MembersProvider>{children}</MembersProvider>;
}

