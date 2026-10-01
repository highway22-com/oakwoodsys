import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

/**
 * Pushes custom events into the GTM dataLayer (GTM-W9WNGS). GA4 itself is configured as a
 * tag inside that container, so each event name pushed here needs a matching Custom Event
 * trigger + GA4 Event tag in GTM before it shows up in GA4.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);

  track(event: string, params: Record<string, unknown> = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window as DataLayerWindow;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
  }
}
