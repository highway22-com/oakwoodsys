import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnDestroy, AfterViewInit, signal, inject, ViewChild, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { Subscription } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { StructuredEngagementsSectionComponent } from '../../shared/sections/structured-engagements/structured-engagements';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
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

interface ServiceContent {
  slug: string;
  title: string;
  description: string;
  backgroundImage?: string;
  videoUrls?: string[];
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

interface ServicesContent {
  services: {
    [key: string]: ServiceContent;
  };
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, RouterLink, VideoHero, FeaturedCaseStudySectionComponent, CtaSectionComponent, TrustedBySectionComponent,StructuredEngagementsSectionComponent],
  templateUrl: './services.html',
  styleUrl: './services.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Services implements OnInit, OnDestroy {
  @ViewChild('logoCarousel', { static: false }) logoCarousel!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seoMeta = inject(SeoMetaService);
  readonly sanitizer = inject(DomSanitizer);
  private routeSubscription?: Subscription;
  private autoScrollInterval?: any;
  private readonly router = inject(Router);
  readonly slug = signal<string | null>(null);
  readonly content = signal<ServiceContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly structuredData = signal<any>(null);
  readonly structuredEngagementSection = signal<any>(null);
  readonly showStructuredEngagements = signal(true);

    getIconSvg(iconKey: string) {
      const svg = SvgIcons[iconKey] || '';
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    }

  ngOnInit() {
    // Set default meta description for services pages
    this.setDefaultMetadata();

    // Load structured engagement section from JSON
    this.http.get<any>('/structured-engagement-section.json').subscribe({
      next: (data) => {
        this.structuredEngagementSection.set(data);
      },
      error: (error) => {
        console.error('Error loading structured engagement section:', error);
      }
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
        if (slugParam === 'data-and-ai') {
          section.activeTab = 'Data and AI';
        } else if (slugParam === 'cloud-and-infrastructure') {
          section.activeTab = 'Cloud and Infrastructure';
        } else if (slugParam === 'application-innovation') {
          section.activeTab = 'Application Innovation';
        } else if (slugParam === 'high-performance-computing') {
          section.activeTab = 'High Performance Computing (HPC)';
        }
        this.structuredEngagementSection.set({ ...section });
      }
      this.loadContent();
    });
  }

  private setDefaultMetadata() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.seoMeta.updateMeta({
      title: 'Services | Oakwood Systems',
      description: 'Explore Oakwood Systems\' Microsoft services including Data & AI, Cloud Infrastructure, Application Innovation, High-Performance Computing, Modern Work, and Managed Services.',
      canonicalPath: '/services',
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

    const description = content.mainDescription?.text || content.description;
    this.seoMeta.updateMeta({
      title: `${content.title} | Oakwood Systems`,
      description,
      canonicalPath: `/services/${content.slug}`,
      image: content.backgroundImage,
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

  /** Slugs para app-featured-case-study (desde contenido del servicio o por defecto). */
  getSlugsForFeaturedSection(): string[] {
    const slugs = this.content()?.featuredCaseStudySlugs;
    if (Array.isArray(slugs) && slugs.length > 0) return slugs;
    return [
      'secure-azure-research-environment-architecture',
      'secure-azure-research-environment-architecture',
    ];
  }

  private loadContent() {
    this.loading.set(true);
    this.error.set(null);

    // Load services content from JSON
    this.http.get<ServicesContent>('/services-content.json').subscribe({
      next: (data) => {
        const slugValue = this.slug();
        if (slugValue && data.services[slugValue]) {
          const serviceContent = data.services[slugValue];
          this.content.set(serviceContent);
          this.updateMetadata(serviceContent);
          this.updateStructuredData(serviceContent);
        } else {
          this.error.set(`Service "${slugValue}" not found`);
          this.router.navigate(['/404']);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading services content:', error);
        this.error.set('Failed to load service content');
        this.loading.set(false);
      }
    });
  }
}
