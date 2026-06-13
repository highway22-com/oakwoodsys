import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter, Subscription } from 'rxjs';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { WordPressFooterScript, WordPressInlineStyle, WordPressPageResponse, WordPressPageService, WordPressPageStylesheet } from '../../app/services/wordpress-page.service';
import { AppNavbar } from '../../layout/app-navbar/app-navbar';
import { Footer } from '../../layout/footer/footer';

@Component({
  selector: 'app-wordpress-page',
  imports: [CommonModule, AppNavbar, Footer],
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
  // MutationObserver to track DOM nodes injected directly into <body> by WP scripts
  // (e.g. BaguetteBox lightbox overlay) so they can be cleaned up on navigation.
  private scriptDomObserver: MutationObserver | null = null;

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
    // Sweep script-injected body overlays (BaguetteBox etc.) at the very start
    // of every navigation — before Angular swaps routes or destroys the component.
    // This guarantees cleanup even when the browser back button is used.
    if (isPlatformBrowser(this.platformId)) {
      this.subscriptions.add(
        this.router.events.pipe(filter((event): event is NavigationStart => event instanceof NavigationStart)).subscribe(() => {
          this.removeScriptBodyOverlays();
        })
      );
    }
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
          if (status === 404) {
            this.router.navigate(['/404'], { replaceUrl: true });
            return;
          }
          this.loading.set(false);
          this.notFound.set(false);
          this.error.set('Unable to load the WordPress page.');
          this.pageTitle.set('');
          this.pageExcerpt.set('');
          this.pageHtml.set(null);
          this.seoMeta.updateMeta({
            title: 'WordPress page unavailable | Oakwood Systems',
            description: 'The requested WordPress page could not be loaded.',
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

      // Inline styles: scoped to #wp-content-root so they cannot affect navbar/footer.
      (page.inlineStyles ?? []).forEach((inlineStyle, index) => {
        if (!inlineStyle?.css) return;
        const style = this.document.createElement('style');
        if (inlineStyle.id) style.id = inlineStyle.id;
        if (inlineStyle.media) style.media = inlineStyle.media;
        style.setAttribute('data-wordpress-ssr-inline', `${index}`);
        style.textContent = `@scope (#wp-content-root) {\n${this.prepCssForScope(inlineStyle.css)}\n}`;
        head.appendChild(style);
      });

      // External stylesheets: when the plugin provides CSS text, scope and inject inline.
      // When not (CDN/external), use @import url() layer() as best-effort protection.
      const validSheets = (page.stylesheets ?? []).filter((s) => s?.href);
      const ssrWithText = validSheets.filter((s) => s.css);
      const ssrWithoutText = validSheets.filter((s) => !s.css);

      if (ssrWithText.length > 0) {
        const scopedStyle = this.document.createElement('style');
        scopedStyle.setAttribute('data-wp-ssr-scoped', 'true');
        scopedStyle.textContent = ssrWithText
          .map((s) => `@scope (#wp-content-root) {\n${this.prepCssForScope(s.css!)}\n}`)
          .join('\n');
        head.appendChild(scopedStyle);
      }

      if (ssrWithoutText.length > 0) {
        // In SSR, use <link rel="stylesheet"> so the browser treats them as
        // render-blocking and applies them before first paint.
        ssrWithoutText.forEach((s) => {
          const link = this.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = s.href!;
          if (s.media) link.media = s.media;
          link.setAttribute('data-wp-ssr-link', 'true');
          head.appendChild(link);
        });
      }

      // Stamp a marker so the browser knows SSR rendered this path; consumed once
      // during hydration to skip the loading flash.
      const ssrMarker = this.document.createElement('meta');
      ssrMarker.setAttribute('name', 'wp-page-ssr');
      ssrMarker.setAttribute('content', path);
      this.document.head.appendChild(ssrMarker);

      this.loading.set(false);
    }
  }

  /**
   * Pre-process raw WordPress CSS before wrapping it in `@scope (#wp-content-root) { ... }`.
   *
   * Inside `@scope`, the scope root is `#wp-content-root` (a div). The CSS pseudo-class
   * `:root` refers to the document root (`<html>`), which is an ANCESTOR of the scope
   * root — so the `@scope` filter excludes it and any declarations on `:root { }` are
   * silently dropped. WordPress places all its CSS custom properties (colour presets,
   * font-size presets, etc.) in `global-styles-inline-css` under `:root { }`, e.g.:
   *
   *   :root { --wp--preset--color--white: #fff; ... }
   *
   * Without the properties, `has-white-color { color: var(--wp--preset--color--white) }`
   * resolves to an invalid value and text falls back to the inherited dark colour from
   * the `is-light` modifier — which is exactly the "text appears black" bug.
   *
   * Fix: replace `:root` with `:scope` so declarations are set on `#wp-content-root`
   * itself. Because CSS custom properties are inherited, all child elements still receive
   * them. We also replace bare `body` selectors for the same reason.
   */
  private prepCssForScope(css: string): string {
    return css
      // :root → :scope (e.g. :root { --wp--preset--color--white: #fff })
      .replace(/:root\b/g, ':scope')
      // bare `body` selector → :scope  (e.g. body { font-family: ... })
      // Use a lookbehind so we don't touch class names like .has-body-font or
      // attribute values inside url() strings — only CSS selector tokens.
      .replace(/(?<=[\s,{};>+~(]|^)body(?=[\s,{}>+~[:.#*]|$)/gm, ':scope');
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

    // Remove SSR-injected import/scoped styles (untracked).
    this.document.querySelectorAll('style[data-wp-ssr-scoped], link[data-wp-ssr-link]').forEach((el) => {
      el.parentNode?.removeChild(el);
    });

    // Stylesheets that the PHP plugin returned with raw CSS text can be fully
    // scoped to #wp-content-root — these rules can NEVER match the navbar or footer.
    const withText = toLoad.filter((s) => s.css);
    // Stylesheets without CSS text (CDN, external) fall back to a cascade layer
    // so at least Angular's unlayered rules always win on specificity clashes.
    const withoutText = toLoad.filter((s) => !s.css);

    if (withText.length > 0) {
      const style = this.document.createElement('style');
      style.setAttribute('data-wp-scoped', 'true');
      style.textContent = withText
        .map((s) => `@scope (#wp-content-root) {\n${this.prepCssForScope(s.css!)}\n}`)
        .join('\n');
      head.appendChild(style);
      this.injectedHeadNodes.push(style);
    }

    // For stylesheets without CSS text use <link rel="stylesheet"> directly.
    // This is more reliable than @import inside a <style> element:
    // - load/error events fire exactly when the sheet is parsed and applied
    // - no preload hint required; the link itself is the request
    // - avoids a blank window between @import parsing and style application
    const linkEls: HTMLLinkElement[] = [];
    withoutText.forEach((s) => {
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = s.href!;
      if (s.media) link.media = s.media;
      head.appendChild(link);
      this.injectedHeadNodes.push(link);
      linkEls.push(link);
    });

    // Wait for every <link> to load before revealing content.
    const externalCount = linkEls.length;
    let pending = externalCount || 1;

    const safetyTimer = setTimeout(() => {
      this.zone.run(() => this.loading.set(false));
    }, 8000);

    const settle = (): void => {
      if (--pending <= 0) {
        clearTimeout(safetyTimer);
        const win = this.document.defaultView;
        const reveal = () => this.zone.run(() => this.loading.set(false));
        win?.requestAnimationFrame ? win.requestAnimationFrame(reveal) : reveal();
      }
    };

    if (externalCount === 0) {
      // All stylesheets were scoped inline — reveal on next RAF.
      settle();
    } else {
      linkEls.forEach((link) => {
        link.addEventListener('load', settle, { once: true });
        link.addEventListener('error', settle, { once: true });
      });
    }
  }


  private injectInlineStyles(inlineStyles: WordPressInlineStyle[]): void {
    // Remove SSR-injected inline styles (untracked); replace with tracked versions.
    this.document.querySelectorAll('style[data-wordpress-ssr-inline]').forEach((el) => {
      el.parentNode?.removeChild(el);
    });

    const head = this.document.head;
    inlineStyles.forEach((inlineStyle, index) => {
      if (!inlineStyle?.css) {
        return;
      }

      const style = this.document.createElement('style');
      style.setAttribute('data-wordpress-page-inline-style', `${this.currentPath}-${index}`);
      if (inlineStyle.id) style.id = inlineStyle.id;
      if (inlineStyle.media) style.media = inlineStyle.media;
      // @scope restricts rules to only match inside #wp-content-root.
      // Navbar and footer are siblings (not descendants), so they are structurally
      // excluded — no @layer needed, @scope alone is sufficient.
      style.textContent = `@scope (#wp-content-root) {\n${this.prepCssForScope(inlineStyle.css)}\n}`;
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
    // Observe any non-script nodes appended directly to <body> by WP scripts
    // (e.g. BaguetteBox lightbox overlay) so they can be removed on cleanup.
    if (isPlatformBrowser(this.platformId) && !this.scriptDomObserver) {
      this.scriptDomObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.tagName !== 'SCRIPT') {
              this.injectedBodyNodes.push(node);
            }
          });
        }
      });
      this.scriptDomObserver.observe(body, { childList: true });
    }
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
    // Stop observing body mutations before cleanup to avoid re-tracking removals.
    if (this.scriptDomObserver) {
      this.scriptDomObserver.disconnect();
      this.scriptDomObserver = null;
    }

    while (this.injectedHeadNodes.length > 0) {
      const node = this.injectedHeadNodes.pop();
      node?.parentNode?.removeChild(node);
    }

    while (this.injectedBodyNodes.length > 0) {
      const node = this.injectedBodyNodes.pop();
      node?.parentNode?.removeChild(node);
    }

    // Also remove SSR-injected WP assets. These are not in injectedHeadNodes because
    // they were added server-side. If the user navigates directly from a WP page to
    // another route, these would otherwise linger and break other page styles.
    this.document.querySelectorAll('style[data-wp-ssr-imports], style[data-wp-ssr-scoped], style[data-wordpress-ssr-inline], link[data-wp-ssr-link]').forEach((el) => {
      el.parentNode?.removeChild(el);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.removeScriptBodyOverlays();
    }

    if (isPlatformBrowser(this.platformId)) {
      this.injectedBodyClasses.forEach((className) => this.document.body.classList.remove(className));
    }
    this.injectedBodyClasses.clear();
  }

  /**
   * Removes DOM overlays appended directly to <body> by WordPress scripts
   * (BaguetteBox lightbox, etc.). Called on NavigationStart and during full
   * asset cleanup, so it runs regardless of MutationObserver timing.
   */
  private removeScriptBodyOverlays(): void {
    this.document.querySelectorAll(
      '#baguetteBox-overlay, [id^="baguetteBox"], [class*="baguetteBox"]'
    ).forEach((el) => el.parentNode?.removeChild(el));
  }
}
