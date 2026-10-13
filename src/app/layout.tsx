import type { Metadata } from 'next';
import { Manrope, Noto_Sans_Devanagari } from 'next/font/google';
import { Shell } from '@/components/shell';
import { githubEnabled } from '@/auth';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const nepali = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-nepali',
  display: 'swap',
});
export const metadata: Metadata = {
  title: { default: 'OpenPatro · A simpler Nepali calendar', template: '%s · OpenPatro' },
  description:
    'Nepali calendar events, daily rashifal, and Nepal gold and silver rates. A little less noise.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${nepali.variable}`}>
        <Shell signInEnabled={githubEnabled}>{children}</Shell>
      </body>
    </html>
  );
}
