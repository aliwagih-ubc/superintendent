import type { ReactNode } from 'react';
import Nav from './Nav';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
