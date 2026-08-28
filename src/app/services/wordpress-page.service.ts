import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

import { CMS_BASE_URL } from '../config/cms.config';
import { logError } from '../utils/logger';

export interface WordPressPageStylesheet {
  href: string;
  id?: string | null;
  rel?: string | null;
  media?: string | null;
  type?: string | null;
  /** Raw CSS text returned by the PHP plugin for client-side scoping. Null when the file is external/CDN. */
  css?: string | null;
}

export interface WordPressInlineStyle {
  id?: string | null;
  media?: string | null;
  css: string;
}

export interface WordPressFooterScript {
  id?: string | null;
  src?: string | null;
  type?: string | null;
  nonce?: string | null;
  async?: boolean;
  defer?: boolean;
  code?: string;
}

export interface WordPressPageSeo {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string;
  slug?: string;
  canonicalPath?: string;
  /** Per-page Yoast "Allow search engines to show this content in search results?" → No. */
  noindex?: boolean;
}

export interface WordPressPageResponse {
  path: string;
  slug: string;
  postType: string;
  title: string;
  excerpt?: string;
  content: string;
  permalink?: string;
  bodyClasses: string[];
  stylesheets: WordPressPageStylesheet[];
  inlineStyles: WordPressInlineStyle[];
  footerScripts: WordPressFooterScript[];
  headHtml?: string;
  footerHtml?: string;
  seo?: WordPressPageSeo;
}

const wpPageStateKey = (path: string) => makeStateKey<WordPressPageResponse>(`wp-page:${path}`);

@Injectable({ providedIn: 'root' })
export class WordPressPageService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  getPage(path: string): Observable<WordPressPageResponse> {
    const normalizedPath = path.trim();
    const stateKey = wpPageStateKey(normalizedPath);

    if (isPlatformBrowser(this.platformId)) {
      const cached = this.transferState.get(stateKey, null);
      if (cached) {
        this.transferState.remove(stateKey);
        return of(cached);
      }
    }

    const encoded = encodeURIComponent(normalizedPath);
    const url = isPlatformServer(this.platformId)
      ? `${CMS_BASE_URL}/wp-json/custom/v1/rendered-page?path=${encoded}`
      : `/api/wordpress-page?path=${encoded}`;

    return this.http.get<WordPressPageResponse>(url).pipe(
      tap((page) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, page);
        }
      }),
      catchError((error) => {
        // Was previously swallowed silently by the resolver's own catchError, with zero
        // trace anywhere — logging here, at the actual fetch, captures the URL and real
        // cause (timeout, non-2xx, network error) instead of just "page came back null".
        logError(`[wordpress-page] Failed to fetch "${normalizedPath}" from ${url}:`, error);
        return throwError(() => error);
      }),
    );
  }
}
