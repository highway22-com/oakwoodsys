import {
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

declare const gtag: ((...args: unknown[]) => void) | undefined;

const STORAGE_KEY = 'oakwood-cookie-consent';

const CONSENT_GRANTED = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
};

@Component({
  selector: 'app-cookie-consent-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookie-consent-banner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieConsentBanner {
  private readonly platformId = inject(PLATFORM_ID);
  readonly visible = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // A prior version of this component wrote to sessionStorage but read from
      // localStorage, so returning visitors who'd already accepted kept getting
      // re-prompted every new session.
      if (localStorage.getItem(STORAGE_KEY) !== 'true') {
        this.visible.set(true);
      }
    }
  }

  accept(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, 'true');
      if (typeof gtag === 'function') {
        gtag('consent', 'update', CONSENT_GRANTED);
      }
      this.visible.set(false);
    }
  }
}
