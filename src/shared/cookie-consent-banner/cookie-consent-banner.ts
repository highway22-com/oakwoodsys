import {
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'oakwood-cookie-consent';

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
      if (localStorage.getItem(STORAGE_KEY) !== 'true') {
        this.visible.set(true);
      }
    }
  }

  accept(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      this.visible.set(false);
    }
  }
}
