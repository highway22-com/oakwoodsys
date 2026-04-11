import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { EventsContent, EventItem } from '../events/events';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CtaSectionComponent, EventCardComponent],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export default class EventDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mobileBreakpoint = 768;
  private dragStartX: number | null = null;
  private activePointerId: number | null = null;
  private suppressPastClick = false;

  @ViewChild('pastCarouselViewport') pastCarouselViewport?: ElementRef<HTMLDivElement>;

  readonly loading = signal(true);
  readonly event = signal<EventItem | null>(null);
  readonly ctaSection = signal<EventsContent['ctaSection'] | null>(null);
  readonly pastEventsSection = signal<EventsContent['pastEventsSection'] | null>(null);
  readonly linkCopied = signal(false);
  readonly isMobileView = signal(false);
  readonly isPastDragging = signal(false);
  readonly pastDragOffsetPx = signal(0);
  readonly pastEventsPage = signal(0);
  readonly pastEvents = signal<EventItem[]>([]);

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
      while (chunk.length < pageSize) chunk.push(null);
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
    const safePage = Math.max(0, Math.min(page, Math.max(0, this.pastPageCount() - 1)));
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
    if (viewport.setPointerCapture) viewport.setPointerCapture(event.pointerId);
  }

  onPastDragStart(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onPastPointerMove(event: PointerEvent): void {
    if (!this.isPastDragging() || this.dragStartX === null) return;
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;
    const dragOffset = event.clientX - this.dragStartX;
    if (Math.abs(dragOffset) > 6) this.suppressPastClick = true;
    event.preventDefault();
    this.pastDragOffsetPx.set(dragOffset);
  }

  @HostListener('window:pointerup', ['$event'])
  onPastPointerUp(event: PointerEvent): void {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;
    if (!this.isPastDragging()) return;
    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null)
      viewport.releasePointerCapture(this.activePointerId);
    this.finishPastDrag();
  }

  @HostListener('window:pointercancel', ['$event'])
  onPastPointerCancel(event: PointerEvent): void {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;
    if (!this.isPastDragging()) return;
    const viewport = this.pastCarouselViewport?.nativeElement;
    if (viewport?.releasePointerCapture && this.activePointerId !== null)
      viewport.releasePointerCapture(this.activePointerId);
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
    const viewportWidth = this.pastCarouselViewport?.nativeElement?.clientWidth ?? 0;
    const threshold = Math.max(36, viewportWidth * 0.08);
    const dragOffset = this.pastDragOffsetPx();
    if (Math.abs(dragOffset) >= threshold) {
      this.goToPastPage(this.pastEventsPage() + (dragOffset < 0 ? 1 : -1));
    } else {
      this.pastDragOffsetPx.set(0);
    }
    this.dragStartX = null;
    this.activePointerId = null;
    this.isPastDragging.set(false);
  }

  trackBySlug(_: number, event: EventItem): string { return event.slug; }
  trackBySlideItem(index: number, event: EventItem | null): string {
    return event?.slug ?? `placeholder-${index}`;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth < this.mobileBreakpoint);
    }
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.http
      .get<EventsContent>('/events-content.json')
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.event.set(data.events[slug] ?? null);
          this.ctaSection.set(data.ctaSection);
          this.pastEventsSection.set(data.pastEventsSection);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          this.pastEvents.set(
            Object.entries(data.events)
              .filter(([key, e]) => {
                if (key === slug) return false;
                const d = new Date(e.eventDate);
                return !isNaN(d.getTime()) ? d < today : e.status === 'past';
              })
              .map(([, e]) => e)
          );
          this.goToPastPage(0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private getShareUrl(): string {
    const slug = this.event()?.slug;
    const base = this.seoMeta.baseUrl.replace(/\/$/, '');
    return slug ? `${base}/events/${slug}` : `${base}/events`;
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

  getBreadcrumbs(): { label: string; link?: string }[] {
    const title = this.event()?.title ?? 'Event Detail';
    return [
      { label: 'Home', link: '/' },
      { label: 'Events', link: '/events' },
      { label: title },
    ];
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
