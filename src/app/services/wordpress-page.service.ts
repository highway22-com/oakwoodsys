import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CMS_BASE_URL } from '../config/cms.config';

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

@Injectable({ providedIn: 'root' })
export class WordPressPageService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  getPage(path: string): Observable<WordPressPageResponse> {
    const encoded = encodeURIComponent(path);
    const url = isPlatformServer(this.platformId)
      ? `${CMS_BASE_URL}/wp-json/custom/v1/rendered-page?path=${encoded}`
      : `/api/wordpress-page?path=${encoded}`;
    return this.http.get<WordPressPageResponse>(url);
  }
}
