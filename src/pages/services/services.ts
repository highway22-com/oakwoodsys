import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnDestroy, signal, inject, ViewChild, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { VideoHero } from '../../shared/video-hero/video-hero';
import { FeaturedCaseStudySectionComponent } from '../../shared/sections/featured-case-study/featured-case-study';
import { CtaSectionComponent } from "../../shared/cta-section/cta-section.component";

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
  imports: [CommonModule, RouterLink, VideoHero, FeaturedCaseStudySectionComponent, CtaSectionComponent],
  templateUrl: './services.html',
  styleUrl: './services.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Services implements OnInit, OnDestroy {
  @ViewChild('logoCarousel', { static: false }) logoCarousel!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  readonly sanitizer = inject(DomSanitizer);
  private routeSubscription?: Subscription;

  readonly slug = signal<string | null>(null);
  readonly content = signal<ServiceContent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly structuredData = signal<any>(null);

  ngOnInit() {
    // Set default meta description for services pages
    this.setDefaultMetadata();

    // Subscribe to route params to handle navigation changes
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slugParam = params.get('slug');
      this.slug.set(slugParam);
      this.loadContent();
    });
  }

  private setDefaultMetadata() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Set default meta description for services pages
    const defaultDescription = 'Explore Oakwood Systems\' Microsoft services including Data & AI, Cloud Infrastructure, Application Innovation, High-Performance Computing, Modern Work, and Managed Services.';
    this.metaService.updateTag({ name: 'description', content: defaultDescription });
    this.titleService.setTitle('Services | Oakwood Systems');
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private updateMetadata(content: ServiceContent) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Update page title
    const pageTitle = `${content.title} | Oakwood Systems`;
    this.titleService.setTitle(pageTitle);

    // Update meta description
    const description = content.mainDescription?.text || content.description;
    this.metaService.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: content.title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: `https://oakwoodsys.com/services/${content.slug}` });
    if (content.backgroundImage) {
      this.metaService.updateTag({ property: 'og:image', content: content.backgroundImage });
    }

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: content.title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });

    // Canonical URL
    const canonicalUrl = `https://oakwoodsys.com/services/${content.slug}`;
    let linkTag = document.querySelector('link[rel="canonical"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'canonical');
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', canonicalUrl);
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
      'enterprise-reporting-and-data-roadmap-development',
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
