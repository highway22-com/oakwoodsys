import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import { Subscription } from 'rxjs';

import { RESOLVE_WP_PAGE_BY_URI, ResolveWpPageByUriResponse, WpPageNode } from '../../app/api/graphql';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { ButtonPrimaryComponent } from '../../shared/button-primary/button-primary.component';

interface RenderablePage {
  title: string;
  slug: string;
  uri: string;
  sanitizedContent: SafeHtml;
  featuredImage?: { sourceUrl: string; altText: string | null } | null;
}

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

    this.querySub = this.apollo
      .query<ResolveWpPageByUriResponse>({
        query: RESOLVE_WP_PAGE_BY_URI,
        variables: { uri },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result) => {
          const node = result.data?.nodeByUri;
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
    };

    this.page.set(rendered);

    this.seoMeta.updateMeta({
      title: `${rendered.title} | Oakwood Systems`,
      description: this.deriveDescription(content) || this.seoMeta.defaultDescription,
      canonicalPath: rendered.uri.replace(/\/$/, '') || '/',
      image: rendered.featuredImage?.sourceUrl,
      imageAlt: rendered.featuredImage?.altText ?? rendered.title,
      ogType: 'article',
    });
  }

  private handleNotFound(uri: string): void {
    this.notFound.set(true);
    this.seoMeta.updateMeta({
      title: 'Page not found | Oakwood Systems',
      description: 'The page you requested cannot be found.',
      canonicalPath: uri.replace(/\/$/, '') || '/',
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
}
