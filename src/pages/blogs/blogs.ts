import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  getPrimaryTagName,
  type GenContentListNode,
} from '../../app/api/graphql';
import { type PageHeroBreadcrumb } from '../../shared/page-hero/page-hero.component';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { ButtonPrimaryComponent } from "../../shared/button-primary/button-primary.component";
import { CtaSectionComponent } from '../../shared/cta-section/cta-section.component';
import { BlogCardComponent } from '../../shared/blog-card/blog-card.component';
import { FeaturedCaseStudyCardsSectionComponent } from '../../shared/sections/featured-case-study-cards/featured-case-study';
import { FeaturedCaseStudyCategory } from '../../shared/sections/featured-case-study/featured-case-study-category';
import { readingTimeMinutes } from '../../app/utils/reading-time.util';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { decodeHtmlEntities } from '../../app/utils/cast';
import { ActivatedRoute } from '@angular/router';

interface PostAuthor {
  node: {
    email: string;
    firstName: string;
    id: string;
  };
}

export interface PersonSocialLink {
  platform: string;
  url: string;
}

export interface AuthorPerson {
  id: string;
  name: string | null;
  firstName: string | null;
  position: string | null;
  picture: string | null;
  socialLinks: PersonSocialLink[];
}

export interface FeaturedImageNode {
  sourceUrl: string;
  altText: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  author: PostAuthor;
  tags: string[];
  /** Slugs de tags (desde genContentTags) para filtrar por slug. */
  tagSlugs: string[];
  /** Slug del primary tag (primer tag en genContentTags). */
  primaryTagSlug: string | null;
  primaryTag: string | null;
  authorPerson: AuthorPerson | null;
  featuredImage: { node: FeaturedImageNode } | null;
  sanitizedContent?: SafeHtml;
  sanitizedExcerpt?: SafeHtml;
  /** Head (Gen Content ACF oakwood_* — no chocar con otros plugins SEO). */
  headTitle?: string | null;
  headDescription?: string | null;
  headCanonicalUrl?: string | null;
  headGeoRegion?: string | null;
  headGeoPlacename?: string | null;
  headGeoPosition?: string | null;
  headJsonLdData?: string | null;
}

const INITIAL_LOAD_SIZE = 100;

@Component({
  selector: 'app-bloq',
  imports: [CommonModule, VideoHero, CtaSectionComponent, BlogCardComponent, FeaturedCaseStudyCardsSectionComponent],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Blogs implements OnInit {
  readonly FeaturedCaseStudyCategory = FeaturedCaseStudyCategory;
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoMeta = inject(SeoMetaService);
  private readonly graphql = inject(GraphQLContentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly MOBILE_BREAKPOINT = 768;
  readonly isTabletOrMobile = signal(false);
  readonly filterDropdownOpen = signal(false);

  /** true = blog, false = resources (cuando se reutiliza el componente). */
  readonly isBlogs = this.route.snapshot.data['isBlogs'] ?? true;

  readonly blogHeroBreadcrumbs = (): PageHeroBreadcrumb[] =>
    this.isBlogs
      ? [
        { label: 'Home', routerLink: '/' },
        { label: 'Resources' },
        { label: 'IT Blog' },
      ]
      : [
        { label: 'Home', routerLink: '/' },
        { label: 'Resources' },
        { label: 'Case Studies' },
      ];

  /** Path base para listado (blog o case-studies). */
  readonly listingPath = () => (this.isBlogs ? '/blog' : '/resources/case-studies');
  /** Path base para detalle de post (blog o resources/case-studies). */
  readonly detailPathBase = () => (this.isBlogs ? '/blog' : '/resources/case-studies');

  /** Service lines desde genContentTags (GraphQL). Fallback si vacío. */
  readonly serviceLines = computed(() => {
    const base = this.listingPath();
    const tags = this.graphql.genContentTags();
    if (tags.length > 0) {
      return tags.map((t) => ({ label: t.name, slug: t.slug, link: `${base}?tag=${t.slug}` }));
    }
    return this.defaultServiceLines.map((s) => ({
      ...s,
      slug: s.link.split('/').filter(Boolean).pop() ?? s.label.toLowerCase().replace(/\s+/g, '-'),
    }));
  });

  /** Tags seleccionados para filtrar (slugs). Vacío = mostrar todo. */
  readonly selectedTagSlugs = signal<Set<string>>(new Set());

  /** Featured case study: truthy para mostrar la sección (mismo patrón que resources). */
  readonly featuredCaseStudy = signal<{ id?: string } | null>({ id: '' });

  private static readonly DEFAULT_FEATURED_SLUGS: string[] = [
    'secure-azure-research-environment-architecture',
    'enterprise-reporting-and-data-roadmap-development',
  ];

  getSlugsForFeaturedSection(): string[] {
    return Blogs.DEFAULT_FEATURED_SLUGS;
  }

  videoHeroContent(): {
    videoUrls: string[];
    title: string;
    description: string;
  } {
    return this.isBlogs
      ? {
        videoUrls: ['https://oakwoodsys.com/wp-content/uploads/2026/02/Blogs.mp4'],
        title: 'Discover our impact through realized projects',
        description: "Explore Oakwood's case studies, blogs, webinars, and events.",
      }
      : {
        videoUrls: ['https://oakwoodsys.com/wp-content/uploads/2026/02/Blogs.mp4'],
        title: 'Real-world success stories',
        description: 'See how Oakwood helps organizations modernize, innovate, and achieve meaningful results.',
      };
  }

  toggleTagFilter(slug: string) {
    this.selectedTagSlugs.update((set) => {
      const next = new Set(set);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  /** Limpia los filtros de tags seleccionados. */
  clearFilters(): void {
    this.selectedTagSlugs.set(new Set());
    this.filterDropdownOpen.set(false);
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update((v) => !v);
  }

  closeFilterDropdown(): void {
    this.filterDropdownOpen.set(false);
  }

  /** Cantidad de filtros seleccionados (para mostrar en el trigger). */
  readonly selectedFiltersCount = computed(() => this.selectedTagSlugs().size);

  isTagSelected(slug: string): boolean {
    return this.selectedTagSlugs().has(slug);
  }

  readonly decodeHtmlEntities = decodeHtmlEntities;

  /** Posts filtrados por slugs de tags. Orden: primary tags primero (por orden del selected), luego otros tags. */
  readonly filteredDisplayedNodes = computed(() => {
    const nodes = this.displayedNodes();
    const selected = this.selectedTagSlugs();
    if (selected.size === 0) return nodes;
    const selectedOrder = Array.from(selected);
    const filtered = nodes.filter((post) =>
      post.tagSlugs.some((slug) => selected.has(slug))
    );
    return [...filtered].sort((a, b) => {
      const aPrimaryIndex = a.primaryTagSlug != null ? selectedOrder.indexOf(a.primaryTagSlug) : -1;
      const bPrimaryIndex = b.primaryTagSlug != null ? selectedOrder.indexOf(b.primaryTagSlug) : -1;
      const aHasPrimary = aPrimaryIndex >= 0;
      const bHasPrimary = bPrimaryIndex >= 0;
      if (aHasPrimary && !bHasPrimary) return -1;
      if (!aHasPrimary && bHasPrimary) return 1;
      if (aHasPrimary && bHasPrimary) return aPrimaryIndex - bPrimaryIndex;
      return 0;
    });
  });


  private readonly defaultServiceLines: { label: string; link: string }[] = [
    { label: 'Data & AI Solutions', link: '/services/data-and-ai' },
    { label: 'Cloud & Infrastructure', link: '/services/cloud-and-infrastructure' },
    { label: 'Application Innovation', link: '/services/application-innovation' },
    { label: 'High-Performance Computing (HPC)', link: '/services/high-performance-computing' },
    { label: 'Modern Work', link: '/services/modern-work' },
    { label: 'Managed Services', link: '/services/managed-services' },
  ];

  readonly posts = signal<{ nodes: Post[] } | null>(null);
  /** Lista que se muestra (todos los posts cargados, sin scroll infinito). */
  readonly displayedNodes = computed(() => this.posts()?.nodes ?? []);
  readonly loading = signal(true);
  readonly error = signal<any>(null);

  /** Utilidad de tiempo de lectura (expuesta en template). */
  readonly readingTimeMinutes = readingTimeMinutes;

  /** Autor a mostrar: authorPerson si existe, sino nombre del author WP. */
  authorDisplayName(post: Post): string {
    if (post.authorPerson?.name) return post.authorPerson.name;
    if (post.authorPerson?.firstName) return post.authorPerson.firstName;
    if (post.author?.node?.firstName) return post.author.node.firstName;
    return 'Author';
  }

  private transformNodes(nodes: GenContentListNode[]): Post[] {
    const defaultAuthor: PostAuthor = { node: { email: '', firstName: '', id: '' } };
    return nodes.map((post: GenContentListNode): Post => ({
      id: post.id,
      title: post.title ?? '',
      content: post.content ?? '',
      excerpt: post.excerpt ?? '',
      slug: post.slug ?? '',
      date: post.date ?? '',
      author: post.author
        ? { node: { email: post.author.node?.email ?? '', firstName: post.author.node?.firstName ?? '', id: post.author.node?.id ?? '' } }
        : defaultAuthor,
      tags: post.tags ?? [],
      tagSlugs: post.genContentTags?.nodes?.map((n) => n.slug) ?? [],
      primaryTagSlug: (() => {
        const primaryName = getPrimaryTagName(post.primaryTagName);
        const nodes = post.genContentTags?.nodes ?? [];
        const match = primaryName ? nodes.find((n) => n.name === primaryName) : null;
        return match?.slug ?? nodes[0]?.slug ?? null;
      })(),
      primaryTag: getPrimaryTagName(post.primaryTagName) ?? null,
      authorPerson: post.authorPerson
        ? {
          id: post.authorPerson.id,
          name: post.authorPerson.name ?? null,
          firstName: post.authorPerson.firstName ?? null,
          position: post.authorPerson.position ?? null,
          picture: post.authorPerson.picture ?? null,
          socialLinks: post.authorPerson.socialLinks ?? [],
        }
        : null,
      featuredImage: post.featuredImage
        ? { node: { sourceUrl: post.featuredImage.node.sourceUrl, altText: post.featuredImage.node.altText ?? null } }
        : null,
      sanitizedContent: this.sanitizer.bypassSecurityTrustHtml(post.content ?? ''),
      sanitizedExcerpt:
        post.excerpt && post.excerpt.trim()
          ? this.sanitizer.bypassSecurityTrustHtml(post.excerpt.trim())
          : undefined,
      headTitle: post.headTitle ?? undefined,
      headDescription: post.headDescription ?? undefined,
      headCanonicalUrl: post.headCanonicalUrl ?? undefined,
      headGeoRegion: post.headGeoRegion ?? undefined,
      headGeoPlacename: post.headGeoPlacename ?? undefined,
      headGeoPosition: post.headGeoPosition ?? undefined,
      headJsonLdData: post.headJsonLdData ?? undefined,
    }));
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isTabletOrMobile.set(window.innerWidth < this.MOBILE_BREAKPOINT);
      if (!this.isTabletOrMobile()) this.filterDropdownOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-container')) {
      this.closeFilterDropdown();
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isTabletOrMobile.set(window.innerWidth < this.MOBILE_BREAKPOINT);
    }
    if (this.isBlogs) {
      this.seoMeta.updateMeta({
        title: 'IT Blog | Oakwood Systems',
        description: 'Insights and articles on Microsoft solutions, Azure, Data & AI, cloud migration, and digital transformation from Oakwood Systems.',
        canonicalPath: '/blog',
      });
    } else {
      this.seoMeta.updateMeta({
        title: 'Case Studies | Oakwood Systems',
        description: 'Explore real-world success stories and case studies from Oakwood Systems. See how we help organizations modernize, innovate, and achieve meaningful results.',
        canonicalPath: '/resources/case-studies',
      });
    }
    this.loadFirstPage();
  }

  private loadFirstPage() {
    const categoryId = this.isBlogs ? 'blog' : 'case-study';
    this.graphql
      .getGenContentsPaginated(categoryId, INITIAL_LOAD_SIZE, null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ nodes }) => {
          console.log(nodes);
          if (nodes.length > 0) {
            this.posts.set({ nodes: this.transformNodes(nodes) });
          }
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err);
        },
      });
  }
}
