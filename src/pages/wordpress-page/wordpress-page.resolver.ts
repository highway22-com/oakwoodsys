import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

import { SeoMetaService } from '../../app/services/seo-meta.service';
import { WordPressPageResponse, WordPressPageService } from '../../app/services/wordpress-page.service';
import { applyWordPressPageSeo } from './wordpress-page.seo';

export function resolveWordPressPathFromRoute(route: ActivatedRouteSnapshot, router: Router): string {
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

  if (!path) {
    return of(null);
  }

  return service.getPage(path).pipe(
    tap((page) => applyWordPressPageSeo(seoMeta, path, page)),
    catchError(() => of(null)),
  );
};
