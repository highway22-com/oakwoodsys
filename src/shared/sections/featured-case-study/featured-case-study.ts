import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, Input, OnInit, OnChanges, SimpleChanges, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonPrimaryComponent } from '../../button-primary/button-primary.component';
import { GraphQLContentService } from '../../../app/services/graphql-content.service';
import type { CaseStudy } from '../../../app/api/graphql';
import { getPrimaryTagName, getPrimaryTagSlug } from '../../../app/api/graphql';
import { take } from 'rxjs/operators';
import { decodeHtmlEntities } from '../../../app/utils/cast';
import { FeaturedCaseStudyCategory } from './featured-case-study-category';
export { FeaturedCaseStudyCategory } from './featured-case-study-category';

/** Vista de un case study para el template (mapeado desde CaseStudy / Gen Content lista, misma estructura que post). */
export interface FeaturedCaseStudyView {
  label?: string;
  tag?: string;
  title?: string;
  description?: string;
  image?: { url?: string; alt?: string };
  /** Nombre del primary tag para mostrar (ej. "Data & AI Solutions"). */
  primaryTag?: string;
  /** Slug del primary tag para enlazar al listado con filtro preseleccionado. */
  primaryTagSlug?: string;
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
  [x: string]: any;
  private readonly graphql = inject(GraphQLContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);
  readonly titleText = 'Featured Case Studies'

  readonly decodeHtmlEntities = decodeHtmlEntities;

  /** Categoría de featured (enum). Define el contexto: blog/resources, menu, industry, services, home. */
  @Input({ required: true }) featuredCategory!: FeaturedCaseStudyCategory;
  @Input({ required: false }) primaryTagSlug: string | undefined;

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

  /** Window scroll drives the sticky desktop section transitions. */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const host = this.el.nativeElement as HTMLElement;
    const wrapper = host.querySelector('.fcs-desktop-scroll-wrapper') as HTMLElement;
    if (!wrapper) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const wrapperHeight = wrapper.offsetHeight;
    const vp = window.innerHeight;
    const scrollable = Math.max(1, wrapperHeight - vp);
    const scrolled = Math.max(0, Math.min(scrollable, window.scrollY - wrapperTop));
    const progress = scrolled / scrollable;
    this.scrollProgress.set(progress);
    this.selectedIndex.set(progress >= 0.5 ? 1 : 0);
    this.cdr.markForCheck();
  }

  /** Fill block slides from top-half (landing) to bottom-half (end): top 0→50%, height fixed 50%. */
  get scrollBarFillTop(): string { return `${this.scrollProgress() * 50}%`; }

  ngOnInit(): void {
    this.loadCaseStudies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const slugsChange = changes['slugsFeaturedCaseStudies'];
    const categoryChange = changes['featuredCategory'];
    const tagChange = changes['primaryTagSlug'];
    if (slugsChange && !slugsChange.firstChange) {
      this.loadCaseStudies();
    } else if (categoryChange && !categoryChange.firstChange) {
      this.loadCaseStudies();
    } else if (tagChange && !tagChange.firstChange) {
      this.loadCaseStudies();
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

  /** Carga case studies con la misma query que resources (GET_GEN_CONTENTS_BY_CATEGORY, case-study); estructura tipo post. */
  private loadCaseStudies(): void {
    const slugs = this.slugsFeaturedCaseStudies;
    if (!slugs?.length) {
      this.loading.set(false);
      return;
    }

    const key = this.slugKey(slugs) + '|' + this.featuredCategory + '|' + (this.primaryTagSlug ?? '');
    if (key === this.lastSlugKey) return;
    this.lastSlugKey = key;

    this.loading.set(true);
    const [slug1, slug2] = slugs.slice(0, 2);

    this.graphql
      .getCaseStudies()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (caseStudies) => {
          const categorySlug = this.featuredCategory;
          const primaryTagSlug = this.primaryTagSlug;
          const filtered = [...caseStudies].filter((n) =>
            n.caseStudyCategories?.nodes?.find((c) => c.slug === categorySlug)
          );

          let _list = filtered.length > 0 ? filtered : caseStudies;
          if (primaryTagSlug) {
            const byTag = [..._list].filter(
              (n) => getPrimaryTagSlug(n.primaryTagName, n.genContentTags) === primaryTagSlug
            );
            _list = byTag.length > 0 ? byTag : _list;
          }
          const list = [..._list].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const bySlug = (s: string) => list.find((c) => c.slug === s);
          const picked: CaseStudy[] = [];
          const a = bySlug(slug1);
          const b = bySlug(slug2);
          if (a) picked.push(a);
          if (b && b !== a) picked.push(b);
          if (picked.length < 2) {
            const rest = list.filter((c) => !picked.includes(c));
            picked.push(...rest.slice(0, 2 - picked.length));
          }
          const viewList = picked.map((cs) => this.mapCaseStudyToListView(cs));
          this.caseStudiesData.set(viewList);
          if (this.selectedIndex() >= viewList.length) {
            this.selectedIndex.set(0);
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          console.error('Error loading case studies');
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /** Mapea CaseStudy (lista Gen Content, misma estructura que post) a FeaturedCaseStudyView. */
  private mapCaseStudyToListView(cs: CaseStudy): FeaturedCaseStudyView {
    const imageUrl = cs.featuredImage?.node?.sourceUrl;
    const imageAlt = cs.featuredImage?.node?.altText ?? undefined;
    const tag =
      cs.caseStudyDetails?.tags?.[0] ??
      cs.caseStudyCategories?.nodes?.[0]?.name ??
      'Case Study';
    const description =
      cs.caseStudyDetails?.cardDescription?.trim() || cs.excerpt || '';
    const primaryTag = getPrimaryTagName(cs.primaryTagName) ?? cs.genContentTags?.nodes?.[0]?.name ?? null;
    const primaryTagSlug = getPrimaryTagSlug(cs.primaryTagName, cs.genContentTags);
    const basePath = '/resources/case-studies';
    const secondaryLink = primaryTagSlug ? `${basePath}?primaryTag=${primaryTagSlug}` : basePath;

    return {
      label: 'Featured Case Studies',
      tag,
      title: cs.title ?? '',
      description,
      image: { url: imageUrl, alt: imageAlt },
      primaryTag: primaryTag ?? undefined,
      primaryTagSlug: primaryTagSlug ?? undefined,
      cta: {
        primary: {
          text: 'Read more',
          link: `/resources/case-studies/${cs.slug}`,
          backgroundColor: '#1e3a5f',
        },
        secondary: {
          text: 'View all case studies',
          link: secondaryLink,
        },
      },
    };
  }

}
