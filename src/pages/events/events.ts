import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { EventbriteProxyService, type EventbriteApiObject } from '../../app/services/eventbrite-proxy.service';
import { EVENTBRITE_ORGANIZATION_ID } from '../../app/config/cms.config';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

export interface EventbriteListItem {
  id: string;
  title: string;
  /** ISO-like local datetime from API (e.g. 2025-06-01T14:00:00). */
  startLocal: string;
  timezone: string;
  url: string;
  summary: string;
  imageUrl: string | null;
}

function readEbText(field: unknown): string {
  if (field && typeof field === 'object' && 'text' in field) {
    const t = (field as { text?: unknown }).text;
    return typeof t === 'string' ? t.trim() : '';
  }
  return '';
}

function mapEventbriteEvent(raw: EventbriteApiObject): EventbriteListItem | null {
  const id = raw['id'];
  if (typeof id !== 'string' && typeof id !== 'number') {
    return null;
  }
  const idStr = String(id);
  const title = readEbText(raw['name']);
  const url = typeof raw['url'] === 'string' ? raw['url'] : '';
  if (!title || !url) {
    return null;
  }
  const start = raw['start'];
  let startLocal = '';
  let timezone = '';
  if (start && typeof start === 'object') {
    const s = start as Record<string, unknown>;
    startLocal = typeof s['local'] === 'string' ? s['local'] : '';
    timezone = typeof s['timezone'] === 'string' ? s['timezone'] : '';
  }
  const summary = readEbText(raw['description']).replace(/\s+/g, ' ').slice(0, 220);
  let imageUrl: string | null = null;
  const logo = raw['logo'];
  if (logo && typeof logo === 'object' && 'original' in logo) {
    const orig = (logo as { original?: unknown }).original;
    if (orig && typeof orig === 'object' && 'url' in orig) {
      const u = (orig as { url?: unknown }).url;
      imageUrl = typeof u === 'string' ? u : null;
    }
  }
  return {
    id: idStr,
    title,
    startLocal,
    timezone,
    url,
    summary: summary.length >= 220 ? `${summary}…` : summary,
    imageUrl,
  };
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, DatePipe, PageHeroComponent],
  templateUrl: './events.html',
  styleUrl: './events.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EventsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoMetaService);
  private readonly eventbrite = inject(EventbriteProxyService);

  readonly heroSubtitle =
    'Join us for webinars, workshops, and in-person sessions. Registration is handled securely on Eventbrite.';

  readonly orgConfigured = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly events = signal<EventbriteListItem[]>([]);

  ngOnInit(): void {
    this.seo.updateMeta({
      title: 'Events | Oakwood Systems',
      description:
        'Webinars, workshops, and conferences from Oakwood Systems. Register on Eventbrite.',
      canonicalPath: '/events',
    });

    this.eventbrite
      .getPublicConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.error.set(null)),
        catchError((err: unknown) => {
          let msg =
            'Could not load Eventbrite settings from WordPress (public-config). For local dev, check that ng serve uses proxy.conf.json and the Oakwood CMS plugin is updated on the server.';
          if (err instanceof HttpErrorResponse) {
            if (err.status === 0) {
              msg +=
                ' Network/CORS error: try opening the site from http://localhost:4200 and confirm the proxy reaches WordPress.';
            } else if (err.status >= 200 && err.status < 300) {
              /** Angular usa 200 + error de parseo cuando el cuerpo no es JSON (HTML del proxy, etc.). */
              msg =
                'public-config returned HTTP 200 but the response is not valid JSON (often HTML from a misconfigured proxy). Open DevTools → Network, inspect the public-config request, and confirm the body is {"organizationId":"…"}.';
              if (typeof err.message === 'string' && err.message) {
                msg += ` (${err.message})`;
              }
            } else if (err.status >= 400) {
              msg = `WordPress returned HTTP ${err.status} for public-config.`;
            }
          }
          this.error.set(msg);
          return of({ organizationId: '' });
        }),
        switchMap((cfg) => {
          const fromWp =
            typeof cfg.organizationId === 'string'
              ? cfg.organizationId.replace(/\D/g, '')
              : '';
          const orgId = fromWp
          this.orgConfigured.set(!!orgId);
          if (!orgId) {
            this.loading.set(false);
            return of({ events: [] as EventbriteApiObject[] });
          }
          return this.eventbrite
            .getOrganizationEvents(orgId, {
              status: 'live',
              expand: 'logo',
            })
            .pipe(
              catchError((err: unknown) => {
                let msg = 'Could not load events.';
                if (err && typeof err === 'object') {
                  const e = err as { error?: unknown; message?: string };
                  const body = e.error;
                  if (body && typeof body === 'object' && 'error' in body) {
                    const inner = (body as { error?: unknown }).error;
                    if (typeof inner === 'string') {
                      msg = inner;
                    }
                  } else if (typeof body === 'string') {
                    msg = body;
                  } else if (typeof e.message === 'string' && e.message) {
                    msg = e.message;
                  }
                }
                this.error.set(msg);
                return of({ events: [] as EventbriteApiObject[] });
              }),
            );
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((body) => {
        const list = Array.isArray(body?.events) ? body.events : [];
        const mapped = list
          .map((e) => mapEventbriteEvent(e as EventbriteApiObject))
          .filter((x): x is EventbriteListItem => x !== null);
        this.events.set(mapped);
      });
  }
}
