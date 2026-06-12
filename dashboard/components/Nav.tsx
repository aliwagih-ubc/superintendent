'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, DollarSign, History } from 'lucide-react';

const links = [
  { href: '/', label: 'Now', icon: Activity },
  { href: '/cost', label: 'Cost', icon: DollarSign },
  { href: '/history', label: 'History', icon: History },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4 border-r border-[var(--color-border)] w-48 min-h-screen">
      <div className="text-[var(--color-accent)] font-bold mb-4 text-sm tracking-wider">SUPERINTENDENT</div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="text-[var(--color-muted)] text-xs hover:text-[var(--color-text)] w-full text-left px-3 py-2"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
