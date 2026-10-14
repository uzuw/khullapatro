'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const storageKey = 'khullapatro-theme';
const changeEvent = 'khullapatro-theme-change';
const getSnapshot = () => document.documentElement.dataset.theme === 'dark';
const getServerSnapshot = () => false;

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const syncPreference = () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      // Storage can be blocked; the current page still supports the toggle.
    }
    document.documentElement.dataset.theme =
      saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light';
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) syncPreference();
  };
  window.addEventListener(changeEvent, onChange);
  window.addEventListener('storage', onStorage);
  media.addEventListener('change', syncPreference);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', syncPreference);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => {
    const theme = getSnapshot() ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // A denied write must not prevent changing the current page theme.
    }
    window.dispatchEvent(new Event(changeEvent));
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
