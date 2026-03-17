import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnDestroy, AfterViewInit, signal, inject, ViewChild, PLATFORM_ID, input, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { StructuredEngagementsSectionComponent } from '../../shared/sections/structured-engagements/structured-engagements';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { FeaturedCaseStudyCategory } from '../../shared/sections/featured-case-study/featured-case-study-category';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";
import { TrustedBySectionComponent } from "../../shared/sections/trusted-by/trusted-by";
import { SvgIcons } from '../../shared/service-icons/service-icons';

interface ServiceArea {
  icon: string;
  badges: string[];
  title: string;
  subtitle: string;
  features: string[];

}

interface ServiceAreasSection {
  tagline: string;
  title: string;
  description: string;
  backgroundImage: string;
  serviceAreas: ServiceArea[];
}

interface SolutionAcceleratorCard {
  icon: string;
  title: string;
  description: string;
}

interface SolutionAcceleratorsSection {
  title: string;
  description: string;
  backgroundImage?: string;
  videoUrls?: string[];
  cards: SolutionAcceleratorCard[];
}

interface FeaturedCaseStudy {
  featuredLabel: string;
  categoryTag: string;
  title: string;
  description: string;
  imageSrc: string;
  primaryCta: {
    text: string;
    link: string;
  };
  secondaryCta: {
    text: string;
    link: string;
  };
}

interface TrustedPartner {
  name: string;
  logo: string;
  alt: string;
}

interface TrustedPartnersSection {
  title: string;
  partners: TrustedPartner[];
}

interface WhyOakwoodFeature {
  icon: string;
  title: string;
  description: string;
}

interface WhyOakwoodSection {
  tagline: string;
  title: string;
  description: string;
  imageSrc: string;
  features: WhyOakwoodFeature[];
}

interface CTASection {
  headline: string;
  subheadline: string;
  primaryCta: {
    text: string;
    link: string;
  };
  secondaryCta: {
    text: string;
    link: string;
  };
}

interface ServiceSeo {
  headTitle?: string;
  headDescription?: string;
  ogImage?: string;
  keywords?: string;
}

interface ServiceContent {
  slug: string;
  title: string;
  description: string;
  backgroundImage?: string;
  videoUrls?: string[];
  /** Optional. SEO meta (title, description, ogImage, keywords). */
  seo?: ServiceSeo;
  mainDescription?: {
    text: string;
  };
  serviceAreas?: ServiceAreasSection;
  /** Slugs para app-featured-case-study (carga case studies desde GraphQL). */
  featuredCaseStudySlugs?: string[];
  solutionAccelerators?: SolutionAcceleratorsSection;
  featuredCaseStudy?: FeaturedCaseStudy;
  trustedPartners?: TrustedPartnersSection;
  whyOakwood?: WhyOakwoodSection;
  ctaSection?: CTASection;
  cta: {
    primary: {
      text: string;
      link: string;
      backgroundColor: string;
    };
    secondary: {
      text: string;
      link: string;
      borderColor: string;
    };
  };
}

export interface ServicesContent {
  services: {
    [key: string]: ServiceContent;
  };
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, RouterLink, VideoHero, FeaturedCaseStudySectionComponent, CtaSectionComponent, TrustedBySectionComponent, StructuredEngagementsSectionComponent],
  templateUrl: './services.html',
  styleUrl: './services.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Services implements OnInit, OnDestroy {
  readonly FeaturedCaseStudyCategory = FeaturedCaseStudyCategory;
  @ViewChild('logoCarousel', { static: false }) logoCarousel!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly graphql = inject(GraphQLContentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seoMeta = inject(SeoMetaService);
  readonly sanitizer = inject(DomSanitizer);
  private routeSubscription?: Subscription;
  private autoScrollInterval?: any;
  private readonly router = inject(Router);
  /** Cuando se proporciona, se usa en lugar de cargar (para preview en edit) */
  readonly contentOverride = input<ServicesContent | null>(null);
  /** Slug del service a mostrar en preview (ej: data-ai-solutions) */
  readonly slugOverride = input<string | null>(null);

  readonly slug = signal<string | null>(null);
  readonly content = signal<ServiceContent | null>(null);
  readonly loading = signal(true);
  /** Slugs de case studies por primary tag (cuando no vienen en featuredCaseStudySlugs). */
  readonly featuredSlugsFromTag = signal<string[]>([]);
  readonly error = signal<string | null>(null);
  readonly structuredData = signal<any>(null);
  readonly structuredEngagementSection = signal<any>(null);
  readonly showStructuredEngagements = signal(true);

  constructor() {
    effect(() => {
      const override = this.contentOverride();
      const slugOverride = this.slugOverride();
      if (override?.services && slugOverride && override.services[slugOverride]) {
        const serviceContent = override.services[slugOverride];
        this.content.set(serviceContent);
        this.slug.set(slugOverride);
        this.loading.set(false);
      }
    });
  }

  getIconSvg(iconKey: string) {
    const svg = SvgIcons[iconKey] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /** ctaSecondary con link (path) + queryParams usando slug del servicio. */
  getCtaSecondary(c: ServiceContent): { text: string; link: string; queryParams?: Record<string, string>; borderColor?: string } | undefined {
    const s = c.cta?.secondary;
    if (!s) return undefined;
    const queryParams = c.slug ? { primaryTag: c.slug } : undefined;
    return { text: s.text, link: s.link, queryParams, borderColor: s.borderColor };
  }

  ngOnInit() {
    // Load structured engagement section from CMS (GraphQL) or fallback to JSON
    this.graphql.getStructuredEngagementsContent().subscribe({
      next: (data) => {
        if (data) {
          this.structuredEngagementSection.set(data);
        } else {
          this.loadStructuredEngagementFromStaticFile();
        }
      },
      error: () => this.loadStructuredEngagementFromStaticFile(),
    });

    // Subscribe to route params to handle navigation changes
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slugParam = params.get('slug');
      this.slug.set(slugParam);
      // Hide structured engagements for specific slugs
      if (slugParam === 'modern-work' || slugParam === 'managed-services') {
        this.showStructuredEngagements.set(false);
      } else {
        this.showStructuredEngagements.set(true);
      }
      // Set activeTab on every navigation if structuredEngagementSection is loaded
      const section = this.structuredEngagementSection();
      if (section) {
        if (slugParam === 'data-ai-solutions') {
          section.activeTab = 'Data and AI';
        } else if (slugParam === 'cloud-and-infrastructure') {
          section.activeTab = 'Cloud and Infrastructure';
        } else if (slugParam === 'application-innovation') {
          section.activeTab = 'Application Innovation';
        } else if (slugParam === 'high-performance-computing-hpc') {
          section.activeTab = 'High Performance Computing (HPC)';
        }
        this.structuredEngagementSection.set({ ...section });
      }
      this.loadContent();
    });
  }

  private loadStructuredEngagementFromStaticFile() {
    this.http.get<any>('/structured-engagement-section.json').subscribe({
      next: (data) => this.structuredEngagementSection.set(data),
      error: (err) => console.error('Error loading structured engagement section:', err),
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Start auto-scrolling the logo carousel
      this.autoScrollInterval = setInterval(() => {
        if (this.logoCarousel && this.logoCarousel.nativeElement) {
          const carousel = this.logoCarousel.nativeElement;
          const scrollAmount = 1; // pixels per interval for smooth continuous scroll
          carousel.scrollLeft += scrollAmount;

          // Reset scroll to beginning when reaching the end for infinite loop
          if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
            carousel.scrollLeft = 0;
          }
        }
      }, 20); // 20ms interval for smooth scrolling
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  private updateMetadata(content: ServiceContent) {
    if (!isPlatformBrowser(this.platformId)) return;

    const s = content.seo;
    const title = s?.headTitle?.trim() || `${content.title} | Oakwood Systems`;
    const description = s?.headDescription?.trim() || content.mainDescription?.text || content.description;
    const image = s?.ogImage?.trim() || content.backgroundImage;
    this.seoMeta.updateMeta({
      title,
      description,
      canonicalPath: `/services/${content.slug}`,
      image,
      keywords: s?.keywords?.trim() || undefined,
    });
  }

  private updateStructuredData(content: ServiceContent) {
    const structuredDataObj = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': content.title,
      'description': content.mainDescription?.text || content.description,
      'provider': {
        '@type': 'Organization',
        'name': 'Oakwood Systems',
        'url': 'https://oakwoodsys.com'
      },
      'url': `https://oakwoodsys.com/services/${content.slug}`
    };
    this.structuredData.set(structuredDataObj);
  }

  getStructuredDataJson(): string {
    const data = this.structuredData();
    return data ? JSON.stringify(data) : '';
  }

  scrollLogos(direction: 'left' | 'right') {
    if (!isPlatformBrowser(this.platformId) || !this.logoCarousel) {
      return;
    }

    const carousel = this.logoCarousel.nativeElement;
    const scrollAmount = 300; // pixels to scroll

    if (direction === 'left') {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  /** Slugs para app-featured-case-study: desde contenido JSON, por primary tag del servicio, o por defecto. */
  getSlugsForFeaturedSection(): string[] {
    const slugs = this.content()?.featuredCaseStudySlugs;
    if (Array.isArray(slugs) && slugs.length > 0) return slugs;
    const fromTag = this.featuredSlugsFromTag();
    if (fromTag.length > 0) return fromTag;
    return [
      'secure-azure-research-environment-architecture',
      'enterprise-reporting-and-data-roadmap-development',
    ];
  }

  private loadContent() {
    if (this.contentOverride()) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const slugValue = this.slug();
    if (!slugValue) {
      this.loading.set(false);
      return;
    }
    // 1) Direct fetch (bypassa GraphQL y caché). /api/cms se proxea a WordPress en dev.
    const cmsUrl = `/api/cms/service-${slugValue}.json?t=${Date.now()}`;
    this.http.get<ServicesContent>(cmsUrl, { responseType: 'json' }).pipe(take(1)).subscribe({
      next: (data) => {
        if (data?.services) {
          this.applyServicesContent(data as ServicesContent);
        } else {
          this.loadFromGraphQLOrStatic();
        }
      },
      error: () => this.loadFromGraphQLOrStatic(),
    });
  }

  private loadFromGraphQLOrStatic() {
    const slugValue = this.slug();
    if (!slugValue) {
      this.loading.set(false);
      return;
    }
    this.graphql.servicesContent$.pipe(take(1)).subscribe((preloaded) => {
      if (preloaded?.services && preloaded.services[slugValue]) {
        this.applyServicesContent(preloaded as ServicesContent);
        return;
      }
      this.graphql.getServicesContent().pipe(take(1)).subscribe({
        next: (data) => {
          if (data?.services) {
            this.applyServicesContent(data as ServicesContent);
          } else {
            this.loadServicesFromStaticFile();
          }
        },
        error: () => this.loadServicesFromStaticFile(),
      });
    });
  }

  private applyServicesContent(data: ServicesContent) {
    const slugValue = this.slug();
    if (slugValue && data.services[slugValue]) {
      const serviceContent = data.services[slugValue];
      this.content.set(serviceContent);
      this.updateMetadata(serviceContent);
      this.updateStructuredData(serviceContent);
      if (!serviceContent.featuredCaseStudySlugs?.length && slugValue) {
        this.graphql.getCaseStudySlugsByTag(slugValue, 2).subscribe({
          next: (slugs) => this.featuredSlugsFromTag.set(slugs),
          error: () => this.featuredSlugsFromTag.set([]),
        });
      } else {
        this.featuredSlugsFromTag.set([]);
      }
    } else {
      this.error.set(`Service "${slugValue}" not found`);
      this.featuredSlugsFromTag.set([]);
      this.router.navigate(['/404']);
    }
    this.loading.set(false);
  }

  private loadServicesFromStaticFile() {
    const slugValue = this.slug();
    if (!slugValue) {
      this.error.set('Service slug is required');
      this.loading.set(false);
      return;
    }
    this.http.get<ServicesContent>(`/service-${slugValue}.json`).subscribe({
      next: (data) => this.applyServicesContent(data),
      error: () => {
        this.error.set('Failed to load service content');
        this.featuredSlugsFromTag.set([]);
        this.loading.set(false);
      },
    });
  }
}
