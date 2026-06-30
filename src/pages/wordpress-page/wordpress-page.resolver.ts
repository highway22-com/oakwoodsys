import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

import { SeoMetaService } from '../../app/services/seo-meta.service';
import { WordPressPageResponse, WordPressPageService } from '../../app/services/wordpress-page.service';
import { applyWordPressPageSeo } from './wordpress-page.seo';

export function resolveWordPressFetchPath(path: string): string {
  const normalized = path.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return normalized;
  }

  const segments = normalized.split('/').filter(Boolean);
  // Keep vanity solutions URLs in the browser (e.g. /solutions/ai/ai-application-development)
  // but resolve WordPress pages by their actual slug for backend lookup.
  if (segments[0] === 'solutions' && segments.length >= 3) {
    return segments[segments.length - 1] ?? normalized;
  }

  return normalized;
}

export function resolveWordPressPathFromRoute(route: ActivatedRouteSnapshot, router: Router): string {
  const paramSlug = route.paramMap.get('wpPageSlug');
  if (paramSlug) {
    return decodeURIComponent(paramSlug);
  }

  const routePath = route.url.map((segment) => segment.path).join('/');
  if (routePath) {
    return decodeURIComponent(routePath);
  }
  const routerPath = router.url.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
  return decodeURIComponent(routerPath);
}

export const wordpressPageResolver: ResolveFn<WordPressPageResponse | null> = (route) => {
  const service = inject(WordPressPageService);
  const seoMeta = inject(SeoMetaService);
  const router = inject(Router);
  const path = resolveWordPressPathFromRoute(route, router);
  const fetchPath = resolveWordPressFetchPath(path);

  if (!fetchPath) {
    return of(null);
  }

  return service.getPage(fetchPath).pipe(
    tap((page) => applyWordPressPageSeo(seoMeta, path, page)),
    catchError(() => of(null)),
  );
};
