import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { decodeHtmlEntities } from '../../../app/utils/cast';

export interface SnapCaseStudyItem {
  tag?: string;
  title: string;
  description: string;
  image: { url: string; alt: string };
  pills?: string[];
  cta: {
    primary: { text: string; link: string };
    secondary?: { text: string; link: string };
  };
}

/** Dummy data - replace with real data / input later */
const DUMMY_ITEMS: SnapCaseStudyItem[] = [
  {
    tag: 'Application Innovation',
    pills: ['Application Innovation', 'Data & Analytics'],
    title: 'Power BI Report Development',
    description:
      'Advancing data visibility and analytics through standardised Power BI reporting — turning raw data into executive-ready dashboards that drive faster, smarter decisions.',
    image: {
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
      alt: 'Power BI Report Development',
    },
    cta: {
      primary: { text: 'Read more', link: '/resources/case-studies/power-bi-report-development' },
      secondary: { text: 'View all case studies', link: '/resources/case-studies' },
    },
  },
  {
    tag: 'Digital Transformation',
    pills: ['Digital Transformation', 'Cloud Migration'],
    title: 'Enterprise Cloud Migration',
    description:
      'Orchestrating a seamless lift-and-shift migration of legacy infrastructure to Azure — cutting operational costs by 40% and significantly boosting uptime and resilience.',
    image: {
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
      alt: 'Enterprise Cloud Migration',
    },
    cta: {
      primary: { text: 'Read more', link: '/resources/case-studies/enterprise-cloud-migration' },
      secondary: { text: 'View all case studies', link: '/resources/case-studies' },
    },
  },
  {
    tag: 'Managed Services',
    pills: ['Managed Services', 'Security'],
    title: 'End-to-End IT Support Transformation',
    description:
      'Delivering a fully managed IT support model for a national retail chain — achieving 99.9% SLA adherence and reducing incident resolution time by over 60%.',
    image: {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
      alt: 'IT Support Transformation',
    },
    cta: {
      primary: { text: 'Read more', link: '/resources/case-studies/it-support-transformation' },
      secondary: { text: 'View all case studies', link: '/resources/case-studies' },
    },
  },
];

@Component({
  selector: 'app-featured-case-study-snap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './featured-case-study-snap.html',
  styleUrl: './featured-case-study-snap.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedCaseStudySnapComponent implements AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly decodeHtmlEntities = decodeHtmlEntities;
  readonly items = signal<SnapCaseStudyItem[]>(DUMMY_ITEMS);
  readonly activeIndex = signal(0);
  readonly textFadeOpacity = signal(1);

  @ViewChild('snapWrapper') snapWrapperRef!: ElementRef<HTMLElement>;
  @ViewChildren('caseSlide') slideRefs!: QueryList<ElementRef<HTMLElement>>;

  private observer: IntersectionObserver | null = null;

  get total(): number {
    return this.items().length;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  progressWidth(): string {
    return `${((this.activeIndex() + 1) / this.total) * 100}%`;
  }

  goTo(index: number): void {
    const clamped = Math.max(0, Math.min(this.total - 1, index));
    const slides = this.slideRefs?.toArray();
    if (!slides?.length) return;
    const target = slides[clamped]?.nativeElement;
    if (target) {
      this.snapWrapperRef.nativeElement.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset['index'] ?? '0', 10);
            if (idx === this.activeIndex()) return;
            this.textFadeOpacity.set(0);
            setTimeout(() => {
              this.activeIndex.set(idx);
              setTimeout(() => this.textFadeOpacity.set(1), 50);
              this.cdr.markForCheck();
            }, 200);
          }
        });
      },
      { root: this.snapWrapperRef.nativeElement, threshold: 0.5 }
    );

    this.slideRefs.forEach((ref) => this.observer!.observe(ref.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.goTo(this.activeIndex() + 1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') this.goTo(this.activeIndex() - 1);
  }

  /** Track by for @for loop */
  trackByIndex(index: number): number {
    return index;
  }
}
