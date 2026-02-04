import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonPrimaryComponent } from '../../button-primary/button-primary.component';
import { forkJoin, of } from 'rxjs';
import { take, catchError } from 'rxjs/operators';
import { GraphQLContentService } from '../../../app/services/graphql-content.service';
import { getAcfMediaUrl, type CaseStudyBy } from '../../../app/api/graphql';

/** Vista de un case study para el template (mapeado desde CaseStudyBy). */
export interface FeaturedCaseStudyView {
  label?: string;
  tag?: string;
  title?: string;
  description?: string;
  image?: { url?: string; alt?: string };
  cta?: {
    primary?: { text?: string; link?: string; backgroundColor?: string };
    secondary?: { text?: string; link?: string };
  };
}

@Component({
  selector: 'app-featured-case-study',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonPrimaryComponent],
  templateUrl: './featured-case-study.html',
  styleUrl: './featured-case-study.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-32px)' }),
        animate('550ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(-32px)' }),
        animate('550ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class FeaturedCaseStudySectionComponent implements OnInit, OnChanges {
  private readonly graphql = inject(GraphQLContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly titleText = 'Featured Case Study'

  /** Slugs de case studies a mostrar. */
  @Input({ required: true }) slugsFeaturedCaseStudies!: string[];

  readonly caseStudiesData = signal<FeaturedCaseStudyView[]>([]);
  readonly loading = signal(true);
  readonly selectedIndex = signal(0);
  /** Progreso de scroll 0 (arriba) a 1 (abajo) para transición de imagen. */
  readonly scrollProgress = signal(0);
  /** Clave que cambia en cada selección para forzar que la animación se ejecute. */
  readonly animationKey = signal(0);

  /** Últimos slugs con los que se cargó; evita recargar si es la misma lista (misma referencia o mismo contenido). */
  private lastSlugKey = '';

  readonly currentSection = computed(() => {
    const list = this.caseStudiesData();
    return list;
  });

  /** Actualiza scrollProgress desde el evento (scroll) del contenedor. */
  onScrollContainerScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el || el.nodeName !== 'DIV') return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    this.scrollProgress.set(progress);
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.loadCaseStudies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const slugsChange = changes['slugsFeaturedCaseStudies'];
    if (slugsChange && !slugsChange.firstChange) {
      const key = this.slugKey(this.slugsFeaturedCaseStudies);
      if (key !== this.lastSlugKey) this.loadCaseStudies();
    }
  }

  private slugKey(slugs: string[]): string {
    return Array.isArray(slugs) ? slugs.join(',') : '';
  }

  selectCaseStudy(index: number): void {
    const list = this.caseStudiesData();
    if (index >= 0 && index < list.length) {
      this.selectedIndex.set(index);
      this.animationKey.update((k) => k + 1);
      this.cdr.markForCheck();
    }
  }

  private loadCaseStudies(): void {
    const slugs = this.slugsFeaturedCaseStudies;
    if (!slugs?.length) {
      this.loading.set(false);
      return;
    }

    const key = this.slugKey(slugs);
    if (key === this.lastSlugKey) return;
    this.lastSlugKey = key;

    this.loading.set(true);
    const [slug1, slug2] = slugs.slice(0, 2);

    forkJoin({
      a: this.graphql.getCaseStudyBySlug(slug1).pipe(take(1), catchError(() => of(null))),
      b: this.graphql.getCaseStudyBySlug(slug2).pipe(take(1), catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ a, b }) => {
          const list: FeaturedCaseStudyView[] = [];
          if (a) list.push(this.mapCaseStudyToView(a));
          if (b) list.push(this.mapCaseStudyToView(b));
          this.caseStudiesData.set(list);
          const current = this.selectedIndex();
          if (current >= list.length) {
            this.selectedIndex.set(0);
          }
          this.loading.set(false);
        },
        error: () => {
          console.error('Error loading case studies');
          this.loading.set(false);
        },
      });
  }

  private mapCaseStudyToView(cs: CaseStudyBy): FeaturedCaseStudyView {
    const heroImage = cs.caseStudyDetails?.heroImage;
    const imageUrl =
      getAcfMediaUrl(heroImage) || cs.featuredImage?.node?.sourceUrl;
    const imageAlt =
      heroImage != null && typeof heroImage === 'object'
        ? heroImage.node?.altText
        : cs.featuredImage?.node?.altText;
    const tag = cs.caseStudyDetails?.tags?.[0] ?? 'Case Study';

    return {
      label: 'Featured Case Study',
      tag,
      title: cs.title ?? '',
      description: (cs.caseStudyDetails?.cardDescription?.trim() || cs.excerpt) ?? '',
      image: { url: imageUrl, alt: imageAlt },
      cta: {
        primary: {
          text: 'Read more',
          link: `/resources/case-studies/${cs.slug}`,
          backgroundColor: '#1e3a5f',
        },
        secondary: {
          text: 'View all case studies',
          link: '/resources/case-studies',
        },
      },
    };
  }
}
