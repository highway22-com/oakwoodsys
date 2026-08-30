import { isDevMode } from '@angular/core';

/**
 * Browser: console.error only in dev mode, so production visitors' consoles (and
 * Lighthouse's Best Practices "errors in console" audit) stay clean.
 * Server (SSR): always logs, dev or prod — this only ever reaches Netlify's function
 * logs, never a visitor's console, so there's no reason to suppress it there. Without
 * this, every SSR-side fetch/render failure was completely invisible in production logs.
 * Swap for real error reporting (Sentry, GA4 exception event, etc.) here later if more
 * structured production visibility is needed.
 */
export function logError(...args: unknown[]): void {
  const isServer = typeof window === 'undefined';
  if (isServer || isDevMode()) {
    console.error(...args);
  }
}

/** Same platform rule as logError, but for expected/operational events (e.g. "a rate
 *  limiter engaged") that aren't failures — console.info so Netlify's log viewer keeps
 *  them at "info" severity instead of lumping them in with real errors. */
export function logInfo(...args: unknown[]): void {
  const isServer = typeof window === 'undefined';
  if (isServer || isDevMode()) {
    console.info(...args);
  }
}
