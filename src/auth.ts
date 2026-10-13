import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const githubEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.AUTH_SECRET,
);
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: githubEnabled ? [GitHub] : [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in', error: '/sign-in' },
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith('/') && !url.startsWith('//')) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        /* Fall back to our own origin. */
      }
      return baseUrl;
    },
  },
});
