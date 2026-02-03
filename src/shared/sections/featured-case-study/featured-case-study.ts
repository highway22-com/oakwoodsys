import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterLink],
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

  /** Dos slugs de case studies a mostrar; los botones alternan entre ellos. */
  @Input({ required: true }) slugsFeaturedCaseStudies!: string[];

  readonly caseStudiesData = signal<FeaturedCaseStudyView[]>([]);
  readonly loading = signal(true);
  readonly selectedIndex = signal(0);
  /** Clave que cambia en cada selección para forzar que la animación se ejecute. */
  readonly animationKey = signal(0);

  readonly currentSection = computed(() => {
    const list = this.caseStudiesData();
    const i = this.selectedIndex();
    return list[i] ?? null;
  });

  /** Título para mostrar (string). */
  get titleText(): string {
    const s = this.currentSection();
    const t = s?.title;
    return typeof t === 'string' ? t : '';
  }

  ngOnInit(): void {
    this.loadCaseStudies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slugsFeaturedCaseStudies']) {
      this.loadCaseStudies();
    }
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
    if (!slugs?.length || slugs.length < 2) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const [slug1, slug2] = slugs.slice(0, 2);

    forkJoin({
      a: this.graphql.getCaseStudyBySlug(slug1).pipe(take(1), catchError(() => of(null))),
      b: this.graphql.getCaseStudyBySlug(slug2).pipe(take(1), catchError(() => of(null))),
    }).subscribe({
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
    const imageUrl = getAcfMediaUrl(heroImage);
    const imageAlt =
      heroImage != null && typeof heroImage === 'object' ? heroImage.node?.altText : undefined;
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
