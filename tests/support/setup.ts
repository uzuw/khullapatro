import { rm } from 'node:fs/promises';

export default async function setup() {
  // Only dedicated test caches: fixture revisions must not reuse an older valid series.
  await rm('.cache/playwright', { recursive: true, force: true });
  await rm('.cache/playwright-auth', { recursive: true, force: true });
}
