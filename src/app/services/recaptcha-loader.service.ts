import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js';
const RECAPTCHA_SITE_KEY = '6Lcp8XwsAAAAAIrdZHBdw74jtoxwPxDRZW4F-rwu';

export interface RecaptchaRenderCallbacks {
  onSuccess: (token: string) => void;
  onExpired: () => void;
}

/**
 * Loads the reCAPTCHA v2 script on demand and centralizes the render/reset logic that
 * contact-us, post, and microsoft-licensing each used to duplicate. Previously the script
 * loaded globally from index.html on every page, whether or not that page had a form.
 * Callers (typically an IntersectionObserver on the form's recaptcha container) decide
 * when to call render() — this service only handles the "load once, render many" part.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaLoaderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private scriptPromise: Promise<void> | null = null;

  private loadScript(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('reCAPTCHA is browser-only'));
    }
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      if ((window as any).grecaptcha?.render) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = RECAPTCHA_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });
    return this.scriptPromise;
  }

  /**
   * Loads the script (once, shared across every form on the page) and renders a widget
   * into `container`. Mirrors the render-then-retry-at-500ms/1500ms tolerance the original
   * per-component implementations had, in case grecaptcha.render isn't available the
   * instant the script's load event fires.
   */
  render(container: HTMLElement, callbacks: RecaptchaRenderCallbacks): Promise<number> {
    return this.loadScript().then(
      () =>
        new Promise<number>((resolve) => {
          let resolved = false;
          const attempt = (): void => {
            if (resolved) return;
            const grecaptcha = (window as any).grecaptcha;
            if (!grecaptcha?.render) return;
            const widgetId = grecaptcha.render(container, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: (token: string) => this.ngZone.run(() => callbacks.onSuccess(token)),
              'expired-callback': () => this.ngZone.run(() => callbacks.onExpired()),
            });
            resolved = true;
            resolve(widgetId);
          };

          attempt();
          if (!resolved) {
            setTimeout(attempt, 500);
            setTimeout(attempt, 1500);
          }
        }),
    );
  }

  reset(widgetId: number | null): void {
    if (!isPlatformBrowser(this.platformId) || widgetId === null) return;
    (window as any).grecaptcha?.reset?.(widgetId);
  }
}
