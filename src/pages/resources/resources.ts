import { ChangeDetectionStrategy, Component, signal, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { getAcfMediaUrl, type CaseStudy } from '../../app/api/graphql';

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

@Component({
  selector: 'app-resources',
  imports: [CommonModule, RouterLink],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resources implements OnInit {
  selectedFilter = signal<string>('All');
  searchQuery = signal<string>('');
  private readonly contentService = inject(GraphQLContentService);

  filters = [
    'All',
    'Data & AI',
    'Data Center',
    'Application Innovation',
    'High-Performance Computing (HPC)',
    'Modern Work',
    'Managed Services'
  ];

  /** First 3 resource cards for the "Latest Insights" section (shared template). */
  get latestInsights(): ResourceCard[] {
    return this.resourceCards.slice(0, 3);
  }

  /** Featured case study: cargado desde WordPress (o fallback a primera card estática). */
  featuredCaseStudy = signal<FeaturedCaseStudy | null>(null);

  resourceCards: ResourceCard[] = [];

  private platformId = inject(PLATFORM_ID);

  filteredResources = signal<ResourceCard[]>(this.resourceCards);

  constructor() {}

  ngOnInit(): void {
    this.loadFeaturedCaseStudyFromWordPress();
    if (this.resourceCards.length > 0 && this.featuredCaseStudy() === null) {
      this.featuredCaseStudy.set(this.getFeaturedCaseStudyFromCard(this.resourceCards[0], 1));
    }
  }

  /**
   * Carga el featured case study desde WordPress.
   * El request GraphQL (GET_CASE_STUDIES) se ejecuta dentro de
   * GraphQLContentService.getCaseStudies() → Apollo → /api/graphql.
   */
  private loadFeaturedCaseStudyFromWordPress(): void {
    this.contentService.getCaseStudies().subscribe({
      next: (nodes) => {
        if (!nodes?.length) return;
        const featured =
          nodes.find((cs) => cs?.caseStudyDetails?.tags?.includes('Featured')) ?? nodes[0];
        if (featured?.id && featured?.title != null) {
          this.featuredCaseStudy.set(
            this.transformToFeaturedCaseStudy(featured, this.featuredCarouselSize)
          );
        }
      },
      error: () => {
        // Fallback en ngOnInit usará resourceCards[0]
      },
    });
  }

  private cleanExcerpt(excerpt: string): string {
    if (!excerpt) return '';
    return excerpt.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim();
  }

  private transformToFeaturedCaseStudy(
    node: CaseStudy,
    total: number
  ): FeaturedCaseStudy {
    return {
      id: node.id,
      image:
        getAcfMediaUrl(node.caseStudyDetails?.heroImage) ||
        node.featuredImage?.node?.sourceUrl ||
        '/assets/case-studies/default.jpg',
      title: node.title,
      description: this.cleanExcerpt(node.excerpt),
      link: `/resources/case-studies/${node.slug}`,
      currentIndex: 1,
      total,
    };
  }

  selectFilter(filter: string) {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.resourceCards];

    // Filter by category
    if (this.selectedFilter() !== 'All') {
      filtered = filtered.filter(card => card.category === this.selectedFilter());
    }

    // Filter by search query
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

  /** Number of cards shown in the featured carousel (first N from resourceCards). */
  private readonly featuredCarouselSize = 4;

  private getFeaturedCaseStudyFromCard(card: ResourceCard, currentIndex: number): FeaturedCaseStudy {
    return {
      id: card.id,
      image: card.image,
      title: card.title,
      description: card.description,
      link: card.link,
      currentIndex,
      total: this.featuredCarouselSize
    };
  }

  nextCaseStudy() {
    const current = this.featuredCaseStudy();
    if (!current || current.currentIndex >= current.total) return;
    const newIndex = current.currentIndex + 1;
    const card = this.resourceCards[newIndex - 1];
    if (card) {
      this.featuredCaseStudy.set(this.getFeaturedCaseStudyFromCard(card, newIndex));
    }
  }

  prevCaseStudy() {
    const current = this.featuredCaseStudy();
    if (!current || current.currentIndex <= 1) return;
    const newIndex = current.currentIndex - 1;
    const card = this.resourceCards[newIndex - 1];
    if (card) {
      this.featuredCaseStudy.set(this.getFeaturedCaseStudyFromCard(card, newIndex));
    }
  }
}
