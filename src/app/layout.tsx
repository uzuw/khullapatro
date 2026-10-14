import type { Metadata } from 'next';
import { Manrope, Noto_Sans_Devanagari } from 'next/font/google';
import { Shell } from '@/components/shell';
import { githubEnabled } from '@/auth';
import { version } from '../../package.json';
import './globals.css';

// Apply the saved/system theme before paint; no network request or user content.
const themeInit = `(()=>{let t;try{t=localStorage.getItem('khullapatro-theme')}catch{}document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const nepali = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-nepali',
  display: 'swap',
});
export const metadata: Metadata = {
  title: { default: 'Khulla Patro · A simpler Nepali calendar', template: '%s · Khulla Patro' },
  description:
    'Nepali calendar events, daily rashifal, and Nepal gold and silver rates. A little less noise.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${manrope.variable} ${nepali.variable}`}>
        <Shell signInEnabled={githubEnabled} version={version}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
