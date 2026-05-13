'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  RefreshCw,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { href: '/import', label: 'Import', icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] text-[hsl(213,31%,91%)]"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-40 flex flex-col',
          'bg-[hsl(222,47%,8%)] border-r border-[hsl(222,47%,14%)]',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(222,47%,14%)]">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30">
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">PortfolioPulse</span>
            <p className="text-[10px] text-[hsl(215,20%,55%)] leading-none mt-0.5">Portfolio Analyzer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-[hsl(215,20%,40%)]">
            Main
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-[hsl(215,20%,60%)] hover:text-[hsl(213,31%,91%)] hover:bg-[hsl(222,47%,14%)]'
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    isActive ? 'text-blue-400' : 'text-[hsl(215,20%,55%)]'
                  )}
                />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[hsl(222,47%,14%)]">
          <div className="flex items-center gap-2 text-xs text-[hsl(215,20%,45%)]">
            <RefreshCw size={12} />
            <span>Data from Yahoo Finance</span>
          </div>
        </div>
      </aside>
    </>
  );
}
