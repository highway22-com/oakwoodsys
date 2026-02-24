import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GraphQLContentService } from '../../../app/services/graphql-content.service';
import type { CaseStudy, GenContentListNode } from '../../../app/api/graphql';
import { take } from 'rxjs/operators';
import { decodeHtmlEntities } from '../../../app/utils/cast';
import { FeaturedCaseStudyCategory } from '../featured-case-study/featured-case-study-category';

/** Vista de un case study para el template (mapeado desde CaseStudy / Gen Content lista, misma estructura que post). */
export interface FeaturedCaseStudyCardsView {
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
  selector: 'app-featured-case-study-cards',
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
export class FeaturedCaseStudyCardsSectionComponent implements OnInit, OnChanges {
  private readonly graphql = inject(GraphQLContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly titleText = 'Featured Case Study'
  readonly decodeHtmlEntities = decodeHtmlEntities;

  /** true = blog, false = case studies/resources. */
  @Input({ required: false }) isBlogs = true;
  /** Categoría de featured (enum). Define el contexto: blog/resources, menu, industry, services, home. */
  @Input({ required: true }) featuredCategory!: FeaturedCaseStudyCategory;
  @Input({ required: false }) primaryTagSlug: string | undefined;

  /** Slugs de case studies/blogs a mostrar (prioridad de selección). */
  @Input({ required: true }) slugsFeaturedCaseStudies!: string[];
  /** Máximo de ítems a cargar (por defecto 10). Si hay más slugs, se rellenan con los más recientes. */
  @Input({ required: false }) maxItems = 10;

  readonly caseStudiesData = signal<FeaturedCaseStudyCardsView[]>([]);
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
    this.loadContent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const slugsChange = changes['slugsFeaturedCaseStudies'];
    const categoryChange = changes['featuredCategory'];
    const tagChange = changes['primaryTagSlug'];
    const isBlogsChange = changes['isBlogs'];
    if (slugsChange && !slugsChange.firstChange) {
      this.loadContent();
    } else if (categoryChange && !categoryChange.firstChange) {
      this.loadContent();
    } else if (tagChange && !tagChange.firstChange) {
      this.loadContent();
    } else if (isBlogsChange && !isBlogsChange.firstChange) {
      this.loadContent();
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

  /** Carga blogs o case studies según isBlogs; filtra por categoría y tag. */
  private loadContent(): void {
    const slugs = this.slugsFeaturedCaseStudies;
    if (!slugs?.length) {
      this.loading.set(false);
      return;
    }

    const key = this.slugKey(slugs) + '|' + this.featuredCategory + '|' + (this.primaryTagSlug ?? '') + '|' + this.isBlogs + '|' + this.maxItems;
    if (key === this.lastSlugKey) return;
    this.lastSlugKey = key;

    this.loading.set(true);
    const slugsToPick = slugs.slice(0, this.maxItems);
    const categorySlug = this.featuredCategory;
    const primaryTagSlug = this.primaryTagSlug;

    if (this.isBlogs) {
      this.graphql
        .getBlogs()
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (nodes) => {
            const filtered = [...nodes].filter((n) =>
              n.genContentCategories?.nodes?.find((c) => c.slug === categorySlug)
            );
            let _list = filtered.length > 0 ? filtered : nodes;
            if (primaryTagSlug) {
              const byTag = [..._list].filter((n) =>
                n.genContentTags?.nodes?.find((t) => t.slug === primaryTagSlug)
              );
              _list = byTag.length > 0 ? byTag : _list;
            }
            const list = [..._list].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const bySlug = (s: string) => list.find((c) => c.slug === s);
            const picked: GenContentListNode[] = [];
            for (const slug of slugsToPick) {
              const found = bySlug(slug);
              if (found && !picked.includes(found)) picked.push(found);
            }
            if (picked.length < this.maxItems) {
              const rest = list.filter((c) => !picked.includes(c));
              picked.push(...rest.slice(0, this.maxItems - picked.length));
            }
            const viewList = picked.map((n) => this.mapBlogNodeToView(n));
            this.caseStudiesData.set(viewList);
            if (this.selectedIndex() >= viewList.length) this.selectedIndex.set(0);
            this.loading.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading.set(false);
            this.cdr.markForCheck();
          },
        });
    } else {
      this.graphql
        .getCaseStudies()
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (caseStudies) => {
            const filtered = [...caseStudies].filter((n) =>
              n.caseStudyCategories?.nodes?.find((c) => c.slug === categorySlug)
            );
            let _list = filtered.length > 0 ? filtered : caseStudies;
            if (primaryTagSlug) {
              const byTag = [..._list].filter((n) =>
                n.genContentTags?.nodes?.find((t) => t.slug === primaryTagSlug)
              );
              _list = byTag.length > 0 ? byTag : _list;
            }
            const list = [..._list].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const bySlug = (s: string) => list.find((c) => c.slug === s);
            const picked: CaseStudy[] = [];
            for (const slug of slugsToPick) {
              const found = bySlug(slug);
              if (found && !picked.includes(found)) picked.push(found);
            }
            if (picked.length < this.maxItems) {
              const rest = list.filter((c) => !picked.includes(c));
              picked.push(...rest.slice(0, this.maxItems - picked.length));
            }
            const viewList = picked.map((cs) => this.mapCaseStudyToListView(cs));
            this.caseStudiesData.set(viewList);
            if (this.selectedIndex() >= viewList.length) this.selectedIndex.set(0);
            this.loading.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading.set(false);
            this.cdr.markForCheck();
          },
        });
    }
  }

  /** Mapea GenContentListNode (blog) a FeaturedCaseStudyCardsView. */
  private mapBlogNodeToView(n: GenContentListNode): FeaturedCaseStudyCardsView {
    const tag = n.genContentTags?.nodes?.[0]?.name ?? n.genContentCategories?.nodes?.[0]?.name ?? 'Blog';
    return {
      label: 'Featured Post',
      tag,
      title: n.title ?? '',
      description: n.excerpt?.trim() ?? '',
      image: {
        url: n.featuredImage?.node?.sourceUrl,
        alt: n.featuredImage?.node?.altText ?? undefined,
      },
      cta: {
        primary: {
          text: 'Read more',
          link: `/blog/${n.slug}`,
          backgroundColor: '#1e3a5f',
        },
        secondary: {
          text: 'View all blog',
          link: '/blog',
        },
      },
    };
  }

  /** Mapea CaseStudy (lista Gen Content, misma estructura que post) a FeaturedCaseStudyCardsView. */
  private mapCaseStudyToListView(cs: CaseStudy): FeaturedCaseStudyCardsView {
    const imageUrl = cs.featuredImage?.node?.sourceUrl;
    const imageAlt = cs.featuredImage?.node?.altText ?? undefined;
    const tag =
      cs.caseStudyDetails?.tags?.[0] ??
      cs.caseStudyCategories?.nodes?.[0]?.name ??
      'Case Study';
    const description =
      cs.caseStudyDetails?.cardDescription?.trim() || cs.excerpt || '';

    return {
      label: 'Featured Case Study',
      tag,
      title: cs.title ?? '',
      description,
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
