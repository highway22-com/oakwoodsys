import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Subscription, of, throwError } from 'rxjs';
import { CMS_BASE_URL } from '../../app/config/cms.config';
import { serverSitePublicUrl } from '../../app/config/site-public.config';
import {
  DomSanitizer,
  type SafeHtml,
  type SafeResourceUrl,
} from '@angular/platform-browser';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import {
  EventsContent,
  EventItem,
  eventRefEndMs,
  eventScheduleBucket,
} from '../events/events';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { decodeHtmlEntities } from '../../app/utils/cast';

type EventSpeaker = EventItem['speakers'][number];

function extractYoutubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  const re =
    /(?:youtube\.com\/(?:.*[?&]v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})\b/;
  const m = trimmed.match(re);
  return m?.[1] ?? null;
}

function getEventEndTimeMsForHeroVideo(e: EventItem): number | null {
  return eventRefEndMs(e);
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CtaSectionComponent, EventCardComponent],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export default class EventDetail implements OnInit, OnDestroy {
  readonly speakerPlaceholderImage =
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80';

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mobileBreakpoint = 768;
  private readonly pastDragStartThresholdPx = 6;
  private dragStartX: number | null = null;
  private activePointerId: number | null = null;
  private suppressPastClick = false;

  private routeSub?: Subscription;
  private readonly scheduleNowMs = signal(Date.now());
  private scheduleClockTimerId: number | null = null;

  @ViewChild('pastCarouselViewport')
  pastCarouselViewport?: ElementRef<HTMLDivElement>;

  readonly loading = signal(true);
  readonly event = signal<EventItem | null>(null);
  readonly ctaSection = signal<EventsContent['ctaSection'] | null>(null);
  readonly pastEventsSection = signal<
    EventsContent['pastEventsSection'] | null
  >(null);
  readonly linkCopied = signal(false);
  readonly isMobileView = signal(false);
  readonly isPastDragging = signal(false);
  readonly pastDragOffsetPx = signal(0);
  readonly pastEventsPage = signal(0);
  readonly pastEvents = signal<EventItem[]>([]);
  readonly isPastEvent = computed(() => {
    const now = this.scheduleNowMs();
    const e = this.event();
    if (!e) return false;
    return eventScheduleBucket(e, now) === 'past';
  });

  private viewerTimeZoneId(): string | undefined {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }

  readonly section = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('section'))),
  );

  private dateFmtOpts(): Intl.DateTimeFormatOptions {
    const tz = this.viewerTimeZoneId();
    const base: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return tz ? { ...base, timeZone: tz } : base;
  }

  private timeFmtOpts(): Intl.DateTimeFormatOptions {
    const tz = this.viewerTimeZoneId();
    const base: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortGeneric',
    };
    return tz ? { ...base, timeZone: tz } : base;
  }

  private calendarDayKeyInViewerZone(d: Date): string {
    const tz = this.viewerTimeZoneId();
    if (!tz) {
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  readonly timeZoneViewerHint = computed(() => {
    const tz = this.viewerTimeZoneId();
    if (!tz) return null;
    return `Times shown in your time zone (${tz}).`;
  });

  readonly formattedTimeInSiteZone = computed(() => {
    const e = this.event();
    const siteTz = e?.eventTimeZone?.trim();
    if (!siteTz || !e?.eventStartISO) return null;
    const start = new Date(e.eventStartISO);
    if (isNaN(start.getTime())) return null;

    const opts: Intl.DateTimeFormatOptions = {
      timeZone: siteTz,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortGeneric',
    };
    const timeFmt = new Intl.DateTimeFormat(undefined, opts);

    if (!e.eventEndISO) {
      return timeFmt.format(start);
    }
    const end = new Date(e.eventEndISO);
    if (isNaN(end.getTime())) {
      return timeFmt.format(start);
    }
    return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  });

  readonly overviewHtml = computed((): SafeHtml => {
    const raw = this.event()?.overview ?? '';
    let html = decodeHtmlEntities(raw);
    // Remove class="wp-block-list" from all <ul> tags

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly eventHeroVideoUrlsFiltered = computed((): string[] => {
    const now = this.scheduleNowMs();
    const ev = this.event();
    const urls = ev?.heroVideoUrls;
    if (!urls?.length) return [];

    const endMs = ev ? getEventEndTimeMsForHeroVideo(ev) : null;
    if (endMs == null || now <= endMs) return [];

    return urls.filter(
      (u): u is string => typeof u === 'string' && u.trim() !== '',
    );
  });

  readonly showEventHeroVideoSection = computed(
    () => this.eventHeroVideoUrlsFiltered().length > 0,
  );

  readonly firstHeroVideoUrl = computed(
    (): string => this.eventHeroVideoUrlsFiltered()[0] ?? '',
  );

  readonly eventHeroYoutubeEmbed = computed((): SafeResourceUrl | null => {
    const url = this.firstHeroVideoUrl();
    if (!url) return null;
    const id = extractYoutubeVideoId(url);
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0`,
    );
  });

  readonly formattedDate = computed(() => {
    const e = this.event();
    if (!e?.eventStartISO) return null;
    const start = new Date(e.eventStartISO);
    if (isNaN(start.getTime())) return null;

    const tz = this.viewerTimeZoneId();
    const dateFmt = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(tz ? { timeZone: tz } : {}),
    });

    return dateFmt.format(start);
  });

  readonly formattedTime = computed(() => {
    const e = this.event();
    if (!e?.eventStartISO) return null;
    const start = new Date(e.eventStartISO);
    if (isNaN(start.getTime())) return null;

    // Use eventTimeZone from backend if provided, else fallback to UTC
    const tz = e.eventTimeZone?.trim() || 'UTC';
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      timeZone: tz,
    };
    const timeFmt = new Intl.DateTimeFormat('en-US', opts);

    if (!e.eventEndISO) {
      return timeFmt.format(start).replace(',', '');
    }

    const end = new Date(e.eventEndISO);
    if (isNaN(end.getTime())) {
      return timeFmt.format(start).replace(',', '');
    }

    const startParts = timeFmt.formatToParts(start);
    const endParts = timeFmt.formatToParts(end);
    const startHour =
      startParts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '';
    const startMinute =
      startParts.find((p) => p.type === 'minute')?.value ?? '';
    const startDayPeriod =
      startParts.find((p) => p.type === 'dayPeriod')?.value ?? '';
    const endHour =
      endParts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '';
    const endMinute = endParts.find((p) => p.type === 'minute')?.value ?? '';
    const endDayPeriod =
      endParts.find((p) => p.type === 'dayPeriod')?.value ?? '';
    const tzName =
      startParts.find((p) => p.type === 'timeZoneName')?.value ?? '';

    let timeStr = '';
    if (startDayPeriod === endDayPeriod) {
      timeStr = `${startHour}:${startMinute} - ${endHour}:${endMinute} ${endDayPeriod} ${tzName}`;
    } else {
      timeStr = `${startHour}:${startMinute} ${startDayPeriod} - ${endHour}:${endMinute} ${endDayPeriod} ${tzName}`;
    }
    return timeStr.trim();
  });

  readonly formattedDuration = computed(() => {
    const minutes = this.event()?.durationMinutes;
    if (minutes === undefined || minutes === null) return null;
    if (!Number.isFinite(minutes) || minutes <= 0) return null;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs <= 0) return `${minutes} minutes`;
    if (mins === 0) return `${hrs} hour${hrs === 1 ? '' : 's'}`;
    return `${hrs} hour${hrs === 1 ? '' : 's'} ${mins} minute${mins === 1 ? '' : 's'}`;
  });

  readonly pastEventsPageSize = computed(() => (this.isMobileView() ? 1 : 3));
  readonly maxPastEvents = 12;
  readonly maxPastPages = 6;

  readonly limitedPastEvents = computed(() =>
    this.pastEvents().slice(0, this.maxPastEvents),
  );

  readonly pastPageCount = computed(() =>
    Math.min(
      this.maxPastPages,
      Math.ceil(this.limitedPastEvents().length / this.pastEventsPageSize()),
    ),
  );

  readonly pastSlides = computed<(EventItem | null)[][]>(() => {
    const items = this.limitedPastEvents();
    const pageSize = this.pastEventsPageSize();
    const slides: (EventItem | null)[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
      const chunk: (EventItem | null)[] = items.slice(i, i + pageSize);
      while (chunk.length < pageSize) chunk.push(null);
      slides.push(chunk);
    }
    return slides;
  });

  readonly pastPageArray = computed(() =>
    Array.from({ length: this.pastPageCount() }, (_, i) => i),
  );

  readonly pastTrackTransform = computed(
    () =>
      `translateX(calc(-${this.pastEventsPage() * 100}% + ${this.pastDragOffsetPx()}px))`,
  );

  goToPastPage(page: number): void {
    const safePage = Math.max(
      0,
      Math.min(page, Math.max(0, this.pastPageCount() - 1)),
    );
    this.pastEventsPage.set(safePage);
    this.pastDragOffsetPx.set(0);
  }

  onPastPointerDown(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const viewport = this.pastCarouselViewport?.nativeElement;
    if (!viewport) return;
    this.suppressPastClick = false;
    this.activePointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.isPastDragging.set(false);
    this.pastDragOffsetPx.set(0);
    // Pointer capture is set lazily in onPastPointerMove once the drag
    // threshold is crossed, so simple taps/clicks are never redirected.
  }

  onPastDragStart(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onPastPointerMove(event: PointerEvent): void {
    if (this.dragStartX === null || this.activePointerId === null) return;
    if (
      this.activePointerId !== null &&
      event.pointerId !== this.activePointerId
    )
      return;
    const dragOffset = event.clientX - this.dragStartX;
    if (!this.isPastDragging()) {
      if (Math.abs(dragOffset) <= this.pastDragStartThresholdPx) return;
      // Threshold crossed — lock pointer capture now so fast out-of-bounds
      // moves are still tracked, then mark as dragging.
      const viewport = this.pastCarouselViewport?.nativeElement;
      if (viewport?.setPointerCapture)
        viewport.setPointerCapture(event.pointerId);
      this.isPastDragging.set(true);
      this.suppressPastClick = true;
    }
    event.preventDefault();
    this.pastDragOffsetPx.set(dragOffset);
  }

  @HostListener('window:pointerup', ['$event'])
  onPastPointerUp(event: PointerEvent): void {
    if (
      this.activePointerId !== null &&
      event.pointerId !== this.activePointerId
    )
      return;
    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null)
      viewport.releasePointerCapture(this.activePointerId);
    if (!this.isPastDragging()) {
      this.resetPastPointerState();
      return;
    }
    this.finishPastDrag();
  }

  @HostListener('window:pointercancel', ['$event'])
  onPastPointerCancel(event: PointerEvent): void {
    if (
      this.activePointerId !== null &&
      event.pointerId !== this.activePointerId
    )
      return;
    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null)
      viewport.releasePointerCapture(this.activePointerId);
    if (!this.isPastDragging()) {
      this.resetPastPointerState();
      return;
    }
    this.finishPastDrag();
  }

  onPastViewportClick(event: MouseEvent): void {
    if (!this.suppressPastClick) return;
    event.preventDefault();
    event.stopPropagation();
    this.suppressPastClick = false;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isMobileView.set(window.innerWidth < this.mobileBreakpoint);
    this.goToPastPage(this.pastEventsPage());
  }

  private finishPastDrag(): void {
    const viewportWidth =
      this.pastCarouselViewport?.nativeElement?.clientWidth ?? 0;
    const threshold = Math.max(36, viewportWidth * 0.08);
    const dragOffset = this.pastDragOffsetPx();
    if (Math.abs(dragOffset) >= threshold) {
      this.goToPastPage(this.pastEventsPage() + (dragOffset < 0 ? 1 : -1));
    } else {
      this.pastDragOffsetPx.set(0);
    }
    this.resetPastPointerState();
  }

  private resetPastPointerState(): void {
    this.dragStartX = null;
    this.activePointerId = null;
    this.isPastDragging.set(false);
    this.pastDragOffsetPx.set(0);
  }

  trackBySlug(_: number, event: EventItem): string {
    return event.slug;
  }
  trackBySlideItem(index: number, event: EventItem | null): string {
    return event?.slug ?? `placeholder-${index}`;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < this.mobileBreakpoint);
      this.scheduleNowMs.set(Date.now());
      this.scheduleClockTimerId = window.setInterval(() => {
        this.scheduleNowMs.set(Date.now());
      }, 30_000) as number;
    } else {
      return;
    }

    this.routeSub = this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug') ?? '';
          this.loading.set(true);
          this.event.set(null);
          this.pastEvents.set([]);
          this.goToPastPage(0);
          return this.fetchEventsContent(slug).pipe(
            switchMap((data) => {
              const current = data.events[slug] ?? null;
              this.event.set(current);
              this.scheduleNowMs.set(Date.now());
              this.ctaSection.set(data.ctaSection);
              this.pastEventsSection.set(data.pastEventsSection);

              const nowMs = Date.now();

              this.pastEvents.set(
                Object.entries(data.events)
                  .filter(([key, e]) => {
                    if (key === slug) return false;
                    const iso = e.eventEndISO ?? e.eventStartISO;
                    if (!iso) return false;
                    const ms = new Date(iso).getTime();
                    if (!Number.isFinite(ms)) return false;
                    return ms < nowMs;
                  })
                  .map(([, e]) => e),
              );

              this.goToPastPage(0);
              this.updateEventSeoMeta(current, slug);
              this.loading.set(false);
              return of(null);
            }),
            catchError(() => {
              this.event.set(null);
              this.updateEventSeoMeta(null, slug);
              this.loading.set(false);
              return of(null);
            }),
          );
        }),
      )
      .subscribe();
  }

  private updateEventSeoMeta(e: EventItem | null, _slug: string): void {
    if (!e) {
      this.seoMeta.updateMeta({
        title: 'Event Not Found | Oakwood Systems',
        description:
          'We could not find this event. Browse upcoming and past events from Oakwood Systems.',
        canonicalPath: '/resources/events',
        ogType: 'website',
      });
      return;
    }

    const title = `${e.title} | Oakwood Systems`;
    const rawDesc = (e.summary ?? e.subtitle ?? '').trim();
    const plain =
      rawDesc.length > 0
        ? decodeHtmlEntities(rawDesc)
            .replace(/<[^>]*>/g, '')
            .trim()
        : '';
    const description =
      plain.length > 0 ? plain : this.seoMeta.defaultDescription;

    const canonicalPath = `/resources/events/${e.slug}`;
    const image = this.eventOgImageAbsoluteUrl(e);
    const keywords = e.tag?.trim()
      ? `${e.tag.trim()}, ${this.seoMeta.defaultKeywords}`
      : this.seoMeta.defaultKeywords;

    this.seoMeta.updateMeta({
      title,
      description,
      keywords,
      keyphrase: e.tag?.trim() || undefined,
      canonicalPath,
      image,
      imageAlt: (e.imageAlt ?? '').trim() || e.title,
      ogType: 'website',
    });
  }

  private eventOgImageAbsoluteUrl(e: EventItem): string | undefined {
    const raw = (e.heroImage || e.imageUrl || '').trim();
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = this.seoMeta.baseUrl.replace(/\/$/, '');
    return base + (raw.startsWith('/') ? raw : `/${raw}`);
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    if (this.scheduleClockTimerId !== null) {
      clearInterval(this.scheduleClockTimerId);
      this.scheduleClockTimerId = null;
    }
  }

  private getShareUrl(): string {
    const slug = this.event()?.slug;
    const base = this.seoMeta.baseUrl.replace(/\/$/, '');
    return slug
      ? `${base}/resources/events/${slug}`
      : `${base}/resources/events`;
  }

  getFacebookShareUrl(): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.getShareUrl())}`;
  }

  getTwitterShareUrl(): string {
    const text = this.event()?.title ?? 'Event';
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.getShareUrl())}&text=${encodeURIComponent(text)}`;
  }

  getLinkedInShareUrl(): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.getShareUrl())}`;
  }

  speakerImageUrl(speaker: EventSpeaker): string {
    const url = (speaker.imageUrl ?? '').trim();
    return url !== '' ? url : this.speakerPlaceholderImage;
  }

  speakerDescription(speaker: EventSpeaker): string {
    const fromDesc = (speaker.description ?? '').trim();
    if (fromDesc !== '') return fromDesc;
    return (speaker.bio ?? '').trim();
  }

  eventTypeBadgeText(e: EventItem): string {
    const tag = e.tag?.trim();
    if (tag) return decodeHtmlEntities(tag);
    return e.type === 'in-person' ? 'In person' : 'Online';
  }

  getBreadcrumbs(): { label: string; link?: string }[] {
    const title = this.event()?.title ?? 'Event Detail';
    return [
      { label: 'Home', link: '/' },
      { label: 'Events', link: '/resources/events' },
      { label: title },
    ];
  }

  copyLinkToClipboard(event: Event): void {
    event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) return;
    const url = this.getShareUrl();
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      })
      .catch(() => {});
  }

  private eventsContentJsonUrl(): string {
    return isPlatformBrowser(this.platformId)
      ? '/events-content.json'
      : `${serverSitePublicUrl()}/events-content.json`;
  }

  private fetchEventsContent(slug: string) {
    return this.postEventsGraphql().pipe(
      switchMap((data) => {
        if (data?.events?.[slug]) return of(data);
        return throwError(() => new Error('Event slug not in GraphQL payload'));
      }),
      catchError(() =>
        this.http.get<EventsContent>(this.eventsContentJsonUrl()),
      ),
    );
  }

  private postEventsGraphql() {
    type GraphqlResponse = {
      data?: { eventsContent?: { content?: string | null } | null } | null;
      errors?: unknown;
    };

    const query = `
      query EventsContent {
        eventsContent {
          content
        }
      }
    `;

    const url = isPlatformBrowser(this.platformId)
      ? '/api/graphql'
      : `${CMS_BASE_URL}/graphql`;

    return this.http.post<GraphqlResponse>(url, { query }).pipe(
      switchMap((res) => {
        const raw = res?.data?.eventsContent?.content;

        if (!raw) {
          return throwError(() => new Error('Missing eventsContent.content'));
        }
        try {
          const parsed = JSON.parse(raw) as EventsContent;
          if (parsed?.events && typeof parsed.events === 'object') {
            console.log(parsed?.events, 'rawrawrawrawrawrawrawrawraw');
            return of(parsed);
          }
        } catch {
          /* invalid JSON */
        }
        return throwError(() => new Error('Invalid events content'));
      }),
    );
  }
}
