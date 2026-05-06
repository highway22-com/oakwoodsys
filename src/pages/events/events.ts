import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';

export interface EventItem {
  slug: string;
  status?: string;
  type: 'online' | 'in-person';
  tag: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  eventStartISO?: string;
  eventEndISO?: string;
  eventTimeZone?: string;
  durationMinutes?: number;
  registerLink: string;
  heroVideoUrls: string[];
  heroImage: string;
  subtitle: string;
  overview: string;
  speakers: {
    name: string;
    slug?: string;
    role: string;
    description?: string;
    bio: string;
    imageUrl: string;
  }[];
}

export interface EventsContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    heroVideoUrls?: string[];
    heroImage?: string;
  };
  noEventsMessage: {
    title: string;
    description: string;
    ctaText: string;
    ctaAnchor: string;
  };
  upcomingEventsSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  pastEventsSection: { eyebrow: string; title: string; description: string };
  ctaSection: {
    title: string;
    description: string;
    primaryText: string;
    primaryLink: string;
  };
  events: Record<string, EventItem>;
}

/**
 * Returns the UTC millisecond timestamp that represents when an event ends
 * (or starts, if no end/duration is available).
 *
 * ISO strings from the BE already carry a UTC offset (e.g. "2026-04-13T16:00:00-05:00"),
 * so Date.parse() converts them to UTC correctly — no manual timezone math needed.
 */
export function eventRefEndMs(e: EventItem): number | null {
  // Prefer explicit end time
  const endRaw = e.eventEndISO?.trim();
  if (endRaw) {
    const t = Date.parse(endRaw);
    if (Number.isFinite(t)) return t;
  }

  // Fall back to start + duration
  const startRaw = e.eventStartISO?.trim();
  if (!startRaw) return null;
  const startMs = Date.parse(startRaw);
  if (!Number.isFinite(startMs)) return null;

  const d = e.durationMinutes;
  if (typeof d === 'number' && d > 0) {
    return startMs + d * 60_000;
  }

  // Last resort: treat start time as the reference point
  return startMs;
}

/**
 * Returns the UTC millisecond timestamp for when an event starts.
 * Used for sorting upcoming events (ascending) and past events (descending).
 */
export function eventStartMs(e: EventItem): number {
  const raw = e.eventStartISO?.trim();
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Determines whether an event is 'past' or 'upcoming' relative to nowMs (UTC).
 *
 * Priority:
 *  1. ISO-based comparison (most reliable — offset is embedded in the string)
 *  2. Explicit status field as a fallback for events with no date data
 */
export function eventScheduleBucket(
  e: EventItem,
  nowMs: number,
): 'past' | 'upcoming' | null {
  const endMs = eventRefEndMs(e);
  if (endMs !== null) {
    // ISO strings include the offset, so this comparison is timezone-safe
    return endMs < nowMs ? 'past' : 'upcoming';
  }

  // No parseable date — fall back to explicit status field
  const s = e.status?.trim().toLowerCase();
  if (s === 'past') return 'past';
  if (s === 'upcoming' || s === 'in progress' || s === 'in_progress')
    return 'upcoming';

  return null;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, EventCardComponent, CtaSectionComponent, VideoHero],
  templateUrl: './events.html',
})
export default class Events implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mobileBreakpoint = 768;
  private readonly pastDragStartThresholdPx = 6;
  private dragStartX: number | null = null;
  private activePointerId: number | null = null;
  private suppressPastClick = false;

  @ViewChild('pastCarouselViewport')
  pastCarouselViewport?: ElementRef<HTMLDivElement>;

  readonly linkCopied = signal(false);

  readonly loading = signal(true);
  readonly content = signal<EventsContent | null>(null);
  readonly isMobileView = signal(false);
  readonly isPastDragging = signal(false);
  readonly pastDragOffsetPx = signal(0);

  readonly upcomingEvents = signal<EventItem[]>([]);
  readonly pastEvents = signal<EventItem[]>([]);
  readonly hasUpcomingEvents = computed(() => this.upcomingEvents().length > 0);
  readonly hasPastEvents = computed(() => this.pastEvents().length > 0);
  readonly hasAnyEvents = computed(
    () => this.hasUpcomingEvents() || this.hasPastEvents(),
  );

  readonly pastEventsPage = signal(0);
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
      while (chunk.length < pageSize) {
        chunk.push(null);
      }
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
    const maxIndex = Math.max(0, this.pastPageCount() - 1);
    const safePage = Math.max(0, Math.min(page, maxIndex));
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
      const viewport = this.pastCarouselViewport?.nativeElement;
      if (viewport?.setPointerCapture) {
        viewport.setPointerCapture(event.pointerId);
      }
      this.isPastDragging.set(true);
      this.suppressPastClick = true;
    }

    event.preventDefault();
    this.pastDragOffsetPx.set(dragOffset);
  }

  onPastViewportClick(event: MouseEvent): void {
    if (!this.suppressPastClick) return;
    event.preventDefault();
    event.stopPropagation();
    this.suppressPastClick = false;
  }

  @HostListener('window:pointerup', ['$event'])
  onPastPointerUp(event: PointerEvent): void {
    if (
      this.activePointerId !== null &&
      event.pointerId !== this.activePointerId
    )
      return;

    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null) {
      viewport.releasePointerCapture(this.activePointerId);
    }

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
    if (viewport?.releasePointerCapture && this.activePointerId !== null) {
      viewport.releasePointerCapture(this.activePointerId);
    }

    if (!this.isPastDragging()) {
      this.resetPastPointerState();
      return;
    }

    this.finishPastDrag();
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
      if (dragOffset < 0) {
        this.goToPastPage(this.pastEventsPage() + 1);
      } else {
        this.goToPastPage(this.pastEventsPage() - 1);
      }
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

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < this.mobileBreakpoint);
      this.fetchEventsContentFromGraphql();
      return;
    }
  }

  private fetchEventsContentFromGraphql(): void {
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

    this.http
      .post<GraphqlResponse>('/api/graphql', { query })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const raw = res?.data?.eventsContent?.content;
          if (raw) {
            try {
              const data = JSON.parse(raw) as EventsContent;
              if (data?.events && typeof data.events === 'object') {
                this.applyEventsPartition(data);
                this.loading.set(false);
                return;
              }
            } catch {}
          }
          this.loadEventsContentFallback();
        },
        error: () => this.loadEventsContentFallback(),
      });
  }

  private loadEventsContentFallback(): void {
    this.http
      .get<EventsContent>('/events-content.json')
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          if (data?.events && typeof data.events === 'object') {
            this.applyEventsPartition(data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private applyEventsPartition(data: EventsContent): void {
    this.content.set(data);
    const all = Object.values(data.events) as EventItem[];
    const nowMs = Date.now();

    const upcoming = all.filter(
      (e) => eventScheduleBucket(e, nowMs) === 'upcoming',
    );
    const past = all.filter((e) => eventScheduleBucket(e, nowMs) === 'past');

    // Upcoming: soonest first (ascending by start time)
    upcoming.sort((a, b) => eventStartMs(a) - eventStartMs(b));

    // Past: most recent first (descending by start time)
    past.sort((a, b) => eventStartMs(b) - eventStartMs(a));

    this.upcomingEvents.set(upcoming);
    this.pastEvents.set(past);
    this.goToPastPage(0);
  }

  trackBySlug(_: number, event: EventItem): string {
    return event.slug;
  }

  trackBySlideItem(index: number, event: EventItem | null): string {
    return event?.slug ?? `placeholder-${index}`;
  }

  private getShareUrl(): string {
    const base = this.seoMeta.baseUrl.replace(/\/$/, '');
    return `${base}/resources/events`;
  }

  getFacebookShareUrl(): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.getShareUrl())}`;
  }

  getTwitterShareUrl(): string {
    const text = this.content()?.hero?.title ?? 'Events';
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.getShareUrl())}&text=${encodeURIComponent(text)}`;
  }

  getLinkedInShareUrl(): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.getShareUrl())}`;
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
}
