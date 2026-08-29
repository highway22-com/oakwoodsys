import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, map, of, switchMap, throwError } from 'rxjs';

import { CMS_BASE_URL } from '../../app/config/cms.config';
import { serverSitePublicUrl } from '../../app/config/site-public.config';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { decodeHtmlEntities } from '../../app/utils/cast';
import { humanizeSlug } from '../../app/utils/humanize-slug';
import { logError } from '../../app/utils/logger';
import { EventsContent, EventItem } from '../events/events';

function eventOgImageAbsoluteUrl(e: EventItem, baseUrl: string): string | undefined {
  const raw = (e.heroImage || e.imageUrl || '').trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = baseUrl.replace(/\/$/, '');
  return base + (raw.startsWith('/') ? raw : `/${raw}`);
}

/**
 * Runs before the resources/events/:slug route activates. event-detail.ts's own SEO update
 * (updateEventSeoMeta) never runs on the server at all — ngOnInit bails out early with
 * `if (isPlatformBrowser(...)) {...} else { return; }` before ever subscribing to route
 * params — so every SSR render of this route shipped index.html's site-wide defaults,
 * deterministically, regardless of CMS health.
 */
export const eventDetailSeoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const http = inject(HttpClient);
  const seoMeta = inject(SeoMetaService);
  const platformId = inject(PLATFORM_ID);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of(true);
  }

  const applyFallback = () => {
    seoMeta.updateMeta({
      title: `${humanizeSlug(slug)} | Oakwood Systems`,
      description: 'We could not find this event. Browse upcoming and past events from Oakwood Systems.',
      canonicalPath: `/resources/events/${slug}`,
      noindex: true,
    });
    return of(true);
  };

  const query = `query EventsContent { eventsContent { content } }`;
  const graphqlUrl = isPlatformBrowser(platformId) ? '/api/graphql' : `${CMS_BASE_URL}/graphql`;

  return http
    .post<{ data?: { eventsContent?: { content?: string | null } | null } }>(graphqlUrl, { query })
    .pipe(
      switchMap((res) => {
        const raw = res?.data?.eventsContent?.content;
        if (!raw) return throwError(() => new Error('Missing eventsContent.content'));
        try {
          const parsed = JSON.parse(raw) as EventsContent;
          if (parsed?.events && typeof parsed.events === 'object') return of(parsed);
        } catch {
          /* invalid JSON */
        }
        return throwError(() => new Error('Invalid events content'));
      }),
      catchError(() => {
        const jsonUrl = isPlatformBrowser(platformId)
          ? '/events-content.json'
          : `${serverSitePublicUrl()}/events-content.json`;
        return http.get<EventsContent>(jsonUrl);
      }),
      map((data) => {
        const e = data?.events?.[slug] ?? null;
        if (!e) {
          throw new Error(`Event "${slug}" not found`);
        }
        const rawDesc = (e.summary ?? e.subtitle ?? '').trim();
        const description = rawDesc ? decodeHtmlEntities(rawDesc).replace(/<[^>]*>/g, '').trim() : '';
        seoMeta.updateMeta({
          title: `${e.title} | Oakwood Systems`,
          description: description || seoMeta.defaultDescription,
          canonicalPath: `/resources/events/${e.slug}`,
          image: eventOgImageAbsoluteUrl(e, seoMeta.baseUrl),
          imageAlt: (e.imageAlt ?? '').trim() || e.title,
          ogType: 'website',
        });
        return true;
      }),
      catchError((error) => {
        logError(`[event-detail] SEO resolver failed for slug "${slug}":`, error);
        return applyFallback();
      }),
    );
};
