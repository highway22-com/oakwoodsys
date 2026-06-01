import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation, inject, signal } from '@angular/core';
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
  private readonly zone = inject(NgZone);

  // Starts false so SSR-rendered DOM matches the initial signal value, preventing
  // a hydration mismatch that would otherwise flash the loading state immediately.
  readonly loading = signal(false);
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
  // Path that SSR rendered into the current HTML, consumed once on hydration to
  // skip the loading flash for content that is already in the DOM.
  private ssrRenderedPath: string | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Detect if SSR rendered this page; if so, skip the loading flash on first hydration.
      const marker = this.document.querySelector('meta[name="wp-page-ssr"]') as HTMLMetaElement | null;
      this.ssrRenderedPath = marker?.content ?? null;
      marker?.parentNode?.removeChild(marker);
    }
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
    this.notFound.set(false);
    this.error.set(null);

    // On the very first browser render after SSR hydration, the content is already
    // in the DOM and styles are already in <head>. Skip the loading flash in that case.
    // On every other navigation (SPA nav, direct load without SSR) show loading normally.
    const skipLoading = isPlatformBrowser(this.platformId) && this.ssrRenderedPath === path;
    this.ssrRenderedPath = null; // consume — only skip once
    if (!skipLoading) {
      this.loading.set(true);
    }

    this.wordpressPageService.getPage(path).subscribe({
      // In the browser, defer one macrotask so Angular renders loading=true before
      // processing a synchronous transfer-cache response. On SSR, apply synchronously
      // because Angular SSR does not await setTimeout callbacks.
      next: (page) => {
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.applyPageResponse(path, page));
        } else {
          this.applyPageResponse(path, page);
        }
      },
      error: (error) => {
        const handler = () => {
          const status = error?.status ?? 0;
          this.loading.set(false);
          this.notFound.set(status === 404);
          this.error.set(status === 404 ? 'WordPress page not found.' : 'Unable to load the WordPress page.');
          this.pageTitle.set('');
          this.pageExcerpt.set('');
          this.pageHtml.set(null);
          this.seoMeta.updateMeta({
            title: status === 404 ? 'Page not found | Oakwood Systems' : 'WordPress page unavailable | Oakwood Systems',
            description: status === 404 ? 'The requested WordPress page could not be found.' : 'The requested WordPress page could not be loaded.',
            canonicalPath: `/${path}`,
          });
        };
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(handler);
        } else {
          handler();
        }
      },
    });
  }

  private resolvePath(): string {
    const routePath = this.route.snapshot.url.map((segment) => segment.path).join('/');
    const routerPath = this.router.url.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
    return decodeURIComponent(routePath || routerPath);
  }

  private applyPageResponse(path: string, page: WordPressPageResponse): void {
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
      this.injectInlineStyles(page.inlineStyles ?? []);
      // Inject stylesheets and reveal content only after they have loaded,
      // preventing a flash of unstyled content.
      this.injectStylesheetsAndReveal(page.stylesheets ?? []);
      this.schedulePageScripts(path, [
        ...this.extractScriptsFromHtml(page.headHtml ?? ''),
        ...this.extractScriptsFromHtml(page.content ?? ''),
        ...(page.footerScripts ?? []),
      ]);
    } else {
      // SSR: inject stylesheets and inline styles into <head> so the browser
      // receives them in the initial HTML and avoids a flash of unstyled content.
      const head = this.document.head;

      (page.inlineStyles ?? []).forEach((inlineStyle, index) => {
        if (!inlineStyle?.css) return;
        const style = this.document.createElement('style');
        if (inlineStyle.id) style.id = inlineStyle.id;
        if (inlineStyle.media) style.media = inlineStyle.media;
        style.setAttribute('data-wordpress-ssr-inline', `${index}`);
        style.textContent = inlineStyle.css;
        head.appendChild(style);
      });

      (page.stylesheets ?? []).filter((s) => s?.href).forEach((styleSheet) => {
        if (
          (styleSheet.id && this.document.getElementById(styleSheet.id)) ||
          this.document.querySelector(`link[href="${styleSheet.href}"]`)
        ) {
          return; // already present
        }
        const link = this.document.createElement('link');
        link.rel = styleSheet.rel ?? 'stylesheet';
        link.href = styleSheet.href!;
        if (styleSheet.id) link.id = styleSheet.id;
        if (styleSheet.media) link.media = styleSheet.media;
        if (styleSheet.type) link.type = styleSheet.type;
        head.appendChild(link);
      });

      // Stamp a marker so the browser knows SSR rendered this path; consumed once
      // during hydration to skip the loading flash.
      const ssrMarker = this.document.createElement('meta');
      ssrMarker.setAttribute('name', 'wp-page-ssr');
      ssrMarker.setAttribute('content', path);
      this.document.head.appendChild(ssrMarker);

      this.loading.set(false);
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

  private injectStylesheetsAndReveal(stylesheets: WordPressPageStylesheet[]): void {
    const head = this.document.head;
    const toLoad = stylesheets.filter((s) => s?.href);

    if (!toLoad.length) {
      this.loading.set(false);
      return;
    }

    let pending = toLoad.length;

    // Safety valve: reveal after 8 s even if a stylesheet stalls or errors.
    const safetyTimer = setTimeout(() => {
      this.zone.run(() => this.loading.set(false));
    }, 8000);

    const settle = (): void => {
      if (--pending <= 0) {
        clearTimeout(safetyTimer);
        this.zone.run(() => this.loading.set(false));
      }
    };

    toLoad.forEach((styleSheet) => {
      // If the stylesheet was already injected by SSR, count it as ready and skip.
      if (this.document.querySelector(`link[href="${styleSheet.href}"]`)) {
        settle();
        return;
      }

      const link = this.document.createElement('link');
      link.rel = styleSheet.rel ?? 'stylesheet';
      link.href = styleSheet.href!;
      link.setAttribute('data-wordpress-page-href', styleSheet.href!);
      if (styleSheet.id) link.id = styleSheet.id;
      if (styleSheet.media) link.media = styleSheet.media;
      if (styleSheet.type) link.type = styleSheet.type;
      link.addEventListener('load', settle, { once: true });
      link.addEventListener('error', settle, { once: true });
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

  private extractScriptsFromHtml(html: string): WordPressFooterScript[] {
    if (!html.trim()) {
      return [];
    }

    const template = this.document.createElement('template');
    template.innerHTML = html;

    return Array.from(template.content.querySelectorAll('script')).map((script) => ({
      id: script.id || null,
      src: script.getAttribute('src') || undefined,
      type: script.getAttribute('type') || null,
      nonce: script.getAttribute('nonce') || null,
      async: script.hasAttribute('async'),
      defer: script.hasAttribute('defer'),
      code: script.getAttribute('src') ? undefined : script.textContent || undefined,
    }));
  }

  private schedulePageScripts(path: string, scripts: WordPressFooterScript[]): void {
    const win = this.document.defaultView;
    const inject = (): void => {
      if (this.currentPath === path) {
        void this.injectPageScripts(scripts);
      }
    };

    if (win?.requestAnimationFrame) {
      win.requestAnimationFrame(() => inject());
      return;
    }

    setTimeout(inject, 0);
  }

  private async injectPageScripts(scripts: WordPressFooterScript[]): Promise<void> {
    const body = this.document.body;
    for (const [index, scriptData] of scripts.entries()) {
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
      await this.appendScriptInOrder(body, script, scriptData);
    }
  }

  private appendScriptInOrder(body: HTMLElement, script: HTMLScriptElement, scriptData: WordPressFooterScript): Promise<void> {
    return new Promise((resolve) => {
      if (scriptData.src && !scriptData.async && !scriptData.defer) {
        script.async = false;
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => resolve(), { once: true });
      } else {
        resolve();
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
