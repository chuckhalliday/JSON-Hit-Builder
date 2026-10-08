import { useSyncExternalStore } from 'react';

// Light/dark theme. "system" follows the OS; "light" or "dark" pins it by
// setting data-theme on <html>, which the token blocks in index.scss key on.
// index.html applies the stored choice before first paint so the page
// doesn't flash the other theme while the bundle loads.
export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const listeners = new Set<() => void>();
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function readStored(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

let pref: ThemePref = typeof window !== 'undefined' ? readStored() : 'system';

const notify = () => listeners.forEach((l) => l());
media?.addEventListener('change', notify);

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch { /* the choice still applies for this visit */ }
  if (next === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  notify();
}

const resolve = (): Theme => (pref === 'system' ? (media?.matches ? 'dark' : 'light') : pref);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, () => pref);
}

// The theme actually showing - for drawing code (the staff canvas) that
// has to repaint when it changes.
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, resolve);
}
