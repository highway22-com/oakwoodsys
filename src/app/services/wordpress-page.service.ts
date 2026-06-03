import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({ providedIn: 'root' })
export class WordPressPageService {
  private readonly http = inject(HttpClient);

  getPage(path: string): Observable<WordPressPageResponse> {
    return this.http.get<WordPressPageResponse>(`/api/wordpress-page?path=${encodeURIComponent(path)}`);
  }
}