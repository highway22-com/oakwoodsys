import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GraphQLContentService } from '../../../app/services/graphql-content.service';
import { getAcfMediaUrl, type CaseStudyBy } from '../../../app/api/graphql';
import {
  CaseStudyDetailComponent,
  type CaseStudyDetailData,
  type CaseStudyDetailCard,
} from '../case-study-detail/case-study-detail.component';
import { ContentLoaderComponent } from '../../../shared/content-loader/content-loader.component';

@Component({
  selector: 'app-case-study-detail-page',
  standalone: true,
  imports: [CommonModule, CaseStudyDetailComponent, ContentLoaderComponent],
  templateUrl: './case-study-detail-page.component.html',
  styleUrl: './case-study-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyDetailPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly contentService = inject(GraphQLContentService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly detail = signal<CaseStudyDetailData | null>(null);
  readonly tableOfContents = signal<{ id: string; text: string }[]>([]);
  readonly activeSection = signal<string>('overview');
  readonly latestInsights = signal<CaseStudyDetailCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<unknown>(null);

  private scrollListener: (() => void) | null = null;

  private static readonly TOC = [
    { id: 'overview', text: 'Overview' },
    { id: 'business-challenge', text: 'Business Challenge' },
    { id: 'solution', text: 'Solution' },
    { id: 'testimonial', text: 'Testimonial' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadCaseStudy(slug);
      } else {
        this.detail.set(null);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
  }

  scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
      this.activeSection.set(sectionId);
    }
  }

  /** Recibe el TOC calculado por el hijo (secciones + h1–h5 del HTML) para el scroll listener. */
  onTableOfContentsReady(toc: { id: string; text: string }[]): void {
    this.tableOfContents.set([...toc, { id: 'related-resources', text: 'Related Resources' }]);
  }

  private loadCaseStudy(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.detail.set(null);

    this.contentService.getCaseStudyBySlug(slug).subscribe({
      next: (caseStudy) => {
        if (caseStudy) {
          const data = this.transformToDetail(caseStudy);
          this.detail.set(data);
          this.tableOfContents.set(CaseStudyDetailPageComponent.TOC);
          this.setupScrollListener();
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.scrollToFragmentFromUrl(), 300);
            this.contentService.getCaseStudies().subscribe({
              next: (nodes) => {
                const cards: CaseStudyDetailCard[] = nodes.slice(0, 3).map((n) => ({
                  id: n.id,
                  image: getAcfMediaUrl(n.caseStudyDetails?.heroImage) || n.featuredImage?.node?.sourceUrl || '/assets/resources/default.jpg',
                  category: n.caseStudyCategories?.nodes?.[0]?.name || 'Uncategorized',
                  title: n.title,
                  description: this.cleanExcerpt(n.excerpt),
                  link: `/resources/case-studies/${n.slug}`,
                  slug: n.slug,
                }));
                this.latestInsights.set(cards);
              },
            });
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  private transformToDetail(node: CaseStudyBy): CaseStudyDetailData {
    const acf = node.caseStudyDetails || {};
    const relatedCaseStudies: CaseStudyDetailCard[] = (acf.relatedCaseStudies?.nodes ?? []).map((r) => ({
      id: r.id,
      image: r.featuredImage?.node?.sourceUrl || '',
      category: r.caseStudyCategories?.nodes?.[0]?.name || 'Uncategorized',
      title: r.title,
      description: this.cleanExcerpt(r.excerpt),
      link: `/resources/case-studies/${r.slug}`,
      slug: r.slug,
    }));
    const connectedServices = (acf.connectedServices ?? []).map((s, i) => ({
      id: String(i + 1),
      icon: s.serviceIcon || 'fa-circle',
      title: s.serviceTitle || '',
      description: s.serviceDescription || '',
      link: s.serviceLink || '#',
      slug: s.serviceSlug || '',
    }));
    return {
      slug: node.slug,
      title: node.title,
      heroImage:
        getAcfMediaUrl(acf.heroImage) ||
        node.featuredImage?.node?.sourceUrl ||
        '/assets/case-studies/default.jpg',
      tags: acf.tags ?? [],
      overview: acf.overview ?? '',
      businessChallenge: acf.businessChallenge ?? '',
      solution: acf.solution ?? '',
      solutionImage:
        getAcfMediaUrl(acf.solutionImage) ??
        getAcfMediaUrl(acf.heroImage) ??
        node.featuredImage?.node?.sourceUrl ??
        undefined,
      testimonial:
        acf.testimonial?.testimonialQuote
          ? {
              company: acf.testimonial.testimonialCompany ?? '',
              companyLogo: getAcfMediaUrl(acf.testimonial.testimonialCompanyLogo as never),
              quote: acf.testimonial.testimonialQuote,
              author: acf.testimonial.testimonialAuthor ?? '',
              role: acf.testimonial.testimonialRole ?? '',
            }
          : undefined,
      relatedCaseStudies,
      connectedServices,
    };
  }

  private cleanExcerpt(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '...').trim();
  }

  private setupScrollListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.removeScrollListener();
    const listener = (): void => {
      const toc = this.tableOfContents();
      const y = window.scrollY + 200;
      for (let i = toc.length - 1; i >= 0; i--) {
        const el = document.getElementById(toc[i].id);
        if (el && el.offsetTop <= y) {
          this.activeSection.set(toc[i].id);
          break;
        }
      }
    };
    this.scrollListener = listener;
    window.addEventListener('scroll', listener, { passive: true });
  }

  private removeScrollListener(): void {
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  /** Igual que post: si la URL tiene fragment (TOC o búsqueda navbar), hace scroll a esa posición. */
  private scrollToFragmentFromUrl(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const decoded = decodeURIComponent(raw).trim();
    if (!decoded) return;

    const byId = document.getElementById(decoded);
    if (byId) {
      this.scrollToSection(decoded);
      return;
    }

    const container = document.querySelector('.blog-content');
    if (!container) return;
    const searchText = decoded.toLowerCase();
    const candidates = container.querySelectorAll('p, li, h2, h3, h4, blockquote, section');
    for (const el of candidates) {
      if ((el.textContent ?? '').toLowerCase().includes(searchText)) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
        if (el.id) this.activeSection.set(el.id);
        break;
      }
    }
  }
}
