'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Sparkles, ChartNoAxesCombined, MapPin, ArrowUpRight } from 'lucide-react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', title: 'Calendar', np: 'पात्रो', icon: CalendarDays },
  { href: '/rashifal', title: 'Rashifal', np: 'राशिफल', icon: Sparkles },
  { href: '/metals', title: 'Gold & silver', np: 'सुनचाँदी', icon: ChartNoAxesCombined },
];

export function Shell({
  children,
  signInEnabled,
}: {
  children: React.ReactNode;
  signInEnabled: boolean;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="page-width flex h-21 items-center justify-between gap-4">
          <Link href="/" className="brand" aria-label="OpenPatro home">
            <span className="brand-mark">
              <CalendarDays size={22} strokeWidth={1.65} />
            </span>
            <span>
              open<span className="font-extrabold">patro</span>
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="location">
              <MapPin size={13} /> Kathmandu, Nepal
            </span>
            {signInEnabled ? (
              <Link href="/sign-in" className="text-sm font-semibold hover:text-primary">
                Sign in <ArrowUpRight className="inline size-3" />
              </Link>
            ) : null}
            <span className="quiet-tag">A simpler everyday</span>
          </div>
        </div>
      </header>
      <div className="nav-bar">
        <nav className="page-width flex gap-2" aria-label="Main navigation">
          {links.map(({ href, title, np, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn('nav-link', pathname === href && 'active')}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span>{title}</span>
              <span lang="ne" className="np nav-np">
                {np}
              </span>
              {pathname === href ? (
                <motion.span
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ duration: reduced ? 0 : 0.2 }}
                />
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
      <main id="main" className="page-width main-content">
        {children}
      </main>
      <footer className="page-width footer">
        <span>
          OpenPatro <span className="footer-dot">·</span> Made for a little less noise.
        </span>
        <span lang="ne" className="np">
          पात्रो, राशिफल र सुनचाँदी।
        </span>
      </footer>
    </MotionConfig>
  );
}

export function PageMotion({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
