import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  RESOLVE_WP_PAGE_BY_URI_BASIC,
  RESOLVE_WP_PAGE_BY_URI_WITH_SEO,
  ResolveWpPageByUriResponse,
  WpPageNode,
  WpYoastSeo,
} from '../../app/api/graphql';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';

interface RenderablePage {
  title: string;
  slug: string;
  uri: string;
  sanitizedContent: SafeHtml;
  featuredImage?: { sourceUrl: string; altText: string | null } | null;
  seo?: WpYoastSeo | null;
}

let yoastSeoAvailable: boolean | null = null;

@Component({
  selector: 'app-wp-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonPrimaryComponent],
  templateUrl: './wp-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WpPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly apollo = inject(Apollo);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoMeta = inject(SeoMetaService);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly page = signal<RenderablePage | null>(null);

  private querySub?: Subscription;

  ngOnInit(): void {
    const uri = this.normalizeUri(this.router.url);
    this.resolve(uri);
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  private normalizeUri(routerUrl: string): string {
    const pathOnly = routerUrl.split('?')[0].split('#')[0];
    if (!pathOnly || pathOnly === '/') return '/';
    return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
  }

  private resolve(uri: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.page.set(null);

    this.querySub = this.fetchPage(uri).subscribe({
      next: (node) => {
        if (this.isWpPage(node)) {
          this.renderPage(node);
        } else {
          this.handleNotFound(uri);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[WpPage] resolveRoute error for', uri, err);
        this.handleNotFound(uri);
        this.loading.set(false);
      },
    });
  }

  private fetchPage(uri: string): Observable<WpPageNode | { __typename: string } | null | undefined> {
    if (yoastSeoAvailable === false) {
      return this.queryBasic(uri);
    }
    return this.queryWithSeo(uri).pipe(
      catchError((err: unknown) => {
        if (this.isUnknownSeoFieldError(err)) {
          yoastSeoAvailable = false;
          return this.queryBasic(uri);
        }
        throw err;
      }),
      map((node) => {
        if (yoastSeoAvailable === null) yoastSeoAvailable = true;
        return node;
      }),
    );
  }

  private queryWithSeo(uri: string): Observable<WpPageNode | { __typename: string } | null | undefined> {
    return this.apollo
      .query<ResolveWpPageByUriResponse>({
        query: RESOLVE_WP_PAGE_BY_URI_WITH_SEO,
        variables: { uri },
        fetchPolicy: 'network-only',
        errorPolicy: 'none',
      })
      .pipe(map((result) => result.data?.nodeByUri ?? null));
  }

  private queryBasic(uri: string): Observable<WpPageNode | { __typename: string } | null | undefined> {
    return this.apollo
      .query<ResolveWpPageByUriResponse>({
        query: RESOLVE_WP_PAGE_BY_URI_BASIC,
        variables: { uri },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) => result.data?.nodeByUri ?? null),
        catchError(() => of(null)),
      );
  }

  private isUnknownSeoFieldError(err: unknown): boolean {
    const candidates: string[] = [];
    const e = err as { message?: string; graphQLErrors?: Array<{ message?: string }>; networkError?: { result?: { errors?: Array<{ message?: string }> } } };
    if (e?.message) candidates.push(e.message);
    if (Array.isArray(e?.graphQLErrors)) {
      for (const ge of e.graphQLErrors) if (ge?.message) candidates.push(ge.message);
    }
    const nwErrors = e?.networkError?.result?.errors;
    if (Array.isArray(nwErrors)) {
      for (const ne of nwErrors) if (ne?.message) candidates.push(ne.message);
    }
    return candidates.some((m) => /cannot query field\s+"?seo"?/i.test(m) || /unknown field\s+"?seo"?/i.test(m));
  }

  private isWpPage(node: unknown): node is WpPageNode {
    return !!node && typeof node === 'object' && (node as { __typename?: string }).__typename === 'Page';
  }

  private renderPage(node: WpPageNode): void {
    const content = node.content ?? '';
    const rendered: RenderablePage = {
      title: node.title ?? '',
      slug: node.slug ?? '',
      uri: node.uri ?? '',
      sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(content),
      featuredImage: node.featuredImage?.node
        ? {
            sourceUrl: node.featuredImage.node.sourceUrl,
            altText: node.featuredImage.node.altText ?? null,
          }
        : null,
      seo: node.seo ?? null,
    };

    this.page.set(rendered);

    const seo = rendered.seo ?? null;
    const derivedDescription = this.deriveDescription(content);
    const fallbackTitle = `${rendered.title} | Oakwood Systems`;
    const featuredImageUrl = rendered.featuredImage?.sourceUrl;
    const featuredImageAlt = rendered.featuredImage?.altText ?? rendered.title;

    const ogType = ((): 'website' | 'article' => {
      const t = seo?.opengraphType?.toLowerCase();
      return t === 'website' ? 'website' : 'article';
    })();

    this.seoMeta.updateMeta({
      title: seo?.title?.trim() || fallbackTitle,
      description: seo?.metaDesc?.trim() || derivedDescription || this.seoMeta.defaultDescription,
      keywords: seo?.metaKeywords?.trim() || undefined,
      keyphrase: seo?.focuskw?.trim() || undefined,
      canonicalPath: seo?.canonical?.trim() || rendered.uri.replace(/\/$/, '') || '/',
      image: seo?.opengraphImage?.sourceUrl || featuredImageUrl,
      imageAlt: seo?.opengraphImage?.altText || featuredImageAlt,
      ogType,
      ogTitle: seo?.opengraphTitle?.trim() || undefined,
      ogDescription: seo?.opengraphDescription?.trim() || undefined,
      twitterTitle: seo?.twitterTitle?.trim() || undefined,
      twitterDescription: seo?.twitterDescription?.trim() || undefined,
      twitterImage: seo?.twitterImage?.sourceUrl || undefined,
      noindex: this.toBool(seo?.metaRobotsNoindex),
      nofollow: this.toBool(seo?.metaRobotsNofollow),
      jsonLd: seo?.schema?.raw?.trim() || undefined,
    });
  }

  private handleNotFound(uri: string): void {
    this.notFound.set(true);
    this.seoMeta.updateMeta({
      title: 'Page not found | Oakwood Systems',
      description: 'The page you requested cannot be found.',
      canonicalPath: uri.replace(/\/$/, '') || '/',
      noindex: true,
    });
  }

  private deriveDescription(html: string): string {
    if (!html) return '';
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 200 ? `${text.slice(0, 197)}...` : text;
  }

  private toBool(value: string | null | undefined): boolean {
    if (value == null) return false;
    const v = String(value).toLowerCase();
    return v === 'noindex' || v === 'nofollow' || v === 'true' || v === '1' || v === 'yes';
  }
}
