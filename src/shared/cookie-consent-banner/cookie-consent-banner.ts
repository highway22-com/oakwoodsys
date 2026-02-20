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

  readonly visible = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.visible.set(!(stored === 'true'));
    }
  }

  accept(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, 'true');
      this.visible.set(false);
    }
  }
}
