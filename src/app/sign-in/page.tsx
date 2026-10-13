import Link from 'next/link';
import { auth, githubEnabled, signIn, signOut } from '@/auth';
import { Button } from '@/components/ui/button';
import { LogIn, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const session = githubEnabled ? await auth() : null;
  return (
    <div className="auth-panel">
      <span className="heading-note">Your Khulla Patro</span>
      <h1>{session ? `Hello, ${session.user?.name ?? 'there'}.` : 'Keep it personal.'}</h1>
      <p>The calendar, rashifal, and market pages are always open.</p>
      {query.error ? (
        <div className="data-notice" role="alert">
          Sign-in could not complete. Try again or continue to the calendar.
        </div>
      ) : null}
      {session ? (
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      ) : githubEnabled ? (
        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: '/' });
          }}
        >
          <Button type="submit">
            <LogIn size={17} /> Continue with GitHub
          </Button>
        </form>
      ) : (
        <p className="auth-unconfigured">
          Optional GitHub sign-in is not configured on this installation. You can use all three
          sections without an account.
        </p>
      )}
      <Link href="/" className="auth-back">
        <ArrowLeft size={14} /> Back to the calendar
      </Link>
    </div>
  );
}
