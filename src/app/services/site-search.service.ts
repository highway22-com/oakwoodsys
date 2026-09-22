import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

import { CMS_BASE_URL } from '../config/cms.config';
import { logError } from '../utils/logger';

export interface SearchResultItem {
  type: 'page' | 'blog' | 'case-study';
  id: string;
  title: string;
  slug: string;
  link: string;
  snippet: string;
  image: string;
}

export interface SiteSearchResponse {
  items: SearchResultItem[];
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

const EMPTY_RESPONSE: SiteSearchResponse = {
  items: [],
  page: 1,
  perPage: 15,
  total: 0,
  hasMore: false,
};

@Injectable({ providedIn: 'root' })
export class SiteSearchService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  search(q: string, page = 1, perPage = 15): Observable<SiteSearchResponse> {
    const query = q.trim();
    if (query.length < 2) {
      return of({ ...EMPTY_RESPONSE, page, perPage });
    }

    const params = new HttpParams()
      .set('q', query)
      .set('page', String(page))
      .set('per_page', String(perPage));

    const url = isPlatformBrowser(this.platformId)
      ? '/api/search'
      : `${CMS_BASE_URL}/wp-json/oakwood/v1/search`;

    return this.http.get<SiteSearchResponse>(url, { params }).pipe(
      catchError((error) => {
        logError('[site-search] Failed to search:', error);
        return of({ ...EMPTY_RESPONSE, page, perPage });
      }),
    );
  }
}
