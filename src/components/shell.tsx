'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Sparkles, ChartNoAxesCombined, MapPin, ArrowUpRight } from 'lucide-react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', title: 'Calendar', np: 'पात्रो', icon: CalendarDays },
  { href: '/rashifal', title: 'Rashifal', np: 'राशिफल', icon: Sparkles },
  { href: '/metals', title: 'Gold & silver', np: 'सुनचाँदी', icon: ChartNoAxesCombined },
];

export function Shell({
  children,
  signInEnabled,
  version,
}: {
  children: React.ReactNode;
  signInEnabled: boolean;
  version: string;
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
          <Link href="/" className="brand" aria-label="Khulla Patro home">
            <span className="brand-mark">
              <CalendarDays size={22} strokeWidth={1.65} />
            </span>
            <span>
              Khulla <span className="font-extrabold">Patro</span>
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
            <ThemeToggle />
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
          Khulla Patro <span className="footer-dot">·</span> Made for a little less noise.
        </span>
        <span className="footer-credit">
          Made by{' '}
          <a
            href="https://github.com/uzuw"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="uzuw on GitHub"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 .75a11.25 11.25 0 0 0-3.557 21.923c.563.104.769-.244.769-.542 0-.267-.01-.975-.015-1.914-3.13.68-3.791-1.508-3.791-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.077-.685.077-.685 1.13.08 1.725 1.16 1.725 1.16 1.004 1.72 2.633 1.223 3.275.935.102-.727.393-1.223.715-1.504-2.499-.284-5.126-1.25-5.126-5.566 0-1.23.44-2.233 1.16-3.02-.116-.285-.503-1.43.11-2.98 0 0 .945-.303 3.094 1.154a10.8 10.8 0 0 1 5.625 0c2.148-1.457 3.092-1.154 3.092-1.154.615 1.55.228 2.695.112 2.98.722.787 1.158 1.79 1.158 3.02 0 4.326-2.631 5.279-5.137 5.557.404.35.763 1.042.763 2.1 0 1.516-.014 2.739-.014 3.11 0 .3.203.65.774.54A11.25 11.25 0 0 0 12 .75Z" />
            </svg>
            uzuw
          </a>
          <span className="footer-dot">·</span>
          <span aria-label={`Version ${version}`}>v{version}</span>
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
