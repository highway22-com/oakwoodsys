import { ChangeDetectionStrategy, Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Apollo } from 'apollo-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { getAcfMediaUrl, GET_CASE_STUDIES, GET_CASE_STUDY_BY_SLUG } from '../../app/api/graphql';
import type {
  CaseStudy,
  CaseStudyBy,
  CaseStudiesResponse,
  CaseStudyByResponse,
} from '../../app/api/graphql';
import { VideoHero } from "../../shared/video-hero/video-hero";

/** Contenido de la página Resources (resources-content.json). */
export interface ResourcesPageContent {
  page?: string;
  videoHero?: {
    videoUrls?: string[];
    title?: string;
    description?: string;
    ctaPrimary?: { text?: string; link?: string; backgroundColor?: string };
    ctaSecondary?: { text?: string; link?: string; borderColor?: string };
  };
  hero?: {
    title?: string;
    description?: string;
    backgroundImage?: string;
    ctaPrimary?: { text?: string; link?: string };
    ctaSecondary?: { text?: string; link?: string };
  };
  featuredCaseStudy?: { label?: string; readMoreText?: string };
  filterAndSearch?: { searchPlaceholder?: string; emptyStateMessage?: string };
  resourcesGrid?: { loadMoreText?: string; readMoreText?: string };
  ctaSection?: {
    title?: string;
    description?: string;
    ctaPrimary?: { text?: string; link?: string };
    ctaSecondary?: { text?: string; link?: string };
  };
}

interface ResourceCard {
  id: string;
  image: string;
  category: string;
  date: string;
  title: string;
  description: string;
  link: string;
  slug: string;
}

interface FeaturedCaseStudy {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  currentIndex: number;
  total: number;
}

interface CaseStudyDetail {
  slug: string;
  title: string;
  heroImage: string;
  tags: string[];
  overview: string;
  businessChallenge: string;
  solution: string;
  solutionImage?: string;
  testimonial?: {
    company: string;
    companyLogo?: string;
    quote: string;
    author: string;
    role: string;
  };
  relatedCaseStudies: ResourceCard[];
  connectedServices: {
    id: string;
    icon: string;
    title: string;
    description: string;
    link: string;
    slug: string;
  }[];
}

@Component({
  selector: 'app-resources-wordpress',
  imports: [CommonModule, RouterLink, VideoHero],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resources implements OnInit {
  slug: string | null = null;
  selectedFilter = signal<string>('All');
  searchQuery = signal<string>('');
  private readonly apollo = inject(Apollo);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  /** Contenido estático de la página (hero, CTAs, textos) desde resources-content.json. */
  readonly pageContent = signal<ResourcesPageContent | null>(null);

  /** Filtros derivados de las categorías de los case studies (GraphQL). */
  get filters(): string[] {
    const categories = [...new Set(this.resourceCards().map((c) => c.category).filter(Boolean))];
    return ['All', ...categories.sort()];
  }

  // Signals para datos de WordPress
  readonly resourceCards = signal<ResourceCard[]>([]);
  readonly featuredCaseStudy = signal<FeaturedCaseStudy | null>(null);
  readonly caseStudyDetail = signal<CaseStudyDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);
  readonly activeSection = signal<string>('overview');
  readonly tableOfContents = signal<{ id: string; text: string }[]>([]);

  filteredResources = signal<ResourceCard[]>([]);

  /** First 3 resource cards for the "Latest Insights" section (shared template). */
  get latestInsights(): ResourceCard[] {
    return this.resourceCards().slice(0, 3);
  }

  constructor(private route: ActivatedRoute) {
    // Listen to route parameter changes
    this.route.paramMap.subscribe(params => {
      const newSlug = params.get('slug');
      this.slug = newSlug;

      if (newSlug) {
        this.loadCaseStudyDetail(newSlug);
      } else {
        this.loadCaseStudiesList();
      }
    });
  }

  ngOnInit() {
    this.loadPageContent();
    if (!this.slug) {
      this.loadCaseStudiesList();
    }
  }

  private loadPageContent() {
    this.http.get<ResourcesPageContent>('/resources-content.json').subscribe({
      next: (data) => this.pageContent.set(data),
      error: () => this.pageContent.set(null),
    });
  }

  /** Video hero: valores por defecto si no hay JSON (tipos requeridos por app-video-hero). */
  videoHeroContent(): {
    videoUrls: string[];
    title: string;
    description: string;
    ctaPrimary: { text: string; link: string; backgroundColor: string };
    ctaSecondary: { text: string; link: string; borderColor: string };
  } {
    const c = this.pageContent()?.videoHero;
    return {
      videoUrls: c?.videoUrls?.length ? c.videoUrls : [
        'https://oakwoodsys.com/wp-content/uploads/2025/12/home.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/1.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/2.mp4',
        'https://oakwoodsys.com/wp-content/uploads/2025/12/4.mp4',
      ],
      title: c?.title ?? 'Turn Data and AI Into Real Business Outcomes',
      description: c?.description ?? 'Explore case studies and insights from projects built on Azure.',
      ctaPrimary: {
        text: c?.ctaPrimary?.text ?? 'Watch the video',
        link: c?.ctaPrimary?.link ?? '/',
        backgroundColor: c?.ctaPrimary?.backgroundColor ?? '#1A63C9',
      },
      ctaSecondary: {
        text: c?.ctaSecondary?.text ?? 'View Resources',
        link: c?.ctaSecondary?.link ?? '/resources',
        borderColor: c?.ctaSecondary?.borderColor ?? '#ffffff',
      },
    };
  }

  /** Hero (sección con imagen de fondo): valores por defecto si no hay JSON. */
  heroContent() {
    const h = this.pageContent()?.hero;
    return {
      title: h?.title ?? 'Discover Our Impact Through Realized Projects',
      description: h?.description ?? 'Real solutions built on Azure AI that solve real problems, not theoretical ones.',
      backgroundImage: h?.backgroundImage ?? '/assets/resources/hero-background.jpg',
      ctaPrimary: h?.ctaPrimary ?? { text: 'Schedule a Consultation', link: '/contact-us' },
      ctaSecondary: h?.ctaSecondary ?? { text: 'View Resources', link: '/resources', borderColor: '#ffffff' },
    };
  }

  featuredCaseStudyLabel(): string {
    return this.pageContent()?.featuredCaseStudy?.label ?? 'FEATURED CASE STUDY';
  }

  featuredCaseStudyReadMore(): string {
    return this.pageContent()?.featuredCaseStudy?.readMoreText ?? 'Read More';
  }

  searchPlaceholder(): string {
    return this.pageContent()?.filterAndSearch?.searchPlaceholder ?? 'Search';
  }

  emptyStateMessage(): string {
    return this.pageContent()?.filterAndSearch?.emptyStateMessage ?? 'No resources found matching your criteria.';
  }

  loadMoreText(): string {
    return this.pageContent()?.resourcesGrid?.loadMoreText ?? 'Load More';
  }

  readMoreText(): string {
    return this.pageContent()?.resourcesGrid?.readMoreText ?? 'Read More';
  }

  ctaSectionContent() {
    const c = this.pageContent()?.ctaSection;
    return {
      title: c?.title ?? "Let's move your vision forward",
      description: c?.description ?? 'Connect with a team committed to helping you modernize, innovate, and achieve meaningful results.',
      ctaPrimary: c?.ctaPrimary ?? { text: 'Talk to an expert', link: '/contact-us' },
      ctaSecondary: c?.ctaSecondary ?? { text: 'Schedule a call', link: '/contact-us' },
    };
  }

  get isDetailView(): boolean {
    return this.slug !== null && this.caseStudyDetail() !== null;
  }

  // Query GraphQL para lista de casos de estudio (query centralizada en api/graphql.ts)
  private loadCaseStudiesList() {
    this.loading.set(true);

    this.apollo
      .watchQuery<CaseStudiesResponse>({
        query: GET_CASE_STUDIES,
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe({
        next: (result) => {
          const data = result.data as CaseStudiesResponse | undefined;
          const nodes = (data?.caseStudies?.nodes ?? []) as CaseStudy[];
          if (nodes.length) {
            const cards = this.transformToResourceCards(nodes);
            this.resourceCards.set(cards);
            this.filteredResources.set(cards);

            const featured =
              nodes.find((cs) => cs?.caseStudyDetails?.tags?.includes('Featured')) ?? nodes[0];
            if (featured) {
              this.featuredCaseStudy.set(
                this.transformToFeaturedCaseStudy(featured, nodes.length)
              );
            }
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading case studies:', error);
          this.error.set(error);
          this.loading.set(false);
        },
      });
  }

  // Query GraphQL para detalle de caso de estudio (query centralizada en api/graphql.ts)
  private loadCaseStudyDetail(slug: string) {
    this.loading.set(true);

    this.apollo
      .watchQuery<CaseStudyByResponse>({
        query: GET_CASE_STUDY_BY_SLUG,
        variables: { slug },
        fetchPolicy: 'network-only',
      })
      .valueChanges.subscribe({
        next: (result) => {
          const data = result.data as CaseStudyByResponse | undefined;
          const caseStudy = data?.caseStudyBy ?? null;
          if (caseStudy) {
            this.caseStudyDetail.set(this.transformToCaseStudyDetail(caseStudy as CaseStudyBy));
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                this.setupScrollListener();
                this.extractTableOfContents();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }
          } else {
            this.error.set('Case study not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading case study:', error);
          this.error.set(error);
          this.loading.set(false);
        },
      });
  }

  // Transformar datos de GraphQL a ResourceCard (imagen: hero ACF como en featured-case-study, luego featuredImage)
  private transformToResourceCards(nodes: CaseStudy[]): ResourceCard[] {
    return nodes.map((node) => ({
      id: node.id,
      image: getAcfMediaUrl(node.caseStudyDetails?.heroImage) || node.featuredImage?.node?.sourceUrl || '/assets/resources/default.jpg',
      category: node.caseStudyCategories?.nodes?.[0]?.name || 'Uncategorized',
      date: this.formatDate(node.date),
      title: node.title,
      description: this.cleanExcerpt(node.excerpt),
      link: `/resources/case-studies/${node.slug}`,
      slug: node.slug
    }));
  }

  // Transformar a FeaturedCaseStudy (total desde GraphQL: cantidad de case studies)
  private transformToFeaturedCaseStudy(node: CaseStudy, total: number): FeaturedCaseStudy {
    return {
      id: node.id,
      image: getAcfMediaUrl(node.caseStudyDetails?.heroImage) || node.featuredImage?.node?.sourceUrl || '/assets/case-studies/default.jpg',
      title: node.title,
      description: this.cleanExcerpt(node.excerpt),
      link: `/resources/case-studies/${node.slug}`,
      currentIndex: 1,
      total: Math.max(1, total),
    };
  }

  // Transformar a CaseStudyDetail
  private transformToCaseStudyDetail(node: CaseStudyBy): CaseStudyDetail {
    const acf = node.caseStudyDetails || {};

    // Transformar related case studies (imagen: hero ACF como en featured-case-study, luego featuredImage)
    const relatedCaseStudies: ResourceCard[] = (acf.relatedCaseStudies?.nodes || []).map((related: any) => ({
      id: related.id,
      image: getAcfMediaUrl(related.caseStudyDetails?.heroImage) || related.featuredImage?.node?.sourceUrl || '/assets/resources/default.jpg',
      category: related.caseStudyCategories?.nodes?.[0]?.name || 'Uncategorized',
      date: this.formatDate(related.date),
      title: related.title,
      description: this.cleanExcerpt(related.excerpt),
      link: `/resources/case-studies/${related.slug}`,
      slug: related.slug
    }));

    // Transformar connected services
    const connectedServices = (acf.connectedServices || []).map((service: any, index: number) => ({
      id: String(index + 1),
      icon: service.serviceIcon || 'fa-circle',
      title: service.serviceTitle || '',
      description: service.serviceDescription || '',
      link: service.serviceLink || '#',
      slug: service.serviceSlug || ''
    }));

    return {
      slug: node.slug,
      title: node.title,
      heroImage: getAcfMediaUrl(acf.heroImage) || node.featuredImage?.node?.sourceUrl || '/assets/case-studies/default.jpg',
      tags: acf.tags || [],
      overview: acf.overview || '',
      businessChallenge: acf.businessChallenge || '',
      solution: acf.solution || '',
      solutionImage: getAcfMediaUrl(acf.solutionImage),
      testimonial: acf.testimonial?.testimonialQuote ? {
        company: acf.testimonial.testimonialCompany || '',
        companyLogo: getAcfMediaUrl(acf.testimonial.testimonialCompanyLogo as any),
        quote: acf.testimonial.testimonialQuote,
        author: acf.testimonial.testimonialAuthor || '',
        role: acf.testimonial.testimonialRole || ''
      } : undefined,
      relatedCaseStudies,
      connectedServices
    };
  }

  // Utilidades
  private cleanExcerpt(excerpt: string): string {
    if (!excerpt) return '';
    return excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim();
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Métodos de filtrado (mantener los existentes)
  selectFilter(filter: string) {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.resourceCards()];

    if (this.selectedFilter() !== 'All') {
      filtered = filtered.filter(card => card.category === this.selectedFilter());
    }

    if (this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.category.toLowerCase().includes(query)
      );
    }

    this.filteredResources.set(filtered);
  }

  nextCaseStudy() {
    const featured = this.featuredCaseStudy();
    if (featured && featured.currentIndex < featured.total) {
      this.featuredCaseStudy.set({
        ...featured,
        currentIndex: featured.currentIndex + 1
      });
    }
  }

  prevCaseStudy() {
    const featured = this.featuredCaseStudy();
    if (featured && featured.currentIndex > 1) {
      this.featuredCaseStudy.set({
        ...featured,
        currentIndex: featured.currentIndex - 1
      });
    }
  }

  private extractTableOfContents(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Table of contents is already set in transformToCaseStudyDetail
    this.tableOfContents.set([
      { id: 'overview', text: 'Overview' },
      { id: 'business-challenge', text: 'Business Challenge' },
      { id: 'solution', text: 'Solution' },
      { id: 'testimonial', text: 'Testimonial' }
    ]);
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const listener = () => {
      const toc = this.tableOfContents();
      if (toc.length === 0) return;

      const scrollPosition = window.scrollY + 200;

      for (let i = toc.length - 1; i >= 0; i--) {
        const element = document.getElementById(toc[i].id);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            this.activeSection.set(toc[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', listener, { passive: true });
  }

  scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.activeSection.set(sectionId);
    }
  }
}
