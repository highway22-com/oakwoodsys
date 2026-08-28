import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { from, throwError, timer } from 'rxjs';
import { retry, switchMap, finalize } from 'rxjs/operators';
import { logError, logInfo } from '../utils/logger';

/**
 * The CMS backend (oakwoodsystemsgroup.com) sits behind a Cloudflare rate limit that isn't
 * scoped to our own SSR/prerender traffic — a build or a burst of concurrent page renders can
 * fire far more GraphQL/REST requests than Node needs to queue at once, tripping a 429 (which
 * Cloudflare answers with an HTML challenge page instead of JSON). Getting the limit itself
 * adjusted is a Cloudflare-side fix; this is the half we control: don't hammer the backend
 * faster than it can take, and recover automatically when we do get rate-limited anyway.
 */
const MAX_CONCURRENT = 5;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 8000;

let activeCount = 0;
const waiters: Array<() => void> = [];

function acquireSlot(url: string): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  // Positive evidence the concurrency cap is actually engaging, not just present in code —
  // a clean/no-429 build run proves nothing on its own, since the failure is load-dependent.
  logInfo(
    `[cms-throttle] queuing request (active=${activeCount}, queued=${waiters.length + 1}): ${url}`,
  );
  return new Promise((resolve) => waiters.push(resolve));
}

function releaseSlot(): void {
  const next = waiters.shift();
  if (next) {
    next(); // hand the slot straight to the next waiter — activeCount is unchanged
  } else {
    activeCount--;
  }
}

function isCmsRequest(url: string): boolean {
  return (
    url.includes('oakwoodsystemsgroup.com') ||
    url.startsWith('/api/graphql') ||
    url.startsWith('/api/wordpress-page') ||
    url.startsWith('/api/cms/')
  );
}

function retryDelay(error: unknown, retryCount: number) {
  if (!(error instanceof HttpErrorResponse) || error.status !== 429) {
    return throwError(() => error);
  }
  const retryAfterHeader = error.headers?.get('Retry-After');
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN;
  const backoffMs = Number.isFinite(retryAfterMs)
    ? retryAfterMs
    : Math.min(BASE_BACKOFF_MS * 2 ** (retryCount - 1), MAX_BACKOFF_MS);
  logError(
    `[cms-throttle] 429 from ${error.url}, retrying in ${backoffMs}ms (attempt ${retryCount}/${MAX_RETRIES})`,
  );
  return timer(backoffMs);
}

export const cmsThrottleInterceptor: HttpInterceptorFn = (req, next) => {
  const url = typeof req.url === 'string' ? req.url : String(req.url);
  if (!isCmsRequest(url)) {
    return next(req);
  }

  return from(acquireSlot(url)).pipe(
    switchMap(() =>
      next(req).pipe(
        retry({ count: MAX_RETRIES, delay: retryDelay }),
        finalize(() => releaseSlot()),
      ),
    ),
  );
};
