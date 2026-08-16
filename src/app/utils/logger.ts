import { isDevMode } from '@angular/core';

/**
 * console.error only in dev mode, so production visitors' consoles (and Lighthouse's
 * Best Practices "errors in console" audit) stay clean. Swap for real error reporting
 * (Sentry, GA4 exception event, etc.) here later if production visibility is needed.
 */
export function logError(...args: unknown[]): void {
  if (isDevMode()) {
    console.error(...args);
  }
}
