import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter, Subscription } from 'rxjs';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { WordPressFooterScript, WordPressInlineStyle, WordPressPageResponse, WordPressPageService, WordPressPageStylesheet } from '../../app/services/wordpress-page.service';

@Component({
  selector: 'app-wordpress-page',
  imports: [CommonModule],
  templateUrl: './wordpress-page.html',
  styleUrl: './wordpress-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export default class WordpressPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly wordpressPageService = inject(WordPressPageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageTitle = signal('');
  readonly pageExcerpt = signal('');
  readonly pageHtml = signal<SafeHtml | null>(null);

  private readonly injectedHeadNodes: HTMLElement[] = [];
  private readonly injectedBodyNodes: HTMLElement[] = [];
  private readonly injectedBodyClasses = new Set<string>();
  private readonly subscriptions = new Subscription();
  private currentPath = '';

  ngOnInit(): void {
    this.loadCurrentPage();
    this.subscriptions.add(
      this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
        this.loadCurrentPage();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.cleanupInjectedAssets();
  }

  private loadCurrentPage(): void {
    const path = this.resolvePath();
    if (!path || path === this.currentPath) {
      return;
    }

    this.currentPath = path;
    this.cleanupInjectedAssets();
    this.loading.set(true);
    this.notFound.set(false);
    this.error.set(null);

    this.wordpressPageService.getPage(path).subscribe({
      next: (page) => this.applyPageResponse(path, page),
      error: (error) => {
        const status = error?.status ?? 0;
        this.loading.set(false);
        this.notFound.set(status === 404);
        this.error.set(status === 404 ? 'WordPress page not found.' : 'Unable to load the WordPress page.');
        this.pageTitle.set('');
        this.pageExcerpt.set('');
        this.pageHtml.set(null);
      },
    });
  }

  private resolvePath(): string {
    const routePath = this.route.snapshot.url.map((segment) => segment.path).join('/');
    const routerPath = this.router.url.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
    return decodeURIComponent(routePath || routerPath);
  }

  private applyPageResponse(path: string, page: WordPressPageResponse): void {
    this.loading.set(false);
    this.notFound.set(false);

    this.pageTitle.set(page.title ?? this.humanizePath(path));
    this.pageExcerpt.set(page.excerpt ?? '');
    this.pageHtml.set(this.sanitizer.bypassSecurityTrustHtml(page.content ?? ''));

    this.seoMeta.updateMeta({
      title: page.title ? `${page.title} | Oakwood Systems` : `${this.humanizePath(path)} | Oakwood Systems`,
      description: page.excerpt?.trim() || page.title || 'WordPress page content.',
      canonicalPath: `/${path}`,
    });

    if (isPlatformBrowser(this.platformId)) {
      this.applyBodyClasses(page.bodyClasses ?? []);
      this.injectStylesheets(page.stylesheets ?? []);
      this.injectInlineStyles(page.inlineStyles ?? []);
      this.injectFooterScripts(page.footerScripts ?? []);
    }
  }

  private humanizePath(path: string): string {
    return path
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(/[-_]+/g, ' '))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' / ');
  }

  private applyBodyClasses(classes: string[]): void {
    const body = this.document.body;
    const nextClasses = new Set(classes.filter(Boolean));

    this.injectedBodyClasses.forEach((className) => {
      if (!nextClasses.has(className)) {
        body.classList.remove(className);
      }
    });

    nextClasses.forEach((className) => {
      if (!body.classList.contains(className)) {
        body.classList.add(className);
      }
    });

    this.injectedBodyClasses.clear();
    nextClasses.forEach((className) => this.injectedBodyClasses.add(className));
  }

  private injectStylesheets(stylesheets: WordPressPageStylesheet[]): void {
    const head = this.document.head;
    stylesheets.forEach((styleSheet) => {
      if (!styleSheet?.href) {
        return;
      }

      const link = this.document.createElement('link');
      link.rel = styleSheet.rel ?? 'stylesheet';
      link.href = styleSheet.href;
      link.setAttribute('data-wordpress-page-href', styleSheet.href);
      if (styleSheet.id) link.id = styleSheet.id;
      if (styleSheet.media) link.media = styleSheet.media;
      if (styleSheet.type) link.type = styleSheet.type;
      head.appendChild(link);
      this.injectedHeadNodes.push(link);
    });
  }

  private injectInlineStyles(inlineStyles: WordPressInlineStyle[]): void {
    const head = this.document.head;
    inlineStyles.forEach((inlineStyle, index) => {
      if (!inlineStyle?.css) {
        return;
      }

      const style = this.document.createElement('style');
      style.setAttribute('data-wordpress-page-inline-style', `${this.currentPath}-${index}`);
      if (inlineStyle.id) style.id = inlineStyle.id;
      if (inlineStyle.media) style.media = inlineStyle.media;
      style.textContent = inlineStyle.css;
      head.appendChild(style);
      this.injectedHeadNodes.push(style);
    });
  }

  private injectFooterScripts(scripts: WordPressFooterScript[]): void {
    const body = this.document.body;
    scripts.forEach((scriptData, index) => {
      const script = this.document.createElement('script');
      script.setAttribute('data-wordpress-page-script', `${this.currentPath}-${index}`);
      if (scriptData.id) script.id = scriptData.id;
      if (scriptData.type) script.type = scriptData.type;
      if (scriptData.nonce) script.setAttribute('nonce', scriptData.nonce);
      if (scriptData.async) script.async = true;
      if (scriptData.defer) script.defer = true;
      if (scriptData.src) {
        script.src = scriptData.src;
      }
      if (scriptData.code && !scriptData.src) {
        script.text = scriptData.code;
      }
      body.appendChild(script);
      this.injectedBodyNodes.push(script);
    });
  }

  private cleanupInjectedAssets(): void {
    while (this.injectedHeadNodes.length > 0) {
      const node = this.injectedHeadNodes.pop();
      node?.parentNode?.removeChild(node);
    }

    while (this.injectedBodyNodes.length > 0) {
      const node = this.injectedBodyNodes.pop();
      node?.parentNode?.removeChild(node);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.injectedBodyClasses.forEach((className) => this.document.body.classList.remove(className));
    }
    this.injectedBodyClasses.clear();
  }
}