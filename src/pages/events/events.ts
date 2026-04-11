import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { SeoMetaService } from '../../app/services/seo-meta.service';

export interface EventItem {
  slug: string;
  status: 'upcoming' | 'past';
  statusLabel: string;
  type: 'online' | 'in-person';
  badgeMonth: string;
  badgeDay: string;
  tag: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  eventDate: string;
  eventTime: string;
  registerLink: string;
  heroVideoUrls: string[];
  heroImage: string;
  subtitle: string;
  overview: string;
  learnings: string[];
  aboutSession: string;
  speakers: { name: string; role: string; bio: string; imageUrl: string }[];
}

export interface EventsContent {
  hero: { eyebrow: string; title: string; description: string; heroVideoUrls?: string[]; heroImage?: string };
  noEventsMessage: { title: string; description: string; ctaText: string; ctaAnchor: string };
  upcomingEventsSection: { eyebrow: string; title: string; description: string };
  pastEventsSection: { eyebrow: string; title: string; description: string };
  ctaSection: { title: string; description: string; primaryText: string; primaryLink: string };
  events: Record<string, EventItem>;
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
  private dragStartX: number | null = null;
  private activePointerId: number | null = null;
  private suppressPastClick = false;

  @ViewChild('pastCarouselViewport') pastCarouselViewport?: ElementRef<HTMLDivElement>;

  readonly linkCopied = signal(false);

  readonly loading = signal(true);
  readonly content = signal<EventsContent | null>(null);
  readonly isMobileView = signal(false);
  readonly isPastDragging = signal(false);
  readonly pastDragOffsetPx = signal(0);

  readonly upcomingEvents = signal<EventItem[]>([]);
  readonly pastEvents = signal<EventItem[]>([]);

  readonly pastEventsPage = signal(0);
  readonly pastEventsPageSize = computed(() => this.isMobileView() ? 1 : 3);
  readonly maxPastEvents = 12;
  readonly maxPastPages = 6;

  readonly limitedPastEvents = computed(() =>
    this.pastEvents().slice(0, this.maxPastEvents)
  );

  readonly pastPageCount = computed(() =>
    Math.min(
      this.maxPastPages,
      Math.ceil(this.limitedPastEvents().length / this.pastEventsPageSize())
    )
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
    Array.from({ length: this.pastPageCount() }, (_, i) => i)
  );

  readonly pastTrackTransform = computed(() =>
    `translateX(calc(-${this.pastEventsPage() * 100}% + ${this.pastDragOffsetPx()}px))`
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

    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.isPastDragging.set(true);
    this.pastDragOffsetPx.set(0);

    if (viewport.setPointerCapture) {
      viewport.setPointerCapture(event.pointerId);
    }
  }

  onPastDragStart(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onPastPointerMove(event: PointerEvent): void {
    if (!this.isPastDragging() || this.dragStartX === null) return;
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;

    const dragOffset = event.clientX - this.dragStartX;
    if (Math.abs(dragOffset) > 6) {
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
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;
    if (!this.isPastDragging()) return;

    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null) {
      viewport.releasePointerCapture(this.activePointerId);
    }
    this.finishPastDrag();
  }

  @HostListener('window:pointercancel', ['$event'])
  onPastPointerCancel(event: PointerEvent): void {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;
    if (!this.isPastDragging()) return;

    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null) {
      viewport.releasePointerCapture(this.activePointerId);
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
    const viewportWidth = this.pastCarouselViewport?.nativeElement?.clientWidth ?? 0;
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

    this.dragStartX = null;
    this.activePointerId = null;
    this.isPastDragging.set(false);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < this.mobileBreakpoint);
    }

    this.http
      .get<EventsContent>('/events-content.json')
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.content.set(data);
          const all = Object.values(data.events);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          this.upcomingEvents.set(
            all.filter((e) => {
              const d = new Date(e.eventDate);
              return !isNaN(d.getTime()) ? d >= today : e.status === 'upcoming';
            })
          );
          this.pastEvents.set(
            all.filter((e) => {
              const d = new Date(e.eventDate);
              return !isNaN(d.getTime()) ? d < today : e.status === 'past';
            })
          );
          this.goToPastPage(0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  trackBySlug(_: number, event: EventItem): string {
    return event.slug;
  }

  trackBySlideItem(index: number, event: EventItem | null): string {
    return event?.slug ?? `placeholder-${index}`;
  }

  private getShareUrl(): string {
    const base = this.seoMeta.baseUrl.replace(/\/$/, '');
    return `${base}/events`;
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
    navigator.clipboard?.writeText(url).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    }).catch(() => { });
  }
}
