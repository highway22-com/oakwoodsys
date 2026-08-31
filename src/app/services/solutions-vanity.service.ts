import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

import { logError } from '../utils/logger';

interface SolutionMenuItem {
  slug?: string;
  link?: string;
}

interface NavbarContentResponse {
  content?: {
    solutions?: Record<string, SolutionMenuItem[]>;
  };
}

const VANITY_MAP_STATE_KEY = makeStateKey<Record<string, string>>('solutions-vanity-map');

/**
 * Maps a flat WordPress page slug (e.g. "azure-openai") to its /solutions/{category}/{slug}
 * vanity URL, built from navbar-content.json — the same mega-menu data source the live nav
 * uses (see getSolutionHref in app-navbar.ts). This lets a page visited by its flat slug
 * declare the vanity URL as canonical instead of itself, so the two stop competing as
 * duplicate content in Google (see isSolutionsVanityPath in wordpress-page.seo.ts for the
 * other half: the vanity URL declaring itself canonical).
 */
@Injectable({ providedIn: 'root' })
export class SolutionsVanityService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  private map$?: Observable<Map<string, string>>;

  getVanityPath(slug: string): Observable<string | undefined> {
    return this.getMap().pipe(map((vanityMap) => vanityMap.get(slug)));
  }

  private getMap(): Observable<Map<string, string>> {
    if (!this.map$) {
      this.map$ = this.fetchMap().pipe(shareReplay(1));
    }
    return this.map$;
  }

  private fetchMap(): Observable<Map<string, string>> {
    if (isPlatformBrowser(this.platformId)) {
      const cached = this.transferState.get(VANITY_MAP_STATE_KEY, null);
      if (cached) {
        this.transferState.remove(VANITY_MAP_STATE_KEY);
        return of(new Map(Object.entries(cached)));
      }
    }

    return this.http.get<NavbarContentResponse>('/navbar-content.json').pipe(
      map((data) => {
        const entries = this.buildMapEntries(data);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(VANITY_MAP_STATE_KEY, Object.fromEntries(entries));
        }
        return new Map(entries);
      }),
      catchError((error) => {
        logError('[solutions-vanity] Failed to load navbar-content.json:', error);
        return of(new Map<string, string>());
      }),
    );
  }

  /** Mirrors getSolutionCategoryRouteSegment + getSolutionHref in app-navbar.ts. */
  private buildMapEntries(data: NavbarContentResponse | null): [string, string][] {
    const solutions = data?.content?.solutions;
    if (!solutions || typeof solutions !== 'object') return [];

    const entries: [string, string][] = [];
    for (const [category, items] of Object.entries(solutions)) {
      if (!Array.isArray(items)) continue;
      const categorySegment = category === 'dataAndAnalytics' ? 'data-analytics' : category;
      for (const item of items) {
        const raw = (item?.link ?? item?.slug ?? '').trim();
        const normalized = raw.replace(/^\/+|\/+$/g, '');
        if (!normalized) continue;
        const segments = normalized.split('/').filter(Boolean);
        const linkSegment = segments[segments.length - 1] ?? normalized;
        entries.push([linkSegment, `/solutions/${categorySegment}/${linkSegment}`]);
      }
    }
    return entries;
  }
}
