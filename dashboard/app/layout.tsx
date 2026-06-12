import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Superintendent', description: 'Observability dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (Grammarly, etc.) inject
          attributes on <body> before React hydrates; harmless. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
